# CodeArrive

Marketing site for CodeArrive — custom software, enterprise automation, and
final-year project mentorship.

Plain HTML, CSS and JavaScript. **No build step, no dependencies, no
`node_modules`.** The repository is the site: what you see here is exactly what
gets served.

---

## Structure

```
.
├── index.html              Home
├── projects/index.html     Project marketplace
├── mentorship/index.html   Student mentorship
├── 404.html                Not-found page (self-contained, no external assets)
│
├── assets/
│   ├── css/
│   │   ├── tokens.css      Design tokens, reset, base typography
│   │   ├── components.css  Buttons, panels, cards, forms, modal, accordion
│   │   └── layout.css      Navbar, hero, sections, footer, page blocks
│   ├── js/
│   │   ├── ui.js           Shared: focus trap, dialog, scroll lock, form POST
│   │   ├── site.js         Nav, scroll chrome, reveals, counters, accordion
│   │   ├── hero.js         Hero node-network canvas
│   │   ├── catalog.js      Project data (single source of truth)
│   │   ├── projects.js     Marketplace filtering + detail dialog
│   │   └── wizard.js       Four-step request dialog
│   └── img/logo.png
│
├── .nojekyll               Stops Pages running the site through Jekyll
├── favicon.svg
├── robots.txt
├── sitemap.xml
├── site.webmanifest
└── .github/workflows/deploy.yml
```

## Running locally

Because the pages use ES modules, opening `index.html` straight off disk will
not work — modules require `http://`. Any static server does the job:

```bash
python -m http.server 8000
# then open http://localhost:8000
```

## Deploying to GitHub Pages

Two options. The workflow is already committed, so option A needs one setting
changed and nothing else.

**A. GitHub Actions (recommended)**

1. **Settings → Pages → Build and deployment → Source: _GitHub Actions_**
2. Push to `main`.

Every push then publishes automatically, with deployment history and one-click
rollback.

**B. Deploy from a branch**

1. **Settings → Pages → Source: _Deploy from a branch_ → `main` / `/ (root)`**

Equally valid — there is no build step, so serving the branch directly works.
You lose deployment history and the per-push status check.

### Why these files matter

| File | Why it is there |
| --- | --- |
| `.nojekyll` | Pages runs sites through Jekyll by default, which silently ignores files and folders starting with `_`. This empty file turns that off. |
| `404.html` | Pages serves this for any unknown URL. It carries its own inline CSS, because a page served at an arbitrary depth cannot rely on relative *or* root-absolute asset paths. |
| `robots.txt` / `sitemap.xml` | Lets crawlers discover all three pages. |
| `site.webmanifest` | Installable-to-homescreen metadata and the browser theme colour. |
| `index.html` in each folder | Gives clean directory URLs — `/projects/` rather than `/projects.html`. |

### Paths and portability

Every asset reference is **relative** (`assets/…` from the root, `../assets/…`
from a subfolder). The site therefore works unchanged at:

- `https://<user>.github.io/<repo>/` — a project site
- `https://<user>.github.io/` — a user site
- `https://your-domain.com/` — a custom domain
- a subfolder on any other static host

**Custom domain:** add a `CNAME` file at the root containing just the domain,
then update the absolute URLs in `robots.txt`, `sitemap.xml`, and the
`canonical` / `og:url` tags in each page's `<head>`.

---

## Design system

Defined once in `assets/css/tokens.css` and used everywhere else.

| Role | Token | Value |
| --- | --- | --- |
| Page base | `--ink` | `#07090e` |
| Alternate band | `--ink-soft` | `#0a0e16` |
| Panel | `--navy` | `#0e1524` |
| Raised panel / inputs | `--navy-soft` | `#131c2e` |
| Hairline | `--line` | `#1d2942` |
| Accent (fills) | `--royal` | `#2b5fe3` |
| Accent (text) | `--royal-hi` | `#4c7df0` |
| Primary text | `--paper` | `#f3f6fb` |
| Secondary text | `--silver` | `#9aa8be` |
| Tertiary text | `--steel` | `#6e7d96` |

**The one rule:** royal blue marks things you can interact with, or one thing
per section that deserves emphasis. Nothing is coloured decoratively, and there
are no multi-colour gradients anywhere. That restraint is what keeps it reading
as an engineering firm rather than a template.

Every text colour above meets WCAG AA against its intended background, and
white on `--royal` reaches 5.49:1.

### Typography

Plus Jakarta Sans for text, JetBrains Mono for labels, code and numbers, both
from Google Fonts. Headings use fluid `clamp()` sizes, so they interpolate
smoothly between phone and desktop instead of jumping at breakpoints.

### Motion

- Entrances use `--ease-out` (`cubic-bezier(.16,1,.3,1)`) — decisive, never bouncy.
- Scroll reveals are driven by `IntersectionObserver`; siblings stagger via a
  `--i` custom property.
- The hero entrance is a pure CSS animation, so it cannot be left blank by a
  throttled frame callback or by JavaScript failing to load.
- Every animation is disabled under `prefers-reduced-motion: reduce`, and the
  hero canvas draws a single static frame instead of nothing.
- The canvas and the terminal typewriter pause when off-screen or when the tab
  is hidden.

## Accessibility

- Skip link, and a visible focus ring on every interactive element.
- Dialogs trap focus, close on <kbd>Esc</kbd> and on backdrop click, restore
  focus to the trigger, and lock body scroll without the iOS jump.
- The accordion follows the ARIA pattern, including arrow-key navigation.
- Result counts and wizard steps are announced through `aria-live` regions.
- Touch targets are at least 44 px.
- The marketplace works without a mouse; the pages degrade to readable content
  without JavaScript.

## Editing content

**Projects** — edit `assets/js/catalog.js`. Categories, price bands, filters,
counts and the detail dialog all derive from that one array.

**Services, process, FAQ, packages** — plain markup in the relevant page.
The mentorship FAQ is duplicated as JSON-LD in that page's `<head>`; update
both together so search results stay accurate.

**Form destination** — `FORMSPREE_ENDPOINT` at the top of `assets/js/ui.js`.
Both the request wizard and the footer subscribe form post there.
