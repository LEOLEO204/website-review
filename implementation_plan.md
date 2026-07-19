# Implementation Plan: ReviewSmart Platform (Home Toolkit Review)

This document outlines the design structure, technical architecture, and content layout to replicate the look, feel, and user experience of The ReviewSmart Company' **ReviewSmart** for the "Best Basic Home Toolkit" review.

---

## 1. Design Tokens & Styling (Tailwind Configuration)

To replicate the editorial aesthetic of ReviewSmart, we utilize a clean, highly legible layout with focused accents:

| Token | CSS / Tailwind Class | Value / Hex Code | Usage |
|---|---|---|---|
| **Primary Brand** | `bg-reviewsmart-brand` | `#da3723` | Main call-to-actions, Pick badges, brand icons, borders |
| **Secondary Accent** | `text-reviewsmart-accentGreen` | `#267746` | Secondary tags, highlights, trust links |
| **Background Light** | `bg-reviewsmart-bgLight` | `#f7f7f7` | Sticky headers, sidebar background, block highlights |
| **Background White**| `bg-reviewsmart-bgWhite` | `#ffffff` | Main reading area, review card interiors |
| **Main Text** | `text-reviewsmart-text` | `#1a1a1a` | All primary text, body reading, titles |
| **Muted Text** | `text-reviewsmart-muted` | `#5a5a5a` | Authorship details, dates, captions |
| **Serif Font** | `font-serif` | Georgia, Cambria, serif | Article title, section headers, card titles |
| **Sans-Serif Font** | `font-sans` | Inter, system-ui, sans-serif | Navigation, details, buttons, body copy |

---

## 2. Layout & Structure

The page will follow a three-column response grid:
1. **Sticky Header** (Global): Top navigation menu containing the ReviewSmart logo, category links, search input, and newsletter CTA.
2. **Main Grid Layout** (Desktop: Left sidebar for Table of Contents, center-right for content):
   - **Left Column (width: 1/4, sticky)**: Table of Contents with active-state scroll spy highlighting.
   - **Main/Right Column (width: 3/4)**: Hero title, metadata, intro text, product summary table, detailed section blocks, product review cards, and trust widgets.
3. **Footer**: Clean ReviewSmart Company/ReviewSmart-style detailed site map and terms links.

---

## 3. Key Components to Build

### A. Sticky Header
- **Top Row**: ReviewSmart brand signature with "A ReviewSmart Company Company" tagline. Search bar and user utilities.
- **Bottom Row**: Category tabs (Home & Garden, Kitchen, Tech, etc.) with dropdown menus and hover indicators.
- **Scroll Behavior**: Pins to the top of the viewport with a subtle shadow transition when scrolling down.

### B. Hero Section
- Breadcrumb navigation: `Home / Garage / Home Toolkits`
- Bold editorial title: `The Best Basic Home Toolkit`
- Author metadata widget: Author avatar, link to bio, date of publication, update label.
- Highlight Banner: "We spent 75 hours testing..." to establish authority.

### C. Sticky Sidebar (Table of Contents)
- A list of sections: *Why you should trust us, Who this is for, How we picked, How we tested, Our pick, Runner-up, Better tools, Sources.*
- Implements **Scroll Spy**: Auto-highlights the section the user is currently reading.
- Clickable smooth scrolling to jump directly to sections.

### D. Product Review Cards
- Custom cards designed with:
  - **Banner badge**: Bright red-orange or dark green depending on selection type ("OUR PICK" / "RUNNER-UP").
  - **Grid split**: High-quality generated image on the left; Title, micro-description, buy button, and quick list of pros/cons on the right.
  - **Pros & Cons panel**: Color-coded bullet points (green checks for Pros, red/gray dashes for Cons).
  - **Editorial text block**: 2-3 paragraphs explaining why the product is selected, including specific feature callouts (e.g. adjustable wrench, fiberglass hammer handle).
  - **Action block**: Prominent "Buy from Amazon" or "Buy from The Home Depot" button showing current price, merchant name, and shipping availability.

### E. Interactive Features
- **Search & Filter**: Let users search for specific tools inside the toolkit (e.g. "level", "pliers") and filter cards.
- **Comparison Tool**: A collapsible comparison matrix showing side-by-side details (Price, Case Type, Number of Pieces, Pliers Included, SAE/Metric sizes).
- **Affiliate Disclosure Toggle**: Informational popover detailing how ReviewSmart makes money through reader support.

---

## 4. Work Schedule & Deliverables

1. **Setup & Configuration**: Write Tailwind styles, HTML template, and load modern fonts (Google Fonts Inter/Georgia).
2. **Mock Data Generation**: Create structured JSON data containing detailed items for 4 different home toolsets (Anvil, WorkPro, Tinkr, Harbor Freight).
3. **Image Assets**: Generate customized product graphics for Anvil homeowner set and WorkPro toolkit using the image generator.
4. **Implementation of Core UI**: Start with the `App.jsx` layouts, implementing the sticky header, TOC, hero, review cards, and comparison matrix.
5. **Interactive Logic**: Add search queries, comparison toggles, scroll-spy hooks, and theme animations.
6. **Testing & Validation**: Run local verification checks on responsiveness, link clicks, search functionality, and package builds. Create `README.md`.
