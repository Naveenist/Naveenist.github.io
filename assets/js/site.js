/* ==========================================================================
   CodeArrive - Global site behaviour
   Navigation, scroll chrome, reveal animations, counters, accordion,
   terminal typewriter, and the footer subscribe form.
   Every module is optional: each init bails out if its markup is absent.
   ========================================================================== */

import {
  qs,
  qsa,
  reducedMotion,
  lockScroll,
  unlockScroll,
  trapFocus,
  submitForm,
  isEmail,
  setFieldError,
} from './ui.js'

/* --------------------------------------------------------------------------
   Navigation
   ------------------------------------------------------------------------ */

function initNav() {
  const nav = qs('.site-nav')
  if (!nav) return

  const toggle = qs('.nav-toggle', nav)
  const sheet = qs('.nav-sheet')
  let lastY = window.scrollY
  let release = null

  // --- Solid background + auto-hide -------------------------------------
  const onScroll = () => {
    const y = window.scrollY
    nav.classList.toggle('is-stuck', y > 8)

    // Never hide the bar while the mobile sheet is open, or near the top
    // where hiding it would look like a glitch.
    const sheetOpen = sheet?.classList.contains('is-open')
    if (!sheetOpen && y > 240) {
      nav.classList.toggle('is-hidden', y > lastY + 4)
    } else {
      nav.classList.remove('is-hidden')
    }
    lastY = y
  }

  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })

  // --- Mobile sheet ------------------------------------------------------
  if (!toggle || !sheet) return

  const setSheet = (open) => {
    toggle.setAttribute('aria-expanded', String(open))
    sheet.classList.toggle('is-open', open)
    sheet.setAttribute('aria-hidden', String(!open))

    if (open) {
      lockScroll()
      release = trapFocus(sheet)
      qs('a', sheet)?.focus({ preventScroll: true })
    } else {
      unlockScroll()
      release?.()
      release = null
    }
  }

  toggle.addEventListener('click', () =>
    setSheet(toggle.getAttribute('aria-expanded') !== 'true'),
  )

  qsa('a', sheet).forEach((link) => link.addEventListener('click', () => setSheet(false)))

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sheet.classList.contains('is-open')) {
      setSheet(false)
      toggle.focus()
    }
  })

  // Returning to a desktop width must not leave a locked scroll behind.
  window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => {
    if (e.matches && sheet.classList.contains('is-open')) setSheet(false)
  })
}

/* --------------------------------------------------------------------------
   Scroll progress bar
   ------------------------------------------------------------------------ */

function initProgress() {
  const bar = qs('.scroll-progress')
  if (!bar) return

  let ticking = false
  const update = () => {
    const doc = document.documentElement
    const max = doc.scrollHeight - doc.clientHeight
    const ratio = max > 0 ? window.scrollY / max : 0
    bar.style.transform = `scaleX(${Math.min(1, Math.max(0, ratio))})`
    ticking = false
  }

  // rAF-throttled: the scroll handler stays cheap on long pages.
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    },
    { passive: true },
  )
  update()
}

/* --------------------------------------------------------------------------
   Back to top
   ------------------------------------------------------------------------ */

function initToTop() {
  const btn = qs('.to-top')
  if (!btn) return

  window.addEventListener(
    'scroll',
    () => btn.classList.toggle('is-shown', window.scrollY > window.innerHeight),
    { passive: true },
  )

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' })
    // Send focus somewhere sensible instead of leaving it on a hidden button.
    qs('.brand')?.focus({ preventScroll: true })
  })
}

/* --------------------------------------------------------------------------
   Scroll reveal
   ------------------------------------------------------------------------ */

function initReveal() {
  const items = qsa('[data-reveal]')
  if (items.length === 0) return

  if (reducedMotion() || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'))
    return
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target) // reveal once, then stop watching
      })
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
  )

  items.forEach((el) => observer.observe(el))
}

/* --------------------------------------------------------------------------
   Count-up statistics
   ------------------------------------------------------------------------ */

