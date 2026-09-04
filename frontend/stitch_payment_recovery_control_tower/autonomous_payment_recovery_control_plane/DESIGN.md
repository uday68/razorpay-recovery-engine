---
name: Autonomous Payment Recovery Control Plane
colors:
  surface: '#0d141d'
  surface-dim: '#0d141d'
  surface-bright: '#333a44'
  surface-container-lowest: '#080f17'
  surface-container-low: '#151c25'
  surface-container: '#192029'
  surface-container-high: '#232a34'
  surface-container-highest: '#2e353f'
  on-surface: '#dce3f0'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#dce3f0'
  inverse-on-surface: '#2a313b'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#7bd0ff'
  on-tertiary: '#00354a'
  tertiary-container: '#009bd1'
  on-tertiary-container: '#002d40'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#c4e7ff'
  tertiary-fixed-dim: '#7bd0ff'
  on-tertiary-fixed: '#001e2c'
  on-tertiary-fixed-variant: '#004c69'
  background: '#0d141d'
  on-background: '#dce3f0'
  surface-variant: '#2e353f'
typography:
  display-lg:
    fontFamily: geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: geist
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: geist
    fontSize: 15px
    fontWeight: '500'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-md:
    fontFamily: inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  body-sm:
    fontFamily: inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  mono-metric-lg:
    fontFamily: jetbrainsMono
    fontSize: 28px
    fontWeight: '500'
    lineHeight: 34px
    letterSpacing: -0.02em
  mono-metric-md:
    fontFamily: jetbrainsMono
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: -0.01em
  mono-code:
    fontFamily: jetbrainsMono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  label-caps:
    fontFamily: jetbrainsMono
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.08em
  badge-label:
    fontFamily: jetbrainsMono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-base: 1rem
  space-lg: 1.25rem
  space-xl: 1.5rem
  space-2xl: 2rem
  space-3xl: 3rem
  layout-margin-desktop: 1.5rem
  layout-margin-compact: 1rem
  table-cell-padding-y: 0.625rem
  table-cell-padding-x: 0.875rem
---

## Brand & Style

The design system projects mission-critical precision, deterministic reliability, and high-frequency intelligence. Built specifically for payment engineers, financial operations commanders, and quantitative infrastructure leads, the UI rejects cosmetic clutter in favor of high-density financial observability.

### Visual Style: Infrastructure Precision

The style merges **Terminal-Grade Minimalism** with **Deep-Canvas Layering**:
- **Palette Rigor**: Absolute dark-mode dominance rooted in deep charcoal and near-black slate. Vibrant tones are strictly functional—never decorative.
- **Data Legitimacy**: Monospaced typography for all mutable financial quantities, hash identifiers, system states, confidence percentages, and timestamps.
- **Architectural Clarity**: Thin, razor-sharp boundary lines (1px) establish structural divisions, avoiding heavy drop shadows in favor of subtle surface luminosity differences.
- **Operational Cadence**: Status signals use micro-pulses, tabular density preserves vertical rhythm, and progressive disclosure isolates cognitive load during real-time recovery incident mitigation.

## Colors

The color architecture is built around a dark canvas with high-contrast, semantic-driven functional channels. Colors denote state, confidence, and system-level authority.

### Base Surfaces & Canvas
- **Canvas Base (`bg-canvas`)**: `#0B0F17` — Ground-level foundation.
- **Surface Level 1 (`surface-subtle`)**: `#111827` — Secondary panel backgrounds, navigational rail.
- **Surface Level 2 (`surface-raised`)**: `#161F30` — Primary cards, inspect drawers, popovers.
- **Surface Level 3 (`surface-active`)**: `#1E293B` — Active states, selected rows, hovering cards.
- **Border Subtle (`border-subtle`)**: `#1F293D` — Structural boundaries, inner dividers.
- **Border Default (`border-default`)**: `#2D3748` — Outer container frames, input perimeters.
- **Border Focus (`border-focus`)**: `#4F46E5` — Interactive focus rings, selected perimeter triggers.

