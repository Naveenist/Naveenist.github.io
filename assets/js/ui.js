/* ==========================================================================
   CodeArrive - Shared UI utilities
   Small, dependency-free helpers used by every page: DOM lookup, motion
   preference, focus management, an accessible dialog, and form submission.
   ========================================================================== */

export const qs = (sel, root = document) => root.querySelector(sel)
export const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel))

/** Live check - the user can flip the OS setting without reloading. */
export const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* --------------------------------------------------------------------------
   Scroll locking
   Locking <body> alone makes iOS Safari scroll the page behind the overlay.
   Pinning the body to its current offset is the reliable cross-browser fix.
   ------------------------------------------------------------------------ */

let lockCount = 0
let savedScrollY = 0

export function lockScroll() {
  if (lockCount++ > 0) return
  savedScrollY = window.scrollY
  const barWidth = window.innerWidth - document.documentElement.clientWidth
  document.body.style.position = 'fixed'
  document.body.style.top = `-${savedScrollY}px`
  document.body.style.width = '100%'
  // Compensating for the removed scrollbar stops the layout shifting sideways.
  if (barWidth > 0) document.body.style.paddingRight = `${barWidth}px`
}

export function unlockScroll() {
  if (lockCount === 0 || --lockCount > 0) return
  document.body.style.position = ''
  document.body.style.top = ''
  document.body.style.width = ''
  document.body.style.paddingRight = ''
  window.scrollTo(0, savedScrollY)
}

/* --------------------------------------------------------------------------
   Focus trap
   ------------------------------------------------------------------------ */

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/** Visible focusable descendants, in document order. */
export function focusables(root) {
  return qsa(FOCUSABLE, root).filter(
    (el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement,
  )
}

/**
 * Keeps Tab inside `root` until the returned function is called.
 * Restores focus to whatever was focused beforehand.
 */
export function trapFocus(root) {
  const previous = document.activeElement

  function onKeydown(e) {
    if (e.key !== 'Tab') return
    const items = focusables(root)
    if (items.length === 0) {
      e.preventDefault()
      return
    }
    const first = items[0]
    const last = items[items.length - 1]
    // Focus may sit on the container itself, so compare against both ends.
    if (e.shiftKey && (document.activeElement === first || !root.contains(document.activeElement))) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  document.addEventListener('keydown', onKeydown, true)

  return function release() {
    document.removeEventListener('keydown', onKeydown, true)
    if (previous instanceof HTMLElement && document.contains(previous)) {
      previous.focus({ preventScroll: true })
    }
  }
}

/* --------------------------------------------------------------------------
   Dialog
   A thin controller over markup that already carries the ARIA attributes,
   so the dialog stays accessible even before JS runs.
   ------------------------------------------------------------------------ */

export class Dialog {
  /**
   * @param {HTMLElement} el   Element with .modal
   * @param {{ onOpen?: Function, onClose?: Function }} [hooks]
   */
  constructor(el, hooks = {}) {
    this.el = el
    this.panel = qs('.modal__panel', el)
    this.hooks = hooks
    this.isOpen = false
    this.release = null

    el.addEventListener('mousedown', (e) => {
      // Only a press that both starts and ends on the backdrop dismisses,
      // so a text selection dragged out of the panel does not close it.
      if (e.target === el) this._backdropArmed = true
    })
    el.addEventListener('mouseup', (e) => {
      if (e.target === el && this._backdropArmed) this.close()
      this._backdropArmed = false
    })

    qsa('[data-close]', el).forEach((btn) =>
      btn.addEventListener('click', () => this.close()),
    )

    this._onKey = (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        e.stopPropagation()
        this.close()
      }
    }
  }

  open() {
    if (this.isOpen) return
    this.isOpen = true
    this.el.hidden = false
    this.el.setAttribute('aria-hidden', 'false')
    lockScroll()

    // One frame between `hidden = false` and the class, so the browser has a
    // starting style to animate away from.
    requestAnimationFrame(() => {
      this.el.classList.add('is-open')
      const target = qs('[data-autofocus]', this.el) || focusables(this.panel)[0]
      target?.focus({ preventScroll: true })
    })

    this.release = trapFocus(this.panel)
    document.addEventListener('keydown', this._onKey)
    this.hooks.onOpen?.()
  }

  close() {
    if (!this.isOpen) return
    this.isOpen = false
    this.el.classList.remove('is-open')
    this.el.setAttribute('aria-hidden', 'true')
    document.removeEventListener('keydown', this._onKey)
    this.release?.()
    this.release = null
    unlockScroll()

    const finish = () => {
      this.el.hidden = true
      this.hooks.onClose?.()
    }
    // Wait for the exit transition unless motion is off.
    if (reducedMotion()) finish()
    else setTimeout(finish, 280)
  }
}

/* --------------------------------------------------------------------------
   Form submission
   ------------------------------------------------------------------------ */

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xnpadgdo'

/**
 * Posts a payload to Formspree.
 * @returns {Promise<{ ok: boolean, message?: string }>}
 */
export async function submitForm(payload) {
  // A hung request should not leave the button spinning forever.
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)

  try {
    const res = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    if (res.ok) return { ok: true }

    // Formspree returns field-level errors; surface the first one.
    const data = await res.json().catch(() => null)
    const message = data?.errors?.[0]?.message || 'That did not go through. Please try again.'
    return { ok: false, message }
  } catch (err) {
    const message =
      err.name === 'AbortError'
        ? 'The request timed out. Please check your connection and try again.'
        : 'Could not reach the server. Please try again in a moment.'
    return { ok: false, message }
  } finally {
    clearTimeout(timer)
  }
}

export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())

/** Shows or clears the inline error tied to a control via aria-describedby. */
export function setFieldError(input, message) {
  const id = input.getAttribute('aria-describedby')
  const slot = id ? document.getElementById(id) : null
  if (message) {
    input.setAttribute('aria-invalid', 'true')
    if (slot) {
      slot.textContent = message
      slot.classList.add('is-shown')
    }
  } else {
    input.removeAttribute('aria-invalid')
    if (slot) {
      slot.textContent = ''
      slot.classList.remove('is-shown')
    }
  }
}

/** Escapes text destined for innerHTML. */
export const esc = (str) =>
  String(str).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  )