function initCounters() {
  const counters = qsa('[data-count]')
  if (counters.length === 0) return

  const render = (el, value) => {
    const suffix = el.dataset.suffix || ''
    el.textContent = value.toLocaleString('en-US') + suffix
  }

  const run = (el) => {
    const target = Number(el.dataset.count) || 0

    if (reducedMotion()) {
      render(el, target)
      return
    }

    const duration = 1600
    const start = performance.now()

    const step = (now) => {
      const t = Math.min(1, (now - start) / duration)
      // easeOutExpo - fast start, long settle. Reads as a readout landing.
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
      render(el, Math.round(target * eased))
      if (t < 1) requestAnimationFrame(step)
    }

    requestAnimationFrame(step)
  }

  if (!('IntersectionObserver' in window)) {
    counters.forEach(run)
    return
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        run(entry.target)
        observer.unobserve(entry.target)
      })
    },
    { threshold: 0.4 },
  )

  counters.forEach((el) => {
    render(el, 0)
    observer.observe(el)
  })
}

/* --------------------------------------------------------------------------
   Accordion
   ------------------------------------------------------------------------ */

function initAccordion() {
  qsa('[data-accordion]').forEach((root) => {
    const triggers = qsa('.accordion__trigger', root)

    const collapse = (trigger) => {
      const panel = document.getElementById(trigger.getAttribute('aria-controls'))
      trigger.setAttribute('aria-expanded', 'false')
      // Pin the current height first so the transition has somewhere to go.
      panel.style.height = `${panel.scrollHeight}px`
      requestAnimationFrame(() => {
        panel.style.height = '0px'
      })
    }

    const expand = (trigger) => {
      const panel = document.getElementById(trigger.getAttribute('aria-controls'))
      trigger.setAttribute('aria-expanded', 'true')
      panel.style.height = `${panel.scrollHeight}px`
      // Release to auto once open, so the panel reflows if the text wraps
      // differently after a resize.
      panel.addEventListener(
        'transitionend',
        function onEnd(e) {
          if (e.propertyName !== 'height') return
          panel.removeEventListener('transitionend', onEnd)
          if (trigger.getAttribute('aria-expanded') === 'true') panel.style.height = 'auto'
        },
        { once: false },
      )
    }

    triggers.forEach((trigger, index) => {
      trigger.addEventListener('click', () => {
        const open = trigger.getAttribute('aria-expanded') === 'true'
        // One panel at a time keeps the list scannable.
        triggers.forEach((other) => {
          if (other !== trigger && other.getAttribute('aria-expanded') === 'true') collapse(other)
        })
        open ? collapse(trigger) : expand(trigger)
      })

      // Arrow keys move between headers, per the ARIA accordion pattern.
      trigger.addEventListener('keydown', (e) => {
        const map = { ArrowDown: 1, ArrowUp: -1 }
        if (e.key in map) {
          e.preventDefault()
          const next = (index + map[e.key] + triggers.length) % triggers.length
          triggers[next].focus()
        } else if (e.key === 'Home') {
          e.preventDefault()
          triggers[0].focus()
        } else if (e.key === 'End') {
          e.preventDefault()
          triggers[triggers.length - 1].focus()
        }
      })
    })
  })
}

/* --------------------------------------------------------------------------
   Terminal typewriter
   ------------------------------------------------------------------------ */

const SNIPPETS = [
  [
    ['cmd', '$ codearrive deploy --env production\n'],
    ['ok', '✓ building automation pipeline\n'],
    ['ok', '✓ provisioning cloud resources\n'],
    ['ok', '✓ running 42 integration tests\n'],
    ['ok', '✓ deployed in 8.4s\n\n'],
    ['key', 'status: live'],
  ],
  [
    ['cmd', '$ codearrive scaffold --type final-year\n'],
    ['ok', '✓ architecture diagram exported\n'],
    ['ok', '✓ REST API scaffolded (Node + Express)\n'],
    ['ok', '✓ auth module wired (JWT)\n'],
    ['ok', '✓ report + viva notes drafted\n\n'],
    ['key', 'ready for review'],
  ],
  [
    ['cmd', '$ codearrive monitor automation-worker\n'],
    ['', '09:14:02  invoice-sync   1,204 records\n'],
    ['', '09:14:03  crm-cleanup      312 records\n'],
    ['', '09:14:05  alerts             none\n\n'],
    ['key', 'uptime: 99.98%'],
  ],
]

