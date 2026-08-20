/* ==========================================================================
   CodeArrive - Hero node network
   A 2D canvas constellation: nodes drift, nearby nodes link, and the pointer
   pulls the field gently. Replaces the three.js/WebGL scene the site used to
   ship - same idea, no dependency, and it runs on any device.
   ========================================================================== */

import { qs, reducedMotion } from './ui.js'

const CONFIG = {
  density: 11000,   // one node per N square pixels
  maxNodes: 84,
  minNodes: 22,
  linkDist: 148,    // px at which two nodes stop being linked
  speed: 0.16,      // px per frame at 60fps
  pointerRadius: 190,
  pointerPull: 0.22,
}

export function initHero() {
  const canvas = qs('[data-hero-canvas]')
  if (!canvas) return

  const ctx = canvas.getContext('2d', { alpha: true })
  if (!ctx) return

  const host = canvas.parentElement
  let width = 0
  let height = 0
  let dpr = 1
  let nodes = []
  let raf = 0
  let running = false

  const pointer = { x: -9999, y: -9999, active: false }

  /* --- Sizing ---------------------------------------------------------- */

  function resize() {
    const rect = host.getBoundingClientRect()
    width = rect.width
    height = rect.height
    // Cap the ratio: a 3x phone screen gains nothing here but costs fill rate.
    dpr = Math.min(window.devicePixelRatio || 1, 2)

    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    build()
  }

  function build() {
    const count = Math.max(
      CONFIG.minNodes,
      Math.min(CONFIG.maxNodes, Math.round((width * height) / CONFIG.density)),
    )

    nodes = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: Math.cos(angle) * CONFIG.speed * (0.4 + Math.random()),
        vy: Math.sin(angle) * CONFIG.speed * (0.4 + Math.random()),
        r: Math.random() * 1.3 + 0.7,
        // A minority of nodes are accent-coloured; the rest stay silver so
        // the field reads as structure rather than as confetti.
        accent: Math.random() < 0.22,
      }
    })
  }

  /* --- Frame ----------------------------------------------------------- */

  function frame() {
    ctx.clearRect(0, 0, width, height)

    for (const node of nodes) {
      node.x += node.vx
      node.y += node.vy

      // Wrap rather than bounce - no visible walls at the edges.
      if (node.x < -20) node.x = width + 20
      else if (node.x > width + 20) node.x = -20
      if (node.y < -20) node.y = height + 20
      else if (node.y > height + 20) node.y = -20

      // Pointer parallax: nodes ease toward the cursor, then drift back.
      if (pointer.active) {
        const dx = pointer.x - node.x
        const dy = pointer.y - node.y
        const dist = Math.hypot(dx, dy)
        if (dist < CONFIG.pointerRadius && dist > 0.5) {
          const force = (1 - dist / CONFIG.pointerRadius) * CONFIG.pointerPull
          node.x += (dx / dist) * force
          node.y += (dy / dist) * force
        }
      }
    }

    // Links. O(n²) over at most 84 nodes is ~3.5k checks - trivial per frame.
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i]
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j]
        const dx = a.x - b.x
        const dy = a.y - b.y
        const distSq = dx * dx + dy * dy
        if (distSq > CONFIG.linkDist * CONFIG.linkDist) continue

        const alpha = (1 - Math.sqrt(distSq) / CONFIG.linkDist) * 0.34
        ctx.strokeStyle = `rgba(76, 125, 240, ${alpha})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }
    }

    for (const node of nodes) {
      ctx.fillStyle = node.accent ? 'rgba(76, 125, 240, 0.85)' : 'rgba(154, 168, 190, 0.5)'
      ctx.beginPath()
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2)
      ctx.fill()
    }

    raf = requestAnimationFrame(frame)
  }

  /* --- Lifecycle ------------------------------------------------------- */

  function start() {
    if (running) return
    running = true
    raf = requestAnimationFrame(frame)
  }

  function stop() {
    running = false
    cancelAnimationFrame(raf)
  }

  /* --- Static fallback ------------------------------------------------- */

  if (reducedMotion()) {
    resize()
    // One still frame: the composition is part of the design, the motion is
    // not. Drawing it once respects the preference without leaving a hole.
    ctx.clearRect(0, 0, width, height)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]
        const b = nodes[j]
        const dist = Math.hypot(a.x - b.x, a.y - b.y)
        if (dist > CONFIG.linkDist) continue
        ctx.strokeStyle = `rgba(76, 125, 240, ${(1 - dist / CONFIG.linkDist) * 0.28})`
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }
    }
    for (const node of nodes) {
      ctx.fillStyle = node.accent ? 'rgba(76, 125, 240, 0.8)' : 'rgba(154, 168, 190, 0.45)'
      ctx.beginPath()
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2)
      ctx.fill()
    }
    canvas.classList.add('is-ready')
    return
  }

  /* --- Events ---------------------------------------------------------- */

  // Debounced so a dragged window resize does not rebuild on every pixel.
  let resizeTimer
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(resize, 160)
  })

  // Pointer parallax is a mouse affordance; skip it on touch, where there is
  // no hover and the work would be wasted.
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    host.addEventListener('pointermove', (e) => {
      const rect = host.getBoundingClientRect()
      pointer.x = e.clientX - rect.left
      pointer.y = e.clientY - rect.top
      pointer.active = true
    })
    host.addEventListener('pointerleave', () => {
      pointer.active = false
    })
  }

  document.addEventListener('visibilitychange', () => {
    document.hidden ? stop() : start()
  })

  // Stop once the hero has scrolled away - the animation is invisible then.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()), {
      threshold: 0,
    }).observe(host)
  }

  resize()
  canvas.classList.add('is-ready')
  start()
}

initHero()
