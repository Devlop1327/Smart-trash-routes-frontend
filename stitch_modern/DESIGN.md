# Design System Document: The Smart Logistics Interface

## 1. Overview & Creative North Star
**Creative North Star: "The Intelligent Ecosystem"**

This design system moves beyond the utility of a "trash app" to create a premium, logistics-focused editorial experience. The goal is to blend the organic reliability of environmental stewardship with the precision of advanced routing technology. 

To break the "template" look, we utilize **Asymmetric Depth**. Instead of standard center-aligned grids, we use generous leading-edge whitespace and overlapping surface layers. The interface should feel like a high-end digital cockpit—intentional, breathable, and authoritative. By prioritizing tonal transitions over structural lines, we create a fluid user journey that feels more like a sophisticated dashboard and less like a basic utility tool.

---

## 2. Colors & Surface Architecture

The palette is anchored in **Deep Greens** (`primary`) for environmental authority and **Tech Blues** (`secondary`) for logistical precision, set against a canvas of **Clean Whites** (`surface-container-lowest`).

### The "No-Line" Rule
To achieve a high-end editorial feel, **1px solid borders are strictly prohibited for sectioning.** Boundaries must be defined solely through background color shifts.
*   *Implementation:* Place a `surface-container-low` component directly onto a `surface` background. The shift in hex value provides the boundary; the eye does the rest.

### Surface Hierarchy & Nesting
Treat the UI as physical layers of "Tech-Glass." 
*   **Base:** `surface` (#f7faf8)
*   **Sections:** `surface-container-low` (#f1f4f2)
*   **Interactive Cards:** `surface-container-lowest` (#ffffff)
*   **Overlays:** `surface-bright` (#f7faf8) with 80% opacity.

### The "Glass & Gradient" Rule
Standard flat colors feel static. To inject "soul" into the tech-focus:
*   **Hero CTAs:** Use a subtle linear gradient from `primary` (#005344) to `primary_container` (#006d5b) at a 135-degree angle.
*   **Floating Navigation:** Apply `backdrop-blur: 12px` to surface colors at 70% opacity to create a frosted-glass effect, allowing map data or routes to bleed through the UI edges softly.

---

## 3. Typography: The Editorial Voice

We utilize a dual-sans-serif approach to balance high-tech precision with human readability.

*   **Display & Headlines (Manrope):** Chosen for its geometric modernism. Use `display-lg` for data-heavy stats and `headline-md` for section titles. The wide apertures of Manrope convey openness and tech-forwardness.
*   **Body & Labels (Inter):** The industry standard for legibility. Use `body-lg` for primary instructions and `label-sm` for technical metadata (e.g., bin weight, route distance).
*   **Intentional Scale:** Contrast is key. Pair a `display-sm` metric with a `label-md` uppercase caption to create a "Logistics Ledger" look that feels professional and curated.

---

## 4. Elevation & Depth

### The Layering Principle
Avoid "drop shadows" as a default. Depth is achieved by "stacking" the surface tiers. A `surface-container-lowest` card sitting on a `surface-container-high` background creates a natural, soft lift that feels integrated into the environment.

### Ambient Shadows
Where floating elements (like an Expandable Map FAB) are required, use **Ambient Shadows**:
*   **Shadow:** `0px 8px 24px`
*   **Color:** `on_surface` (#181c1b) at **6% opacity**. 
*   *Note:* Never use pure black or dark grey; the shadow must be a tinted "ghost" of the surface color.

### The "Ghost Border" Fallback
If high-contrast accessibility is required, use a **Ghost Border**:
*   `outline_variant` (#bec9c4) at **15% opacity**.
*   This provides a hint of structure without the "boxed-in" feel of a standard 100% opaque border.

---

## 5. Components

### Primary Call-to-Action (Buttons)
*   **Style:** `xl` (1.5rem) rounded corners.
*   **Visual:** Gradient fill (`primary` to `primary_container`). 
*   **State:** On hover/active, shift to `primary_fixed` to provide a "glow" effect.
*   **Typography:** `title-sm` (Inter), semi-bold, `on_primary` text.

### Logistics Cards
*   **Constraint:** No dividers. Use `md` (0.75rem) vertical spacing between groups.
*   **Header:** Use `title-md` in `primary` color.
*   **Body:** Nested on a `surface-container-low` background to separate "Route Details" from the main card body.

### Status Chips
*   **Active Route:** `secondary_container` background with `on_secondary_container` text.
*   **Eco-Saved:** `primary_fixed` background with `on_primary_fixed` text.
*   **Shape:** `full` (9999px) pill shape for maximum friendliness.

### Input Fields
*   **Style:** Minimalist. No bottom line.
*   **Container:** `surface-container-highest` background with `xl` (1.5rem) corner radius.
*   **Focus:** Transition the background to `surface-container-lowest` and apply a `Ghost Border` of `secondary` at 20% opacity.

### Route Progress (Custom Component)
*   Instead of a thin line, use a thick `8px` bar with `full` rounding. 
*   Completed segments: `primary`.
*   Remaining segments: `surface-dim`.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical margins (e.g., 24pt left, 16pt right) to create an editorial flow.
*   **Do** use `tertiary` (#00505b) for technical secondary data like "GPS Signal" or "Truck ID."
*   **Do** lean into `xl` (1.5rem) corner radius for large containers to soften the "industrial" feel of trash collection.

### Don't
*   **Don't** use 1px dividers to separate list items. Use 16px of `surface-container` color blocks instead.
*   **Don't** use pure black (#000000) for text. Always use `on_surface` (#181c1b) to maintain a soft, premium contrast.
*   **Don't** use standard "Warning Yellow." Use the `error` (#ba1a1a) tokens sparingly for high-priority alerts to keep the eco-friendly green/blue palette dominant.