function initTerminal() {
  const out = qs('[data-terminal]')
  if (!out) return

  const caret = document.createElement('span')
  caret.className = 'caret'

  // Flatten each snippet to characters that remember which span they belong
  // to, so the typewriter can emit styled output one character at a time.
  const scripts = SNIPPETS.map((parts) =>
    parts.flatMap(([cls, text]) => Array.from(text, (ch) => ({ cls, ch }))),
  )

  if (reducedMotion()) {
    // No animation: render the first snippet in full and stop.
    paint(scripts[0], scripts[0].length)
    return
  }

  // Start fully typed and holding, rather than empty and typing. The panel is
  // 260px tall, so an empty box would be a visible hole for anyone who scrolls
  // here before the first character lands.
  let script = 0
  let index = scripts[0].length
  let mode = 'hold'
  let paused = true
  let timer = null

  function paint(chars, upTo) {
    const frag = document.createDocumentFragment()
    let currentClass = null
    let node = null

    for (let i = 0; i < upTo; i++) {
      const { cls, ch } = chars[i]
      if (cls !== currentClass || node === null) {
        node = document.createElement('span')
        if (cls) node.className = cls
        frag.appendChild(node)
        currentClass = cls
      }
      node.append(ch)
    }

    out.replaceChildren(frag, caret)
  }

  function tick() {
    const chars = scripts[script]

    if (mode === 'type') {
      index++
      paint(chars, index)
      if (index >= chars.length) {
        mode = 'hold'
        timer = setTimeout(tick, 2200)
        return
      }
      // Pause a beat at line ends so it reads like a real console.
      timer = setTimeout(tick, chars[index - 1]?.ch === '\n' ? 90 : 16)
    } else if (mode === 'hold') {
      mode = 'erase'
      timer = setTimeout(tick, 60)
    } else {
      index = Math.max(0, index - 5) // erase in chunks; deleting is not the point
      paint(chars, index)
      if (index === 0) {
        script = (script + 1) % scripts.length
        mode = 'type'
        timer = setTimeout(tick, 420)
        return
      }
      timer = setTimeout(tick, 12)
    }
  }

  paint(scripts[0], index)

  // Only animate while on screen and while the tab is visible - no reason to
  // burn a timer on a terminal nobody can see.
  let onScreen = false

  const sync = () => {
    const shouldPause = !onScreen || document.hidden
    if (shouldPause === paused) return
    paused = shouldPause
    if (paused) clearTimeout(timer)
    else timer = setTimeout(tick, 900) // let it settle before erasing
  }

  document.addEventListener('visibilitychange', sync)

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting
        sync()
      },
      { threshold: 0.15 },
    ).observe(out)
  } else {
    onScreen = true
    sync()
  }
}

/* --------------------------------------------------------------------------
   Footer subscribe
   ------------------------------------------------------------------------ */

function initSubscribe() {
  const form = qs('[data-subscribe]')
  if (!form) return

  const input = qs('input[type="email"]', form)
  const button = qs('button', form)
  const status = qs('.form-status', form)

  const say = (message, state) => {
    status.textContent = message
    status.classList.toggle('is-ok', state === 'ok')
    status.classList.toggle('is-error', state === 'error')
  }

  input.addEventListener('input', () => {
    setFieldError(input, '')
    if (status.textContent) say('', null)
  })

  form.addEventListener('submit', async (e) => {
    e.preventDefault()

    if (!isEmail(input.value)) {
      setFieldError(input, '')
      input.setAttribute('aria-invalid', 'true')
      say('Enter a valid email address.', 'error')
      input.focus()
      return
    }

    button.disabled = true
    say('Sending…', null)

    const result = await submitForm({
      email: input.value.trim(),
      form: 'newsletter-signup',
      _subject: 'CodeArrive - newsletter signup',
    })

    button.disabled = false

    if (result.ok) {
      form.reset()
      input.removeAttribute('aria-invalid')
      say('Subscribed. Thanks for joining.', 'ok')
    } else {
      say(result.message, 'error')
    }
  })
}

/* --------------------------------------------------------------------------
   Current year
   ------------------------------------------------------------------------ */

function initYear() {
  qsa('[data-year]').forEach((el) => {
    el.textContent = String(new Date().getFullYear())
  })
}

/* --------------------------------------------------------------------------
   Boot
   ------------------------------------------------------------------------ */

document.documentElement.classList.remove('no-js')

const boot = () => {
  initNav()
  initProgress()
  initToTop()
  initReveal()
  initCounters()
  initAccordion()
  initTerminal()
  initSubscribe()
  initYear()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot)
} else {
  boot()
}
