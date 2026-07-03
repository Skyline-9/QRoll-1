# Design Document: QRoll Company Details Page Redesign

## 1. Overview & Objectives

*   **Problem:** The current company details page (`/companies/xxx`) has significant wasted space, a clunky invite link interface, and lacks structure for scaling.
*   **Goal:** Reorganize the page layout to focus primarily on **Teams**, making the interface compact, modern, and visually aligned with "The Active Canvas" brand guidelines (12px rounded corners, Eggplant Ink, Pale Lilac borders, Soft Lavender highlights).
*   **Scope:**
    1.  Expand the local mock data in `src/lib/supabase.ts` to include 5 teams and 18 company members for realistic developer testing.
    2.  Redesign the company details page (`src/pages/companies/[slug]/index.astro`) to introduce a full-width structured layout.
    3.  Implement a client-side search/filter for Teams.
    4.  Refactor team invite links into a clean, compact copy-to-clipboard button.
    5.  Implement a collapsible "Company Roster" directory segment (collapsed by default) with client-side member search/filtering.

---

## 2. Layout & Styling Architecture

The redesign follows a vertical, full-width segmented approach.

```mermaid
graph TD
    A[Breadcrumbs: Back to Companies] --> B[Hero Header: Company Name + Badge]
    B --> C[Summary Badges: 5 Teams | 18 Members]
    C --> D[Section 1: Teams - Primary, Full-Width]
    D --> E[Search & Create Row]
    E --> F[Team Cards Grid]
    F --> G[Card: Team Title, Minimal Metrics, Copy Invite Button, Quick Links]
    C --> H[Section 2: Company Roster - Collapsible, Collapsed by Default]
    H --> I[Search Member Input]
    I --> J[Dense Member List / Table]
```

### Type and Spacing Tokens
We will adhere strictly to `src/styles/global.css`:
*   **Primary text color:** Eggplant Ink (`#2F2738` / `text-foreground`).
*   **Muted text color:** Muted Grape (`#6B6377` / `text-muted-foreground`).
*   **Border:** Pale Lilac (`#ECE6F2` / `border-border`).
*   **Rounding:** `12px` (`rounded-lg`).
*   **Hover effect:** `.hover-row-premium` or active card shadow transitions.

---

## 3. Detailed Specifications

### 3.1. Mock Data Seeding (Local Development)
We will expand the local dev state in `src/lib/supabase.ts` with:
*   **Mock Teams (5 total):**
    1.  `Season 1` (invite code: `abc-123`)
    2.  `Engineering Team` (invite code: `eng-456`)
    3.  `Design Team` (invite code: `des-789`)
    4.  `Marketing & PR` (invite code: `mkt-101`)
    5.  `Operations Team` (invite code: `ops-202`)
*   **Mock Profiles & Company Members (18 total):**
    *   1 Admin (Dev Admin)
    *   17 Attendees/Members with varying full names and email addresses.

### 3.2. Company Overview Header
*   A clean back link using the `ArrowLeft` Lucide icon.
*   The company name displayed in display typography (`text-3xl font-semibold tracking-tight`).
*   A simple summary banner containing two text badges:
    *   `[ 5 Teams ]` (Soft Lavender `#E4C1F9` text/border/bg tint)
    *   `[ 18 Members ]` (Pale Lilac `#F5EFFA` text/border/bg tint)

### 3.3. Teams Segment (Primary Area)
*   **Toolbar:**
    *   A search text input styled with `src/components/ui/input` (`Search teams...`).
    *   A "+ Create Team" button triggering the modal/card.
*   **Teams Grid:**
    *   An auto-fit grid with larger cards: `grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3` or `repeat(auto-fill, minmax(340px, 1fr))`.
    *   Each card features a soft shadow and scale transition on hover.
*   **Team Card Content:**
    *   Card padding increased to Spacing Large (`p-6`).
    *   **Team Name:** Larger bold text (`text-lg font-semibold`).
    *   **Creation Date:** Inline secondary text below the team name (e.g. `Created on Jul 2, 2026`).
    *   **Minimal Metrics:** A small badge showing `X members • Y events`.
    *   **Copy Invite Link Button:** A compact button with a copy/link icon. On click, it copies the URL `http://<host>/teams/join/<invite_code>` to the clipboard and briefly changes its label/color to a positive checkmark state (`Copied!`).
    *   **Quick Links:** Bottom-aligned footer buttons mapping to "Manage Events" and "Manage Roster".

### 3.4. Collapsible Company Roster Segment
*   **Collapsible Panel:** A `<details>` element or custom DOM structure styled as a wide panel.
*   **Default State:** Collapsed (`open` attribute omitted/false).
*   **Header:** An interactive button spanning full width, showing `Company Roster (18)` with a chevron icon rotating on toggle.
*   **Roster Grid/List:**
    *   A search box to filter company members by name or email.
    *   A list format showing the member avatar placeholder, full name, email, and their company role (`admin` or `member`).

---

## 4. Test & Verification Plan

1.  **Local Dev Server Launch:** Build the application and run locally using `npm run dev`.
2.  **Mock Verification:** Verify that 5 teams and 18 company members load successfully.
3.  **UI Interaction Audit:**
    *   Test copy-to-clipboard functionality on team invite links.
    *   Test search filter on Teams (verifying matching cards show and others hide).
    *   Expand the Roster panel, type in the member search, and verify filtering works.
    *   Test the collapsible state of the roster panel (ensure it stays collapsed by default).
4.  **Browser Verification:** Use `agent-browser` to take screenshots and programmatically interact with the page to verify correctness, contrast, and layout aesthetics.
