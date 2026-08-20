/* ==========================================================================
   CodeArrive - Marketplace page
   Renders the catalogue, filters it by search / category / price, keeps that
   state in the URL so a filtered view can be shared and the back button
   works, and drives the project detail dialog.
   ========================================================================== */

import { qs, qsa, Dialog, esc } from './ui.js'
import { CATEGORIES, PRICE_BANDS, PROJECTS, monogram } from './catalog.js'

const ICON_TAG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.59 13.41 13.42 20.6a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z"/><circle cx="7" cy="7" r="1.2"/></svg>`

const ICON_EMPTY = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`

function initProjects() {
  const grid = qs('[data-project-grid]')
  if (!grid) return

  const searchInput = qs('[data-search]')
  const clearSearchBtn = qs('[data-search-clear]')
  const categoryRow = qs('[data-category-filters]')
  const priceRow = qs('[data-price-filters]')
  const countEl = qs('[data-result-count]')
  const resetBtn = qs('[data-reset-filters]')
  const liveEl = qs('[data-results-live]')

  const state = { q: '', category: 'All', price: 'any' }

  /* --- Filter controls -------------------------------------------------- */

  categoryRow.innerHTML = CATEGORIES.map(
    (c) =>
      `<button type="button" class="chip" data-category="${esc(c)}" aria-pressed="false">${esc(c)}</button>`,
  ).join('')

  priceRow.innerHTML = PRICE_BANDS.map(
    (b) =>
      `<button type="button" class="chip" data-price="${b.id}" aria-pressed="false">${esc(b.label)}</button>`,
  ).join('')

  /* --- URL state -------------------------------------------------------- */
  // Filters live in the query string, so a filtered grid is a shareable link
  // and Back steps through filter changes instead of leaving the page.

  function readUrl() {
    const params = new URLSearchParams(location.search)
    const category = params.get('category')
    const price = params.get('price')

    state.q = params.get('q') || ''
    state.category = CATEGORIES.includes(category) ? category : 'All'
    state.price = PRICE_BANDS.some((b) => b.id === price) ? price : 'any'
  }

  function writeUrl(replace = false) {
    const params = new URLSearchParams()
    if (state.q) params.set('q', state.q)
    if (state.category !== 'All') params.set('category', state.category)
    if (state.price !== 'any') params.set('price', state.price)

    const query = params.toString()
    const url = query ? `?${query}` : location.pathname
    history[replace ? 'replaceState' : 'pushState'](null, '', url)
  }

  /* --- Rendering -------------------------------------------------------- */

  function matches(project) {
    if (state.category !== 'All' && project.category !== state.category) return false

    const band = PRICE_BANDS.find((b) => b.id === state.price)
    if (band && !band.test(project.price)) return false

    const q = state.q.trim().toLowerCase()
    if (!q) return true

    return (
      project.title.toLowerCase().includes(q) ||
      project.description.toLowerCase().includes(q) ||
      project.category.toLowerCase().includes(q) ||
      project.stack.some((t) => t.toLowerCase().includes(q))
    )
  }

  function cardHtml(project, index) {
    return `
      <article class="card card--interactive project-card" style="--i:${index}">
        <div class="project-card__plate">
          <span class="project-card__cat">${esc(project.category)}</span>
          <span class="project-card__mono" aria-hidden="true">${esc(monogram(project.title))}</span>
        </div>
        <div class="project-card__body">
          <h3 class="project-card__title">${esc(project.title)}</h3>
          <p class="project-card__desc">${esc(project.description)}</p>
          <div class="cluster project-card__stack">
            ${project.stack.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}
          </div>
          <div class="project-card__foot">
            <span class="price">$${project.price}<span> USD</span></span>
            <div class="cluster" style="gap:.35rem">
              <button type="button" class="btn btn--quiet btn--sm" data-detail="${esc(project.id)}">
                Details
              </button>
              <button type="button" class="btn btn--primary btn--sm" data-buy="${esc(project.id)}">
                ${ICON_TAG.replace('<svg', '<svg class="icon"')}
                Purchase
              </button>
            </div>
          </div>
        </div>
      </article>`
  }

  function emptyHtml() {
    return `
      <div class="empty-state" style="grid-column:1/-1">
        ${ICON_EMPTY}
        <h3 class="h3" style="margin-top:1rem">No projects match those filters</h3>
        <p class="muted" style="margin-top:.5rem;max-width:34rem;margin-inline:auto">
          Try a broader price band or clear the search. If nothing here fits, we build
          to spec — describe what you need and we will scope it with you.
        </p>
        <div class="cluster" style="justify-content:center;margin-top:1.75rem">
          <button type="button" class="btn btn--ghost" data-reset-filters>Clear all filters</button>
          <button type="button" class="btn btn--primary" data-open-wizard
                  data-heading="Custom Project Request">Request a custom build</button>
        </div>
      </div>`
  }

  function render() {
    const results = PROJECTS.filter(matches)

    grid.innerHTML =
      results.length === 0 ? emptyHtml() : results.map(cardHtml).join('')

    // Reflect state on the controls.
    qsa('[data-category]', categoryRow).forEach((btn) =>
      btn.setAttribute('aria-pressed', String(btn.dataset.category === state.category)),
    )
    qsa('[data-price]', priceRow).forEach((btn) =>
      btn.setAttribute('aria-pressed', String(btn.dataset.price === state.price)),
    )

    if (searchInput.value !== state.q) searchInput.value = state.q
    clearSearchBtn.hidden = state.q === ''

    const filtered = state.q !== '' || state.category !== 'All' || state.price !== 'any'
    resetBtn.hidden = !filtered

    countEl.innerHTML =
      results.length === PROJECTS.length
        ? `<strong>${PROJECTS.length}</strong> projects available`
        : `<strong>${results.length}</strong> of ${PROJECTS.length} projects`

    // Announced politely so screen reader users hear the result count change
    // without the grid stealing focus.
    liveEl.textContent = `${results.length} project${results.length === 1 ? '' : 's'} found.`

    bindCards()
  }

  /* --- Card actions ----------------------------------------------------- */

  function bindCards() {
    qsa('[data-detail]', grid).forEach((btn) =>
      btn.addEventListener('click', () => openDetail(btn.dataset.detail)),
    )
    qsa('[data-buy]', grid).forEach((btn) =>
      btn.addEventListener('click', () => openPurchase(btn.dataset.buy)),
    )
    // The empty state renders its own reset control, so rebind it each time.
    // Its [data-open-wizard] button needs no wiring - the wizard listens on
    // the document.
    qsa('[data-reset-filters]', grid).forEach((btn) =>
      btn.addEventListener('click', resetFilters),
    )
  }

  function openPurchase(id) {
    const project = PROJECTS.find((p) => p.id === id)
    if (!project) return
    window.CodeArriveWizard?.open({
      heading: 'Purchase / Instant Request',
      context: `Re: ${project.title}`,
      project: project.title,
      category: project.category,
      stack: project.stack.join(', '),
    })
  }

  /* --- Detail dialog ---------------------------------------------------- */

  const detailEl = qs('#project-detail')
  const detailDialog = detailEl ? new Dialog(detailEl) : null

  function openDetail(id) {
    const project = PROJECTS.find((p) => p.id === id)
    if (!project || !detailDialog) return

    qs('[data-detail-title]', detailEl).textContent = project.title
    qs('[data-detail-category]', detailEl).textContent = project.category
    qs('[data-detail-price]', detailEl).textContent = `$${project.price}`
    qs('[data-detail-desc]', detailEl).textContent = project.description
    qs('[data-detail-mono]', detailEl).textContent = monogram(project.title)

    qs('[data-detail-stack]', detailEl).innerHTML = project.stack
      .map((t) => `<span class="tag">${esc(t)}</span>`)
      .join('')

    qs('[data-detail-features]', detailEl).innerHTML = project.features
      .map((f) => `<li>${esc(f)}</li>`)
      .join('')

    const buy = qs('[data-detail-buy]', detailEl)
    buy.onclick = () => {
      detailDialog.close()
      // Let the first dialog finish closing before the second opens, so focus
      // is handed over cleanly rather than fought over.
      setTimeout(() => openPurchase(id), 300)
    }

    detailDialog.open()
  }

  /* --- Events ----------------------------------------------------------- */

  let searchTimer
  searchInput.addEventListener('input', () => {
    state.q = searchInput.value
    render()
    // Debounce only the history write - typing should not create 20 entries.
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => writeUrl(true), 400)
  })

  clearSearchBtn.addEventListener('click', () => {
    state.q = ''
    render()
    writeUrl()
    searchInput.focus()
  })

  categoryRow.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-category]')
    if (!btn) return
    state.category = btn.dataset.category
    render()
    writeUrl()
  })

  priceRow.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-price]')
    if (!btn) return
    state.price = btn.dataset.price
    render()
    writeUrl()
  })

  function resetFilters() {
    state.q = ''
    state.category = 'All'
    state.price = 'any'
    render()
    writeUrl()
    searchInput.focus()
  }

  resetBtn.addEventListener('click', resetFilters)

  window.addEventListener('popstate', () => {
    readUrl()
    render()
  })

  readUrl()
  render()
}

initProjects()