### Functional & Intelligence Accents
- **AI / Engine Intelligence (`accent-intelligence`)**: Primary `#6366F1`, Light `#818CF8`, Background Glow `rgba(99, 102, 241, 0.08)`. Denotes ML retry recommendations, dynamic routing suggestions, and synthetic agent execution.
- **Deterministic Policy / Rules (`accent-policy`)**: Primary `#38BDF8`, Hover `#0284C7`, Background `rgba(56, 189, 248, 0.08)`. Denotes hard compliance gates, RBI/NPCI regulatory mandates, card network boundaries, and static routing overrides.

### Financial Telemetry & States
- **Recovered / Settled / Success**: Base `#10B981`, Deep `#059669`, Tint `rgba(16, 185, 129, 0.12)`.
- **At-Risk / Backoff / Pending**: Base `#F59E0B`, Deep `#D97706`, Tint `rgba(245, 158, 11, 0.12)`.
- **Permanent Drop / Dead-Letter / Alert**: Base `#EF4444`, Deep `#DC2626`, Tint `rgba(239, 68, 68, 0.12)`.

### Typography & Content Contrast
- **Text Highest Contrast (`text-primary`)**: `#F3F4F6` — Metrics, headers, table data values.
- **Text Supporting (`text-muted`)**: `#9CA3AF` — Column headers, descriptions, secondary states.
- **Text Low Contrast (`text-subtle`)**: `#6B7280` — Micro-labels, disabled cues, hash salt prefixes.

## Typography

The type system separates natural human reading from deterministic computational data:
- **Headlines & Canvas Structure**: `Geist` delivers neutral, contemporary geometric architecture with calibrated legibility.
- **Narrative & Observability Context**: `Inter` handles operational descriptions, logs, alerts, and tooltips with optimal glyph differentiation.
- **Deterministic Data & Currency**: `JetBrains Mono` handles all Indian Rupee amounts (`₹`), transaction UUIDs, latencies (`ms`), model probability confidence weights (`0.00-1.00`), retry sequence counters, and timestamps (`UTC+05:30`).

### Rupee Formatting & Number Representation
- Currency amounts must always pair `JetBrains Mono` with the Indian numbering system standard (Lakhs and Crores for condensed summaries, e.g., `₹1,42,850.00` or `₹2.48 Cr`).
- Tabular numeric alignment must use tabular figures (`font-variant-numeric: tabular-nums`) to prevent horizontal jitter during real-time streaming updates.

## Layout & Spacing

The layout is engineered for high-density, mission-critical workspace fidelity between 1024px and 1440px+ resolutions.

### Structural Framework
- **Primary Grid**: 12-column variable fluid grid.
- **Operational Rail**: Persistent 64px collapsed icon rail, expandable to 240px for deep domain switching (Dead-Letter Queues, Routing Rules, Re-try Policies, Smart Webhooks).
- **Inspector Stage**: Fluid right-side drawer (420px fixed on desktop) for root-cause analysis, stack traces, and ML decision lineage.
- **Viewport Constraints**:
  - `Desktop Standard (1440px+)`: Complete 3-pane view (Navigation, Master Ledger/Dashboard, Real-time Decision Inspector).
  - `Desktop Compact / Laptop (1024px - 1439px)`: 2-pane view with contextually collapsible decision drawer and condensed table cells.

### Spacing Discipline
Spacing adheres to a strict 4px/8px modular rhythm. Horizontal paddings within tables and metric blocks are condensed (`table-cell-padding-x: 0.875rem`) to maximize visible columns without forcing horizontal scrollbars for critical financial properties.

## Elevation & Depth

Visual hierarchy is created using strictly controlled surface luminosity, thin borders, and dark ambient light absorption. Avoid diffuse, wide-spread drop shadows that simulate domestic consumer apps.

### Depth Stratification
1. **Layer 0 (Canvas Base - `#0B0F17`)**: Base grid on which all nodes sit.
2. **Layer 1 (Card & Module Shells - `#111827`)**: Borders: `1px solid #1F293D`. No elevation shadow. Depth is produced purely by contrast with `#0B0F17`.
3. **Layer 2 (Interactive Floating Modules & Modals - `#161F30`)**: Border: `1px solid #2D3748`. Subtle ambient occlusions: `0 4px 20px -2px rgba(0, 0, 0, 0.65)`.
4. **Layer 3 (HUD Tooltips, Context Menus & Micro-flyouts - `#1E293B`)**: Border: `1px solid rgba(255, 255, 255, 0.1)`. Shadow: `0 8px 32px 0 rgba(0, 0, 0, 0.8)`.

