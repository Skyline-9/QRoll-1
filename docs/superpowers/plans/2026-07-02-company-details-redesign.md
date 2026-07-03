# Company Details Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the company details page (`/companies/xxx`) to focus primarily on Teams using a full-width structured layout, collapsible roster, search capability, and clipboard-copy invite links, populated with expanded mock data in local development.

**Architecture:** 
1. Expand the local mock data in `src/lib/supabase.ts` to simulate multiple teams and members.
2. Refactor the Astro page `src/pages/companies/[slug]/index.astro` to structure Teams as the primary full-width grid view with dynamic search and a compact clip-to-copy button.
3. Place Company Members in a collapsible `<details>` panel at the bottom of the page, equipped with dynamic client-side filtering.

**Tech Stack:** Astro, Tailwind CSS v4, Lucide React, client-side JavaScript.

## Global Constraints

- **Theme Compliance:** Use Eggplant Ink (`#2F2738` / `text-foreground`), Warm Milk (`#FFFDF9` / `bg-background`), Pale Lilac (`#ECE6F2` / `border-border`), and Soft Lavender (`#E4C1F9` / `bg-accent`).
- **Rounding constraint:** Max border-radius of `12px` (`rounded-lg`).
- **Banned patterns:** No side-stripe borders, no gradient text, no glassmorphism as default, no tiny uppercase tracked eyebrows.
- **Aesthetic standard:** Target a visually rich, clean, high-density dashboard suitable for an active organizer.

---

### Task 1: Expand Local Mock Data

**Files:**
- Modify: `src/lib/supabase.ts`

**Interfaces:**
- Consumes: Existing mock dataset formats
- Produces: Expanded `mockTeams`, `mockProfiles`, and `mockCompanyMembers` arrays

- [ ] **Step 1: Edit `src/lib/supabase.ts`**
  Modify lines 25-66 of `src/lib/supabase.ts` to expand mock companies, company members, teams, and profiles.
  Replace with:
  ```typescript
  const mockCompanies = [
    { id: 'company-id-1', name: 'Party People', slug: 'party-people', created_by: mockAdminId, created_at: new Date().toISOString() }
  ];
  
  const mockCompanyMembers = [
    { id: 'cm-id-1', company_id: 'company-id-1', user_id: mockAdminId, role: 'admin', created_at: new Date().toISOString() },
    ...Array.from({ length: 17 }, (_, i) => ({
      id: `cm-id-attendee-${i + 1}`,
      company_id: 'company-id-1',
      user_id: `user-id-attendee-${i + 1}`,
      role: i < 2 ? 'admin' : 'member',
      created_at: new Date().toISOString()
    }))
  ];
  
  const mockProfiles = [
    {
      id: mockAdminId,
      email: 'michellezhuang1014@gmail.com',
      full_name: 'Dev Admin (Bypass)',
      role: 'admin',
      created_at: new Date().toISOString()
    },
    ...Array.from({ length: 17 }, (_, i) => ({
      id: `user-id-attendee-${i + 1}`,
      email: `attendee${i + 1}@example.com`,
      full_name: [
        'John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Brown', 
        'Charlie Green', 'David White', 'Eva Black', 'Alexis Owens',
        'Angelina Demiroska', 'Anna Li', 'Ash Fetherbay', 'Ashna Reddy',
        'Ava Zhang', 'Bharath', 'Brendon Mak', 'Bryan Lu', 'Chelsea Chrystal'
      ][i] || `Attendee ${i + 1}`,
      role: 'attendee',
      created_at: new Date().toISOString()
    }))
  ];
  
  const mockTeams = [
    { id: 'team-id-1', company_id: 'company-id-1', name: 'Season 1', invite_code: 'abc-123', created_by: mockAdminId, created_at: new Date().toISOString() },
    { id: 'team-id-2', company_id: 'company-id-1', name: 'Engineering Team', invite_code: 'eng-456', created_by: mockAdminId, created_at: new Date().toISOString() },
    { id: 'team-id-3', company_id: 'company-id-1', name: 'Design Team', invite_code: 'des-789', created_by: mockAdminId, created_at: new Date().toISOString() },
    { id: 'team-id-4', company_id: 'company-id-1', name: 'Marketing & PR', invite_code: 'mkt-101', created_by: mockAdminId, created_at: new Date().toISOString() },
    { id: 'team-id-5', company_id: 'company-id-1', name: 'Operations Team', invite_code: 'ops-202', created_by: mockAdminId, created_at: new Date().toISOString() }
  ];
  ```

