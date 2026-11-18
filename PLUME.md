# Plume — Soft UI ecommerce demo

A neumorphic (soft UI) storefront with tactile 3D-style objects and springy motion. Plain HTML, CSS and JS: no build step and no dependencies.

Open `index.html` in a browser, or serve the folder:

```bash
npx serve .        # or: python3 -m http.server
```

## What reacts to what

| Interaction | Where |
|---|---|
| **Light follows the cursor.** Every shadow is driven by `--sx/--sy`, and a glow tracks the pointer | `js/main.js` §1, `.neu` / `.neu-in` in `css/style.css` |
| **Device tilt** moves the light and the parallax layers on phones | `deviceorientation` listener |
| **Parallax layers** in the hero (`data-depth`) | `tick()` |
| **Day/night theme.** Picks dark at night (19:00–06:00) or when the system is dark; the toggle does a circular reveal | §2, View Transitions API |
| **Colour swatches** recolour the SVG products live (CSS variables) | §3 |
| **3D card tilt** under the cursor | §3 |
| **Filter + search** with FLIP re-layout | §4 |
| **Add to cart.** A dot flies to the bag, the badge bounces, the drawer has a free-shipping meter | §5 |
| Countdown ring, scroll reveals, toasts | Extras |

## Design rules used

- Surfaces share one colour. Depth comes from paired light and dark shadows (`.neu` raised, `.neu-in` pressed).
- **Primary actions are solid accent colour**, never soft-on-soft, so they stay accessible.
- `prefers-reduced-motion` turns off floats, flights and FLIP, and makes the light snap instead of glide.
