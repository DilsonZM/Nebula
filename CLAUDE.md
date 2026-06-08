# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running locally

No build step. Open `index.html` directly in a browser, or serve with any static server:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

For local testing of mobile features, use browser DevTools device emulation (Ctrl+Shift+M in Chrome/Firefox).

## Deploying

Pushes to `main` auto-deploy to GitHub Pages via legacy (branch-based) mode. After pushing:

```bash
gh api repos/DilsonZM/Nebula/pages/builds -X POST          # trigger build
gh api repos/DilsonZM/Nebula/pages/builds/latest --jq '.status'  # check status
```

Live URL: https://dilsonzm.github.io/Nebula/

## Architecture

Static single-page app, no frameworks, no bundler. Three files:

- `index.html` — structure + meta tags (favicon is an inline SVG data URI)
- `css/style.css` — responsive styles with mobile-first media queries
- `js/nebula.js` — all logic wrapped in an IIFE

### How the JS is structured

`js/nebula.js` is organized into labeled sections (`/* === DETECCIÓN DE DISPOSITIVO === */`, etc.), executed top-to-bottom on load:

1. **Device detection** (`detectDevice()`) runs first. Heuristics: `ontouchstart` / `maxTouchPoints` + screen width → classifies as `desktop | touch-laptop | tablet | mobile`. Drives default `settings.count`, `settings.captureRadius`, `settings.maxFollowing`, initial panel state (collapsed on mobile), and the info hint text shown to the user.
2. **Input abstraction** — `mouseScreen` (pixel coords) and `mouse` (world coords after undoing zoom). `screenToWorld()` is the single conversion. All handlers (mouse, touch, pinch) funnel into the same state.
3. **Particle system** — `Particle` class with `baseX/baseY` (home position) + `x/y` (current) + `following` flag. The "leash" mechanic (`MAX_LEASH`) is what makes particles release when the cursor wanders far — this is the core interaction feel.
4. **Click pulse** — `startClickPulse()` creates a temporary attractor whose radius and force are *scaled by `settings.magnetStrength`*. The pulse runs for N frames, then resolves into `clickLinks` (the 6 nearest particles at that moment). So magnet strength directly controls which particles end up linked.
5. **Render loop** — `requestAnimationFrame(loop)`. Each frame: solid fill (no trails), then ctx transform for zoom, then pulse/links/particles draw, then reset transform.

### Key interaction rules worth knowing when modifying

- Particles are **recaptured dynamically**: when one releases from the leash, the next nearest within `captureRadius` gets `following = true` on the next frame. This "relay" is what makes the cursor feel magnetic.
- The click pulse's **final frame** picks the 6 nearest — so if magnet strength is low, only particles already close survive the attraction and get linked.
- Zoom is applied as a ctx transform around `(W/2, H/2)`, so all drawing is in world coords and input must be un-transformed via `screenToWorld`.

### Responsive layout strategy

`css/style.css` uses these breakpoints — don't add CSS that fights them:

| Breakpoint | Panel behavior | Touch targets |
|---|---|---|
| `> 1024px` | floating top-right, 280px wide | 14px slider thumbs |
| `768–1024px` | floating, 260px wide | 18px slider thumbs |
| `< 768px` | **bottom-sheet** with drag handle (`::before` pseudo) | 26px slider thumbs, 52px toggle btn |
| `< 400px` | compact bottom-sheet | smaller logo |
| `max-height: 500px + landscape` | reverts to floating top-right | — |

Safe-area insets (`env(safe-area-inset-*)`) are applied on `html` and mobile panel bottom padding — preserve these for iPhone notch support.

### Touch event gotchas

- `touchstart`/`touchmove` on the canvas use `{ passive: false }` because we call `preventDefault()` to block native pinch-zoom and scroll.
- The panel and toggle button call `e.stopPropagation()` on touch events so taps on sliders don't trigger particle attraction underneath.
- Pinch-zoom uses two-finger distance ratio; `isPinching` flag prevents single-finger click from firing while pinching.

## Language

The user communicates in Spanish. Code comments are mixed Spanish/English. README and UI strings are in Spanish. Match the user's language in replies.