- [ ] **Step 2: Edit `mockTeamMembers` mapping**
  Update `mockTeamMembers` in `src/lib/supabase.ts` (lines 66+) to map team members correctly across teams (or just assign them to `team-id-1` to maintain existing event/attendance tests without breakage).
  Verify that existing tests run successfully.
  Run: `rtk npm run test`
  Expected: PASS

- [ ] **Step 3: Commit mock data changes**
  Run:
  ```bash
  git add src/lib/supabase.ts
  git commit -m "test: expand local mock data with 5 teams and 18 members"
  ```

---

### Task 2: Redesign Company Details Layout & Teams Grid

**Files:**
- Modify: `src/pages/companies/[slug]/index.astro`

**Interfaces:**
- Consumes: Expanded mock data queries from Supabase SSR client mock.
- Produces: Redesigned header, overview summary, teams toolbar, and searchable team grid.

- [ ] **Step 1: Update the layout shell and add summary badges**
  Modify `src/pages/companies/[slug]/index.astro` to add top breadcrumbs and horizontal summary badges showing the totals: `X Teams` and `Y Members`.
  Include inline copy-to-clipboard JavaScript functionality for the invite link.
  
- [ ] **Step 2: Implement search input and Teams filter**
  Create a search input for Teams. Add client-side javascript to filter the team cards:
  ```html
  <script>
    document.getElementById('team-search')?.addEventListener('input', (e) => {
      const q = (e.target as HTMLInputElement).value.toLowerCase();
      document.querySelectorAll('.team-card').forEach((card) => {
        const name = card.getAttribute('data-team-name')?.toLowerCase() || '';
        if (name.includes(q)) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    });
  </script>
  ```

- [ ] **Step 3: Implement copy-to-clipboard invite links**
  Add a copy icon/button inside each team card. When clicked, it copies the invite URL using `navigator.clipboard.writeText` and updates the text/icon to a checkmark for 2 seconds.

- [ ] **Step 4: Commit Layout & Teams changes**
  Run:
  ```bash
  git add src/pages/companies/[slug]/index.astro
  git commit -m "feat: redesign company details layout and implement searchable teams grid"
  ```

---

### Task 3: Collapsible Company Roster Directory

**Files:**
- Modify: `src/pages/companies/[slug]/index.astro`

**Interfaces:**
- Consumes: `members` list from Supabase query.
- Produces: Collapsible bottom panel containing the full searchable member list.

- [ ] **Step 1: Implement collapsible panel block**
  At the bottom of the page, add a `<details class="group bg-card border border-border rounded-xl">` block for the Company Roster.
  Add a custom header `<summary class="flex justify-between items-center p-4 cursor-pointer">` with a chevron icon that rotates using CSS.
  
- [ ] **Step 2: Add member search input and filter script**
  Inside the details panel, add a search input `Search members...` and client-side JavaScript to filter the members table/list:
  ```html
  <script>
    document.getElementById('member-search')?.addEventListener('input', (e) => {
      const q = (e.target as HTMLInputElement).value.toLowerCase();
      document.querySelectorAll('.member-row').forEach((row) => {
        const text = row.textContent?.toLowerCase() || '';
        if (text.includes(q)) {
          row.classList.remove('hidden');
        } else {
          row.classList.add('hidden');
        }
      });
    });
  </script>
  ```

- [ ] **Step 3: Commit Collapsible Roster changes**
  Run:
  ```bash
  git add src/pages/companies/[slug]/index.astro
  git commit -m "feat: implement collapsible company roster directory with search"
  ```

---

### Task 4: UI/UX Verification and Browser Audits

**Files:**
- Verify: Local dev server at `http://localhost:4321/companies/party-people`

- [ ] **Step 1: Start local development server**
  Run: `rtk npm run dev` (with manage_task / background task)
  Expected: Dev server runs successfully.

- [ ] **Step 2: Use agent-browser to audit the page**
  Use `agent-browser` to open the local development URL, take screenshots, check visual alignment, click the copy buttons, filter teams, expand the collapsible roster, and verify everything is working and visually stunning.

- [ ] **Step 3: Stop dev server and finalize**
  Shut down the dev server. Run impact analysis check on git changes:
  Run: `rtk npx gitnexus detect-changes`
  Verify that only the expected files are modified.
