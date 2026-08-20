/* ==========================================================================
   CodeArrive - Request wizard
   A four-step dialog used across the site for custom builds, purchases and
   mentorship enquiries.

   The markup is injected from here rather than duplicated into every page:
   the wizard is a pure interaction with no value to a crawler or to a
   no-JS visitor, so there is nothing to gain from putting it in the HTML
   and ~200 lines per page to lose.

   Any element with [data-open-wizard] opens it. Optional data attributes:
     data-heading   dialog title
     data-context   secondary line, e.g. "Re: CampusConnect"
     data-project   prefills the project name
     data-category  preselects a category chip
     data-stack     prefills the tech stack field
   ========================================================================== */

import { qs, qsa, Dialog, submitForm, isEmail, setFieldError } from './ui.js'

const STEP_COUNT = 4

const ARROW_RIGHT = `<svg class="icon icon--arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>`
const ARROW_LEFT = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>`

const CATEGORY_CHIPS = [
  'Web Apps', 'Mobile Apps', 'Cloud / DevOps', 'Automation Scripts',
  'AI / ML', 'Embedded Systems', 'Full Stack', 'Other',
]

const BUDGET_CHIPS = [
  'Under $100', '$100 – $300', '$300 – $700', '$700 – $1,500', '$1,500+', "Let's discuss",
]

const GUIDANCE = [
  ['Code Only', 'Code only', 'Just the working source code'],
  ['Code + Training', 'Code + training', 'Source code plus a hands-on walkthrough'],
  ['Code + Training + Report', 'Code + training + report', 'Everything, including documentation and viva prep'],
]

const STEP_LABELS = ['Category', 'Requirements', 'Budget', 'Contact']

const chip = (value, label = value) =>
  `<button type="button" class="chip" data-value="${value}" aria-pressed="false">${label}</button>`

function template() {
  return `