### Intelligence & Status Luminescence
When recovery intelligence engines operate, components adopt localized inner glow rather than external shadows:
- **ML Recommender Inset Glow**: `box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.4), 0 0 16px -4px rgba(99, 102, 241, 0.25)`.
- **Critical Failure Inset**: `box-shadow: inset 0 0 0 1px rgba(239, 68, 68, 0.3)`.

## Shapes

The design system employs a **Soft Infrastructure (Level 1)** geometry. 

- **Base Radius (`0.25rem` / 4px)**: Default for inputs, table row selection highlights, action buttons, confidence bars, and micro code tokens.
- **Card & Panel Radius (`0.375rem` / 6px)**: Standard for containers, analytics widgets, data ledger frames, and architectural flow boxes.
- **Pill Badges (`9999px`)**: Reserved exclusively for lifecycle status indicators (e.g., `RECOVERED`, `ROUTING`, `PERM_FAIL`), accompanied by an inner dot indicator.

## Components

### Buttons & Intent Triggers
- **Primary / Action (AI Recommended)**: Background `#6366F1`, text `#FFFFFF`, hover `#4F46E5`. Subtle active scale (`transform: scale(0.99)`).
- **Secondary / Operational**: Background `#161F30`, border `1px solid #2D3748`, text `#F3F4F6`, hover background `#1E293B`.
- **Destructive / Abort**: Background `rgba(239, 68, 68, 0.1)`, border `1px solid rgba(239, 68, 68, 0.3)`, text `#EF4444`, hover background `rgba(239, 68, 68, 0.2)`.
- **Dimensions**: Compact default height of `32px` (inputs/buttons), reducing to `24px` for table row inline triggers.

### Status Pills & Pulse Indicators
- Badges feature a 6px static dot paired with a subtle CSS ping/pulse ring on active states (e.g., `In-Flight Recovery`, `Re-dispatching`).
- **Success (`Recovered`)**: Background `rgba(16, 185, 129, 0.1)`, border `1px solid rgba(16, 185, 129, 0.2)`, text `#10B981`.
- **Pending (`Backoff`)**: Background `rgba(245, 158, 11, 0.1)`, border `1px solid rgba(245, 158, 11, 0.2)`, text `#F59E0B`.
- **Deterministic Override**: Background `rgba(56, 189, 248, 0.1)`, border `1px solid rgba(56, 189, 248, 0.25)`, text `#38BDF8`.

### Tabular Ledger & Observability Grids
- **Header**: Height `32px`, font `label-caps`, uppercase, tracked out (`0.08em`), color `#9CA3AF`, background `#0E141E`, bottom border `1px solid #1F293D`.
- **Data Rows**: Height `40px`, alternating subtle hover states (`#141D2B`). Zero zebra stripes; use 1px horizontal baseline dividers (`#1F293D`).
- **Numeric Alignment**: All monetary metrics (`₹`), percentages, and timestamps must right-align; text descriptions left-align; status badges center-align.

### Probability & Confidence Meters
- Horizontal micro-bars (height `4px`, background `#1E293B`, rounded `2px`).
- Filled with gradient `#6366F1` to `#818CF8` for ML confidence, transitioning to `#10B981` if projected success exceeds `85%`.
- Numeric metric (`JetBrains Mono`, `11px`) sits adjacent (e.g., `94.2%`).

### Inputs & Terminal Filters
- Background `#0E141E`, border `1px solid #2D3748`, focus ring `1px solid #6366F1`.
- Placeholder text `#6B7280`. Monospaced search parameters (e.g., `filter: gateway="HDFC" status="failed"`).

### Architectural Flow Nodes & Execution Timelines
- Step connector nodes rendered with 1px stroke lines (`#2D3748`), lighting up in `#6366F1` or `#10B981` upon successful transaction packet traversal.
- Timestamps displayed on the left column in `JetBrains Mono` (`11px`), tracking sub-second latencies (e.g., `+184ms`).