# Design System: IncidentLens AI

## 1. Visual Theme & Atmosphere

IncidentLens is a calm incident command surface: cockpit-dense enough for on-call work, but never visually frantic. Density is 7/10, variance is 6/10, and motion is 4/10. Layouts use asymmetric operational rails, strong alignment, and quiet negative space. The interface should feel like precision monitoring hardware, not a generic AI dashboard.

## 2. Color Palette & Roles

- **Command Canvas** (`#090D12`) - deepest application background; never pure black.
- **Raised Graphite** (`#10161D`) - primary working surfaces and navigation.
- **Instrument Surface** (`#151D26`) - elevated controls and selected rows.
- **Quiet Steel** (`#7D8A99`) - secondary copy and metadata.
- **Signal White** (`#E8EDF2`) - primary text and critical hierarchy.
- **Whisper Line** (`rgba(178, 196, 214, 0.12)`) - structural hairlines and separators.
- **Mineral Cyan** (`#56B8C7`) - the single product accent for focus, active state, and primary action.
- **Critical Red** (`#F06A6A`) - semantic incident severity only.
- **Warning Amber** (`#E7A75D`) - semantic degradation only.
- **Healthy Green** (`#6FC69A`) - semantic success only.

No purple, neon blue, multicolor gradient, or decorative glow is permitted.

## 3. Typography Rules

- **Display and interface:** Geist, weights 450-650, tightly tracked headings.
- **Operational data:** JetBrains Mono for IDs, timestamps, metrics, tokens, costs, and logs.
- **Scale:** page titles use `clamp(1.55rem, 2vw, 2.25rem)`; section titles remain compact.
- **Body:** 14px minimum for primary reading content, relaxed line-height, 65ch maximum.
- **Banned:** Inter, generic serif faces, oversized marketing typography, gradient text.

## 4. Component Styling

- **Cards:** double-bezel construction for primary workspaces only. Outer shell uses a translucent steel ring and 6px inset; inner surface uses a graphite fill and subtle top highlight. Dense rows use separators rather than nested cards.
- **Buttons:** 44px touch target, rounded 10px or pill primary actions, tactile press scale, custom weighted easing. No glow.
- **Inputs:** labels above fields, dark instrument surface, visible mineral-cyan focus ring, inline error or helper copy below.
- **Status:** a small semantic dot plus plain-language label. Color never carries meaning alone.
- **Tables:** sticky headers where useful, generous row hit areas, full-row navigation, selected-row state.
- **Loading:** geometry-matched skeletons. No circular full-page spinners.
- **Empty states:** explain what is absent and provide the next valid action.

## 5. Layout Principles

- Desktop uses a 248px command rail and a constrained 1600px content canvas.
- Investigation uses an asymmetric three-region workspace: context rail, report canvas, evidence/action rail.
- Tablet collapses supporting rails beneath the primary task.
- Mobile is a strict single column with a sheet-based navigation menu and no horizontal page overflow.
- Grids communicate workflow priority, not equal-card symmetry.
- Every element owns a clear spatial zone; no content overlap.

## 6. Motion & Interaction

- Use `cubic-bezier(0.32, 0.72, 0, 1)` for all transitions.
- Page regions enter with a restrained staggered fade and 12px vertical translation.
- Animate transform and opacity only, except determinate progress indicators.
- Respect `prefers-reduced-motion` globally.
- Active/live signals may use a subtle opacity pulse; static cards never float or shimmer.

## 7. UX Flow Rules

- Global search must navigate to the relevant incident or workspace.
- Every incident row is selectable and opens its investigation.
- Evidence upload reports upload, extraction, chunking, and embedding progress.
- Investigation actions expose whether they are safe, approval-gated, or unavailable.
- Trace views connect each agent run to tool calls, latency, tokens, and report output.
- Eval and settings controls communicate saved, running, success, and failure states.

## 8. Anti-Patterns

- No emojis, sparkles, robot heads, magic wands, or decorative AI glyphs.
- No purple, neon outer glows, excessive gradients, or pure black.
- No Inter, generic serif, or oversized landing-page typography.
- No generic three-equal-card grids when hierarchy differs.
- No fake chat UI, placeholder lorem ipsum, or AI copywriting cliches.
- No decorative glass blur on scrolling content.
- No dead controls, unlabeled icon buttons, or color-only status communication.