<div class="modal" id="wizard" role="dialog" aria-modal="true" aria-labelledby="wizard-heading" aria-hidden="true" hidden>
  <div class="modal__panel">

    <div class="modal__head">
      <div>
        <span class="eyebrow eyebrow--bare">CodeArrive</span>
        <h2 class="h3" id="wizard-heading" data-wizard-heading style="margin-top:.35rem">Custom Project Request</h2>
        <p class="dim" data-wizard-context style="font-size:var(--t-xs);margin-top:.25rem" hidden></p>
      </div>
      <button class="modal__close" type="button" data-close aria-label="Close dialog">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>

    <div class="modal__body">
      <p class="visually-hidden" role="status" aria-live="polite" data-wizard-live></p>

      <ol class="steps">
        ${STEP_LABELS.map(
          (label, i) => `
        <li class="steps__item${i === 0 ? ' is-active' : ''}" data-label="${label}"${i === 0 ? ' aria-current="step"' : ''}>
          <span class="steps__bar"></span><span class="steps__label">${label}</span>
        </li>`,
        ).join('')}
      </ol>

      <form novalidate>
        <!-- Toggle groups write into these, so FormData reads the whole form. -->
        <input type="hidden" name="projectName">
        <input type="hidden" name="category" data-required data-group-for="category" data-message="Choose a category to continue.">
        <input type="hidden" name="budget" data-required data-group-for="budget" data-message="Select a budget range.">
        <input type="hidden" name="guidance" data-required data-group-for="guidance" data-message="Select a guidance level.">

        <section class="wizard__pane is-active" aria-label="Step 1 of 4: Category">
          <div class="field">
            <span class="field__label">Project category <span class="req">*</span></span>
            <div class="cluster" data-group="category">${CATEGORY_CHIPS.map((c) => chip(c)).join('')}</div>
            <p class="field__error"></p>
          </div>
          <div class="field" style="margin-top:1.5rem">
            <label class="field__label" for="w-stack">Preferred tech stack</label>
            <input class="input" id="w-stack" name="techStack" type="text" placeholder="e.g. React, Node.js, PostgreSQL">
            <p class="field__hint">Optional — leave blank and we will recommend one.</p>
          </div>
        </section>

        <section class="wizard__pane" aria-label="Step 2 of 4: Requirements" hidden>
          <div class="field">
            <label class="field__label" for="w-scope">Project scope <span class="req">*</span></label>
            <textarea class="textarea" id="w-scope" name="scope" rows="3" data-required
              aria-describedby="w-scope-err" data-message="Tell us briefly what the project should do."
              placeholder="What should this project do, at a high level?"></textarea>
            <p class="field__error" id="w-scope-err"></p>
          </div>
          <div class="field" style="margin-top:1.25rem">
            <label class="field__label" for="w-features">Required features</label>
            <textarea class="textarea" id="w-features" name="features" rows="2"
              placeholder="Auth, dashboards, payment integration, reports…"></textarea>
          </div>
          <div class="grid grid--2" style="margin-top:1.25rem;gap:1rem">
            <div class="field">
              <label class="field__label" for="w-db">Database preference</label>
              <select class="select" id="w-db" name="database">
                <option value="">No preference</option>
                <option>MySQL</option><option>PostgreSQL</option><option>MongoDB</option>
                <option>Firebase</option><option>SQLite</option><option>Other</option>
              </select>
            </div>
            <div class="field">
              <label class="field__label" for="w-deadline">Deadline</label>
              <input class="input" id="w-deadline" name="deadline" type="date">
            </div>
          </div>
        </section>

        <section class="wizard__pane" aria-label="Step 3 of 4: Budget" hidden>
          <div class="field">
            <span class="field__label">Budget range <span class="req">*</span></span>
            <div class="cluster" data-group="budget">${BUDGET_CHIPS.map((b) => chip(b)).join('')}</div>
            <p class="field__error"></p>
          </div>
          <div class="field" style="margin-top:1.75rem">
            <span class="field__label">Guidance level <span class="req">*</span></span>
            <div class="flow-sm" data-group="guidance">
              ${GUIDANCE.map(
                ([value, title, hint]) => `
              <button type="button" class="option" data-value="${value}" aria-pressed="false">
                <span class="option__title">${title}</span>
                <span class="option__hint">${hint}</span>
              </button>`,
              ).join('')}
            </div>
            <p class="field__error"></p>
          </div>
        </section>

        <section class="wizard__pane" aria-label="Step 4 of 4: Contact" hidden>
          <div class="grid grid--2" style="gap:1rem">
            <div class="field">
              <label class="field__label" for="w-name">Full name <span class="req">*</span></label>
              <input class="input" id="w-name" name="name" type="text" autocomplete="name"
                data-required aria-describedby="w-name-err" data-message="Please enter your name.">
              <p class="field__error" id="w-name-err"></p>
            </div>
            <div class="field">
              <label class="field__label" for="w-email">Email <span class="req">*</span></label>
              <input class="input" id="w-email" name="email" type="email" autocomplete="email"
                data-required aria-describedby="w-email-err" data-message="Please enter your email.">
              <p class="field__error" id="w-email-err"></p>
            </div>
          </div>
          <div class="grid grid--2" style="gap:1rem;margin-top:1.25rem">
            <div class="field">
              <label class="field__label" for="w-phone">Phone / WhatsApp</label>
              <input class="input" id="w-phone" name="phone" type="tel" autocomplete="tel">
            </div>
            <div class="field">
              <label class="field__label" for="w-org">University / company</label>
              <input class="input" id="w-org" name="organization" type="text" autocomplete="organization">
            </div>
          </div>
          <p class="field__error" data-wizard-error style="margin-top:1rem"></p>
          <p class="field__hint" style="margin-top:1rem">
            Your request is emailed straight to team@codearrive.com. We normally reply within 24 hours.
          </p>
        </section>

        <div class="wizard__nav">
          <button type="button" class="btn btn--quiet" data-wizard-back hidden>${ARROW_LEFT} Back</button>
          <span></span>
          <button type="button" class="btn btn--primary" data-wizard-next>Continue ${ARROW_RIGHT}</button>
          <button type="submit" class="btn btn--primary" data-wizard-submit hidden>Submit request</button>
        </div>
      </form>

      <div class="wizard__done" hidden>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.8 10A10 10 0 1 1 17 3.34"/><path d="m9 11 3 3L22 4"/></svg>
        <h3 class="h3">Request sent</h3>
        <p class="muted" style="max-width:24rem">
          Thanks — your request has been emailed to team@codearrive.com.
          We typically reply within 24 hours.
        </p>
        <button type="button" class="btn btn--ghost" data-close data-done-close style="margin-top:.5rem">Done</button>
      </div>
    </div>
  </div>
