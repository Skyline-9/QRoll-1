# Team Cards Sizing & Creation Date Refinement Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the team cards larger on the company details page and display the team creation date below the team name.

**Architecture:**
- Adjust the grid container styling in `src/pages/companies/[slug]/index.astro` to use larger minmax widths for auto-fill columns.
- Adjust the card padding and font size for team cards.
- Format and render the team `created_at` timestamp.

**Tech Stack:** Astro, Tailwind CSS v4, Lucide React.

## Global Constraints
- Maximum border-radius remains `12px` (`rounded-lg`).
- Colors must comply with the design system (Eggplant Ink and Soft Lavender accents).

---

### Task 1: Update Grid and Cards Layout in Company Details

**Files:**
- Modify: `src/pages/companies/[slug]/index.astro`

- [ ] **Step 1: Increase Grid column sizes and Card Padding**
  In `src/pages/companies/[slug]/index.astro`, change the Teams grid classes on line 164 from:
  `grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
  to:
  `grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
  Change the card padding inside the `map` iterator from:
  `AstroCard className="p-5 ..."`
  to:
  `AstroCard className="p-6 ..."`
  And change the team name typography from `text-base` to `text-lg`.

- [ ] **Step 2: Format and display the Team creation date**
  Below the team name heading (lines 172-173), add the formatted creation date line:
  ```html
  <p class="text-xs text-muted-foreground mt-1">
    Created on {new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
  </p>
  ```

- [ ] **Step 3: Run Vitest tests**
  Run: `rtk npm run test`
  Expected: PASS

- [ ] **Step 4: Commit Layout & Date changes**
  Run:
  ```bash
  git add src/pages/companies/[slug]/index.astro
  git commit -m "feat(company): make team cards larger and render creation date"
  ```

---

### Task 2: UI/UX Browser Verification

- [ ] **Step 1: Launch dev server**
  Run: `rtk npm run dev` (in background)
  Expected: Dev server runs.

- [ ] **Step 2: Verify visually in browser**
  Use `agent-browser` to open the local development page `http://localhost:4321/companies/party-people`.
  Verify that the team cards are wider and larger, and the "Created on [Date]" text displays correctly.

- [ ] **Step 3: Stop dev server and finalize**
  Kill the background task. Run `rtk npx gitnexus detect-changes`.
