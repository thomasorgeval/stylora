# Stylora Auth Pages Design

## Scope

This design covers the browser `sign-in` and `sign-up` pages in `apps/web`.

The goal is to replace the current bare auth screens with a credible, product-facing experience that matches Stylora's light-first, editorial, and technically serious direction.

This work changes presentation and shared UI structure only. It does not change the underlying authentication flow, routes, or redirect targets.

## Product Intent

The auth pages should feel like the front door to a real database workspace, not a temporary admin screen.

They should communicate three things immediately:

- Stylora is built for day-to-day PostgreSQL work
- the product has structure from the start, with organizations and projects
- the experience is premium and calm rather than flashy or startup-like

The screens should remain efficient. Product presence is important, but the form must stay clear and primary.

## Agreed Direction

The approved direction is `Split editorial`.

Both pages use the same overall composition:

- a left editorial panel with product framing and credibility cues
- a right form panel with a denser, more practical auth surface
- a shared light, warm, restrained visual system

`sign-in` and `sign-up` should feel like a matched pair rather than two unrelated screens. The structure, spacing, and visual rhythm stay nearly identical; only the copy and fields change.

## Layout

### Desktop

Use a two-column auth layout centered inside a generous viewport container.

- left column: editorial panel
- right column: form panel

The left side should not behave like a marketing hero. It is a product-intent panel with stronger typography, short supporting copy, and a few concise proof points.

The right side is the operational area. It should feel denser, more tactile, and more immediately actionable.

### Tablet

Keep the two-column composition as long as it remains comfortable. Reduce gap sizes and editorial padding before collapsing.

### Mobile

Collapse to a vertical stack.

- editorial block first, shortened
- form block second, still visually dominant

The mobile version must keep all actions available. No critical content should be hidden behind secondary interactions.

## Visual System

### General Tone

Use a light-first palette with warm neutrals and restrained contrast. The visual direction should feel editorial, premium, and product-oriented.

Avoid:

- generic B2B gradients
- dark neon SaaS styling
- heavy glassmorphism
- decorative dashboard fakery

### Background and Surface Treatment

The page background should feel composed rather than empty.

- soft warm neutral page background
- subtle structural lines or panel framing inspired by workspace organization
- a slightly elevated form surface on the right

The visual treatment should suggest a serious tool without looking cold.

### Typography

Typography should carry much of the personality.

- editorial headline on the left panel
- tighter, more operational heading on the right panel
- concise supporting copy with strong line length control

The copy should be understated and precise.

## Page-Specific Content

### Sign In

Purpose: resume work quickly.

Recommended content:

- eyebrow: product or workspace label
- headline: action-oriented and direct
- short supporting text focused on continuity
- fields: email, password
- primary CTA spanning full width
- secondary path to account creation

Working copy direction:

- title: `Open your workspace`
- supporting line: continue where you left off in your PostgreSQL workspace

### Sign Up

Purpose: create a credible starting point for a new user.

Recommended content:

- same overall shell and rhythm as sign-in
- fields: name, email, password
- brief reassurance that a personal organization is created automatically
- short password requirement hint
- secondary path back to sign-in

Working copy direction:

- title: `Create your account`
- supporting line: start with a personal workspace and invite others later

## Component Strategy

Use `PrimeNG` for form primitives and feedback. Use `Tailwind CSS` for layout, spacing, typography, surfaces, and responsive behavior.

### PrimeNG Responsibilities

- `Card` or equivalent container treatment for the form surface
- `InputText` for text and email inputs
- `Password` for password entry
- `Button` for primary action
- `Message` for inline error feedback

If the native `Password` feedback panel feels too noisy for this layout, disable it and prefer a quiet inline helper text under the field.

### Tailwind Responsibilities

- page grid and responsive collapse
- visual spacing rhythm
- background and surface composition
- typography hierarchy
- borders, dividers, and subtle structural details

## Shared UI Extraction

Because the two pages are intentionally near twins, one reusable auth shell is justified.

Recommended extraction target:

- `packages/ui/src/lib/components/stylora-auth-shell.component.ts`

Responsibilities:

- render the shared split layout
- host the editorial column framing
- host the form column framing
- expose content slots for page-specific copy and form fields
- stay presentation-only, with no auth logic

This component should be a shell, not a full auth form abstraction. The form controls, submission state, and route-specific copy should remain in the page components unless repetition becomes large enough to justify a second extraction later.

Potential API shape:

- projected region for editorial content
- projected region for form content
- optional input for eyebrow or title if projection alone feels too loose

Do not extract additional helper components unless repetition clearly appears during implementation.

## Interaction and States

### Submission State

- keep the current anti-double-submit behavior
- disable the primary button while submitting
- preserve the current in-button loading copy pattern

### Error State

- render errors inline inside the form area
- keep the current error messages as the source of truth
- make the error noticeable without visually overwhelming the page

### Navigation Links

- keep the opposite auth route visible at the bottom of the form panel
- links should feel secondary but discoverable

## Accessibility and UX Constraints

- preserve correct `autocomplete` values for every field
- maintain clear label-to-field associations
- keep visible focus styles on interactive elements
- ensure text contrast remains strong on warm neutral backgrounds
- keep touch targets comfortable on mobile

The design should remain usable even if all decorative treatment is mentally removed. The hierarchy must still work through spacing, labels, and structure.

## Implementation Notes

- keep the current `signIn()` and `signUp()` flows unchanged unless a small template-driven adjustment is needed for PrimeNG compatibility
- keep redirects to `/projects`
- use the new shared auth shell in both page templates if the implementation stays lightweight
- do not move auth service logic into `packages/ui`

## Verification

After implementation, verify at minimum:

- `sign-in` renders and submits correctly
- `sign-up` renders and submits correctly
- inline errors display correctly
- loading states disable repeated submission
- desktop split layout looks balanced
- mobile stacked layout remains readable and complete
- the web app build passes

## Out of Scope

- social login
- magic link flows
- password reset
- invitation flows
- onboarding wizard after sign-up
- auth domain logic refactors unrelated to presentation