</div>`
}

/* ========================================================================== */

export function initWizard() {
  // Nothing on the page can open it, so do not build it.
  if (qsa('[data-open-wizard]').length === 0 && !qs('[data-wizard-required]')) return

  document.body.insertAdjacentHTML('beforeend', template())

  const root = qs('#wizard')
  const dialog = new Dialog(root, { onClose: reset })

  const panes = qsa('.wizard__pane', root)
  const stepItems = qsa('.steps__item', root)
  const stepsEl = qs('.steps', root)
  const backBtn = qs('[data-wizard-back]', root)
  const nextBtn = qs('[data-wizard-next]', root)
  const submitBtn = qs('[data-wizard-submit]', root)
  const form = qs('form', root)
  const nav = qs('.wizard__nav', root)
  const done = qs('.wizard__done', root)
  const headingEl = qs('[data-wizard-heading]', root)
  const contextEl = qs('[data-wizard-context]', root)
  const errorEl = qs('[data-wizard-error]', root)
  const liveEl = qs('[data-wizard-live]', root)

  let step = 0
  let heading = 'Custom Project Request'
  let submitting = false

  /* --- Toggle groups --------------------------------------------------- */

  const groupError = (group, message) => {
    const slot = group.parentElement.querySelector('.field__error')
    if (!slot) return
    slot.textContent = message || ''
    slot.classList.toggle('is-shown', Boolean(message))
  }

  qsa('[data-group]', root).forEach((group) => {
    const hidden = qs(`input[name="${group.dataset.group}"]`, form)

    group.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-value]')
      if (!btn) return
      qsa('button[data-value]', group).forEach((other) =>
        other.setAttribute('aria-pressed', String(other === btn)),
      )
      hidden.value = btn.dataset.value
      groupError(group, '')
      refresh()
    })
  })

  /* --- Validation ------------------------------------------------------ */

  function validateStep(index) {
    let firstBad = null

    qsa('[data-required]', panes[index]).forEach((el) => validateOne(el))

    // Hidden group inputs live outside the panes, so check the ones that
    // belong to this step separately.
    qsa('input[data-group-for]', form).forEach((el) => {
      const group = qs(`[data-group="${el.dataset.groupFor}"]`, root)
      if (!group || !panes[index].contains(group)) return
      if (!el.value.trim()) {
        groupError(group, el.dataset.message)
        if (!firstBad) firstBad = qs('button', group)
      } else {
        groupError(group, '')
      }
    })

    function validateOne(el) {
      const value = el.value.trim()
      if (!value) {
        setFieldError(el, el.dataset.message || 'This field is required.')
        if (!firstBad) firstBad = el
      } else if (el.type === 'email' && !isEmail(value)) {
        setFieldError(el, 'Enter a valid email address.')
        if (!firstBad) firstBad = el
      } else {
        setFieldError(el, '')
      }
    }

    if (firstBad) {
      firstBad.focus()
      return false
    }
    return true
  }

  // Clear an error the moment the user fixes it - no nagging.
  form.addEventListener('input', (e) => {
    if (e.target.matches('[data-required]')) setFieldError(e.target, '')
    refresh()
  })

  /* --- Step navigation ------------------------------------------------- */

  function render(direction = 'forward') {
    panes.forEach((pane, i) => {
      const active = i === step
      pane.hidden = !active
      pane.classList.toggle('is-active', active)
      pane.classList.toggle('is-back', active && direction === 'back')
    })

    stepItems.forEach((item, i) => {
      item.classList.toggle('is-active', i === step)
      item.classList.toggle('is-done', i < step)
      if (i === step) item.setAttribute('aria-current', 'step')
      else item.removeAttribute('aria-current')
    })

    backBtn.hidden = step === 0
    nextBtn.hidden = step === STEP_COUNT - 1
    submitBtn.hidden = step !== STEP_COUNT - 1

    liveEl.textContent = `Step ${step + 1} of ${STEP_COUNT}: ${STEP_LABELS[step]}`
    dialog.panel.scrollTo({ top: 0, behavior: 'auto' })
    refresh()
  }

  /** Enables the forward button only once this step's required fields hold a value. */
  function refresh() {
    const pane = panes[step]
    const inPane = (el) => {
      if (pane.contains(el)) return true
      // Hidden group inputs sit at the top of the form; map them back to
      // the pane that owns their toggle group.
      const group = el.dataset.groupFor && qs(`[data-group="${el.dataset.groupFor}"]`, root)
      return Boolean(group && pane.contains(group))
    }

    const ready = qsa('[data-required]', form)
      .filter(inPane)
      .every((el) => el.value.trim() !== '')

    nextBtn.disabled = !ready
    submitBtn.disabled = submitting || !ready
  }

  nextBtn.addEventListener('click', () => {
    if (!validateStep(step)) return
    step = Math.min(STEP_COUNT - 1, step + 1)
    render('forward')
  })

  backBtn.addEventListener('click', () => {
    step = Math.max(0, step - 1)
    render('back')
  })

  // Enter advances instead of submitting a half-finished form.
  form.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.target.tagName === 'TEXTAREA') return
    e.preventDefault()
    ;(step < STEP_COUNT - 1 ? nextBtn : submitBtn).click()
  })

  /* --- Submission ------------------------------------------------------ */

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (submitting || !validateStep(step)) return

    submitting = true
    submitBtn.disabled = true
    submitBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Sending…'
    errorEl.classList.remove('is-shown')

    const payload = Object.fromEntries(new FormData(form).entries())
    payload.requestType = heading
    payload._subject = `CodeArrive request — ${heading}`

    const result = await submitForm(payload)

    submitting = false
    submitBtn.innerHTML = 'Submit request'
    submitBtn.disabled = false

    if (result.ok) {
      form.hidden = true
      stepsEl.hidden = true
      done.hidden = false
      liveEl.textContent = 'Your request has been sent.'
      qs('[data-done-close]', done).focus()
    } else {
      errorEl.textContent = result.message
      errorEl.classList.add('is-shown')
      liveEl.textContent = result.message
    }
  })

  /* --- Reset ----------------------------------------------------------- */

  function reset() {
    step = 0
    submitting = false
    form.reset()
    form.hidden = false
    nav.hidden = false
    stepsEl.hidden = false
    done.hidden = true
    errorEl.classList.remove('is-shown')

    qsa('button[data-value]', root).forEach((btn) => btn.setAttribute('aria-pressed', 'false'))
    qsa('.field__error', root).forEach((slot) => {
      slot.textContent = ''
      slot.classList.remove('is-shown')
    })
    qsa('[aria-invalid]', root).forEach((el) => el.removeAttribute('aria-invalid'))

    render('forward')
  }

  /* --- Public opener --------------------------------------------------- */

  function open(options = {}) {
    reset()

    heading = options.heading || 'Custom Project Request'
    headingEl.textContent = heading

    contextEl.textContent = options.context || ''
    contextEl.hidden = !options.context

    if (options.project) qs('input[name="projectName"]', form).value = options.project
    if (options.stack) qs('#w-stack', form).value = options.stack

    if (options.category) {
      const btn = qs(`[data-group="category"] button[data-value="${CSS.escape(options.category)}"]`, root)
      btn?.click()
    }

    dialog.open()
  }

  // Delegated, so triggers rendered later (the marketplace empty state, for
  // instance) work without rebinding.
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-open-wizard]')
    if (!trigger) return
    open({
      heading: trigger.dataset.heading,
      context: trigger.dataset.context,
      project: trigger.dataset.project,
      category: trigger.dataset.category,
      stack: trigger.dataset.stack,
    })
  })

  window.CodeArriveWizard = { open }
  render('forward')
}

initWizard()
