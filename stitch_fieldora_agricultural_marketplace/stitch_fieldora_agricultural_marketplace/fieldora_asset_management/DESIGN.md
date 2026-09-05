---
name: Fieldora Asset Management
colors:
  surface: '#f1fcf2'
  surface-dim: '#d1ddd3'
  surface-bright: '#f1fcf2'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#ebf7ed'
  surface-container: '#e5f1e7'
  surface-container-high: '#e0ebe1'
  surface-container-highest: '#dae5dc'
  on-surface: '#141e18'
  on-surface-variant: '#404940'
  inverse-surface: '#28332c'
  inverse-on-surface: '#e8f4ea'
  outline: '#707a6f'
  outline-variant: '#bfc9bd'
  surface-tint: '#1f6c3a'
  primary: '#004c22'
  on-primary: '#ffffff'
  primary-container: '#166534'
  on-primary-container: '#93e0a2'
  inverse-primary: '#8bd79b'
  secondary: '#006e2f'
  on-secondary: '#ffffff'
  secondary-container: '#6bff8f'
  on-secondary-container: '#007432'
  tertiary: '#00389b'
  on-tertiary: '#ffffff'
  tertiary-container: '#004dcd'
  on-tertiary-container: '#bfcdff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a6f4b5'
  primary-fixed-dim: '#8bd79b'
  on-primary-fixed: '#00210b'
  on-primary-fixed-variant: '#005226'
  secondary-fixed: '#6bff8f'
  secondary-fixed-dim: '#4ae176'
  on-secondary-fixed: '#002109'
  on-secondary-fixed-variant: '#005321'
  tertiary-fixed: '#dbe1ff'
  tertiary-fixed-dim: '#b4c5ff'
  on-tertiary-fixed: '#00174b'
  on-tertiary-fixed-variant: '#003ea8'
  background: '#f1fcf2'
  on-background: '#141e18'
  surface-variant: '#dae5dc'
typography:
  page-title:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  page-title-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  section-title:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  impact-price:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.03em
  body-main:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-secondary:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style
The design system embodies a "Modern Agritech" aesthetic—moving away from rural cliches toward a high-performance, data-driven utility. The brand personality is rooted in precision, reliability, and growth. 

The visual style is **Corporate / Modern** with a focus on high-information density presented through a clean, systematic lens. It utilizes a predominantly neutral canvas to allow data points and primary green accents to command attention. The interface should feel like a premium tool for decision-makers: stable, professional, and transparent.

## Colors
The palette is engineered for a 75/15/10 distribution to ensure a "clean" and "airy" professional environment.

- **Primary (#166534):** Reserved for high-priority actions, brand identity, and active navigation states. It represents the "earth" and stability.
- **Accent/Success (#22C55E):** Used specifically for positive data trends (price up) and confirmation states.
- **Functional Grays:** The background is a custom off-white with a hint of green desaturation (`#F7F9F6`) to reduce eye strain compared to pure white, while cards remain pure white for maximum lift.
- **Status Colors:** Standardized for immediate recognition in a data-heavy marketplace environment.

## Typography
This design system uses **Inter** exclusively to leverage its exceptional legibility in data grids and technical interfaces. 

- **Hierarchy:** Large titles use tighter letter-spacing to appear more "designed" and premium.
- **Data Emphasis:** "Impact Prices" are treated as a distinct typographic class, prioritized for immediate scanning.
- **Scalability:** Page titles shift from 32px to 28px on mobile to maintain layout integrity without sacrificing the "premium" feel.

## Layout & Spacing
The layout follows a **Fluid Grid** model with fixed maximum widths for desktop content (1280px) to ensure readability.

- **Desktop:** 12-column grid with a persistent 280px left-hand sidebar for navigation. Gutters are set to 24px for a spacious, professional feel.
- **Mobile:** 4-column grid with 16px side margins. Navigation moves to a fixed bottom bar with 4-5 primary touch targets.
- **Rhythm:** An 8px linear scale is used for all internal component spacing to maintain a structured, mathematical layout.

## Elevation & Depth
The design system utilizes **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows.

- **Surface Strategy:** Background is `#F7F9F6`. Cards and primary containers are `#FFFFFF`.
- **Borders:** Subtle 1px borders in `#E5EAE5` define most containers.
- **Shadows:** Only used for "floating" elements like dropdowns or active modals. Use a "Soft Diffused" style: `0px 4px 12px rgba(23, 33, 27, 0.05)`.
- **Interactivity:** On hover, cards may transition from a flat border to a slightly deeper shadow (`0px 8px 24px rgba(23, 33, 27, 0.08)`) to indicate clickability.

## Shapes
The shape language is "Calculated Softness." Elements are rounded enough to feel modern and accessible but retain enough structure to feel professional.

- **Cards:** 12px radius creates a clear distinction between the page background and the content container.
- **Controls:** 8px radius for inputs and buttons provides a precise, "tool-like" appearance.
- **Badges/Chips:** Always pill-shaped (full radius) to contrast against the more rectangular structure of data cards and tables.

## Components
- **Buttons:** Primary buttons use `#166534` with white text. Height is 44px for desktop and 48px for mobile to ensure "fat-finger" accessibility.
- **Input Fields:** Use `#FFFFFF` background with a `#E5EAE5` border. On focus, the border shifts to the primary green with a 2px outer "glow" of 10% primary green.
- **Cards:** High-density info cards. They must include a subtle 1px border. Padding should be a consistent 20px (`lg` spacing) internally.
- **Pill Badges:** Used for category tags and status. Backgrounds are 10% opacity versions of the status color (e.g., Success badge has a light green tint with dark green text).
- **Navigation:**
    - **Sidebar:** Icons (Lucide) on the left, 20px size. Active state indicated by a 4px vertical "pill" on the left edge in Primary Green.
    - **Mobile Nav:** Fixed at the bottom, blurred backdrop (glassmorphism) for a premium feel, with centered labels below icons.
- **Data Tables:** Clean lines, no vertical borders. Header row uses `label-caps` typography with a subtle gray background.