---
name: Fieldora Platinum
colors:
  surface: '#f8faf9'
  surface-dim: '#d8dada'
  surface-bright: '#f8faf9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f3'
  surface-container: '#eceeed'
  surface-container-high: '#e6e9e8'
  surface-container-highest: '#e1e3e2'
  on-surface: '#191c1c'
  on-surface-variant: '#404940'
  inverse-surface: '#2e3131'
  inverse-on-surface: '#eff1f0'
  outline: '#707a6f'
  outline-variant: '#bfc9bd'
  surface-tint: '#1f6c3a'
  primary: '#004c22'
  on-primary: '#ffffff'
  primary-container: '#166534'
  on-primary-container: '#93e0a2'
  inverse-primary: '#8bd79b'
  secondary: '#436650'
  on-secondary: '#ffffff'
  secondary-container: '#c2e9ce'
  on-secondary-container: '#476a55'
  tertiary: '#264831'
  on-tertiary: '#ffffff'
  tertiary-container: '#3e6047'
  on-tertiary-container: '#b2d9b9'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a6f4b5'
  primary-fixed-dim: '#8bd79b'
  on-primary-fixed: '#00210b'
  on-primary-fixed-variant: '#005226'
  secondary-fixed: '#c5ecd1'
  secondary-fixed-dim: '#a9cfb5'
  on-secondary-fixed: '#002111'
  on-secondary-fixed-variant: '#2c4e3a'
  tertiary-fixed: '#c5eccc'
  tertiary-fixed-dim: '#aad0b1'
  on-tertiary-fixed: '#00210e'
  on-tertiary-fixed-variant: '#2c4e36'
  background: '#f8faf9'
  on-background: '#191c1c'
  surface-variant: '#e1e3e2'
  deep-forest: '#0B2B16'
  soft-sage: '#DAE5DC'
  glass-stroke: rgba(255, 255, 255, 0.4)
  high-contrast-white: '#FFFFFF'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: 0.01em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.06em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-padding-mobile: 20px
  container-padding-desktop: 40px
  gutter: 24px
  section-gap: 64px
---

## Brand & Style

The design system evolves the product into a premium, high-trust agricultural technology platform. The personality is "Sophisticated Stewardship"—merging the raw power of the earth with the precision of elite software. It targets high-stakes decision-makers who value clarity, reliability, and modern efficiency.

The chosen style is **Modern Glassmorphism**. This approach uses layered transparency, soft background blurs, and "air-thin" borders to create a sense of lightness and depth. This isn't just aesthetic; it’s functional, allowing complex agricultural data to feel breathable and organized. The UI should evoke the feeling of a high-end command center: calm, professional, and technologically advanced.

## Colors

The palette is anchored by the heritage **Primary Green (#166534)**, now supported by a sophisticated range of environmental tones. 

- **Primary & Deep Tones:** Primary Green is used for key actions, while "Deep Forest" provides a grounding weight for typography and dark-mode elements.
- **Accents:** "Soft Sage" serves as a gentle highlight for secondary containers and subtle gradients, bridging the gap between the primary green and the neutral background.
- **Backgrounds:** The interface utilizes a "High-Contrast White" for core surfaces, layered over a "Neutral" off-white base to create subtle separation.
- **Gradients:** Use linear gradients sparingly. A primary gradient moves from `#166534` to `#2D4F3B` at 135 degrees. For glass cards, use a radial highlight of white (10% opacity) in the top-left corner to simulate light hitting a glass surface.

## Typography

This design system uses **Inter** with a heavy emphasis on intentional white space and tracking. 

- **Headlines:** Large display and headline levels use aggressive negative letter-spacing (-0.02em to -0.04em) to create a tight, editorial look common in luxury tech.
- **Body Text:** Increased leading (1.5x - 1.6x) and slight positive tracking (0.01em) ensure long-form data remains legible and premium.
- **Labels:** Small labels are strictly uppercase with wider tracking (0.06em) to serve as clear "meta-data" markers without cluttering the visual hierarchy.

## Layout & Spacing

The layout philosophy relies on a **Fluid Grid** with generous safe areas to maintain a "high-end" feel.

- **Grid Model:** A 12-column grid for desktop with 24px gutters. For tablet, an 8-column grid, and for mobile, a 4-column grid with 20px side margins.
- **Rhythm:** An 8px base unit drives all spacing. Component internal padding should default to 16px (2 units) or 24px (3 units) for larger cards.
- **Density:** Favor "Luxury Density"—wide margins and significant gaps between sections (64px+) to prevent the agritech data from feeling overwhelming. Elements should feel like they have room to breathe.

## Elevation & Depth

Hierarchy is established through **Glassmorphism** and **Ambient Shadows**.

- **Glass Effect:** Primary containers use a semi-transparent background (`rgba(255, 255, 255, 0.7)`) with a `backdrop-filter: blur(20px)`. 
- **Borders:** Instead of heavy shadows, use "Thin-Stroke" borders. A 1px solid border using `glass-stroke` provides a sharp, glass-like edge.
- **Layered Shadows:** For depth, use extra-diffused, low-opacity shadows. A "Standard" elevation uses `0 8px 32px 0 rgba(11, 43, 22, 0.08)`. This tinting (using the Deep Forest color) ensures shadows feel natural to the environment rather than a generic gray.
- **Stacked Depth:** Use surface-on-surface tiers where the base is `#F8FAF9`, the middle layer is a blurred glass card, and the top layer (modals/popovers) is a higher-opacity white with a stronger shadow.

## Shapes

The shape language is "Premium Organic." 

- **Cards:** Use a consistent **16px to 24px** radius (represented by `rounded-lg` and `rounded-xl`). This softness contrasts with the technical nature of the data, making the software feel more approachable and modern.
- **Buttons & Inputs:** Use the `rounded` (8px) setting for a precise, "engineered" feel that differentiates interactive controls from informational containers.
- **Micro-shapes:** Small indicators like notification dots or status pips should remain perfectly circular.

## Components

- **Buttons:** CTAs must be impactful. The Primary button uses the Forest Green gradient with a subtle inner glow on the top edge and a soft drop shadow. Use a `scale(0.98)` micro-interaction on click and a slight `translateY(-2px)` on hover.
- **Cards:** The hallmark of the system. Cards feature a 1px white border (40% opacity), 20px background blur, and a 24px corner radius. Icons within cards should be minimalist, 2px stroke weight, using the Primary Green.
- **Input Fields:** Soft-focus fields with a `Soft Sage` background at 10% opacity. On focus, the border transitions to a crisp Primary Green with a 4px outer "glow" of the same color at 10% opacity.
- **Chips/Badges:** Use a "Frosted" style—low-opacity background of the status color with high-contrast text. For example, a "Live" badge would be 10% Primary Green background with 100% Primary Green text.
- **Lists:** Clean rows with no vertical lines. Use a 1px `Soft Sage` horizontal divider. Hovering over a list item should trigger a subtle white background shift (5% opacity) and a slight horizontal indentation of the text.
- **Checkboxes/Radios:** Custom-styled elements using the Primary Green. When active, they should have a small "bloom" shadow to appear tactile and responsive.