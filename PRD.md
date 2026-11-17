# Product Requirements Document (PRD)

| Metadata | Details |
| :--- | :--- |
| **Product Name** | Personal Professional Portfolio |
| **Document Type** | Product Requirements Document (PRD) |
| **Document Version** | 1.3.0 (Stakeholder Decisions Integrated) |
| **Current Status** | **Approved & Locked for Implementation** |
| **Primary Focus** | User Workflows, Deterministic Business Rules, Conversion Architecture (No Code) |
| **Target Role** | Full Stack Developer |
| **Target Audience** | Stakeholders, UI/UX Designers, Developers, QA / UAT Testers |

---

## 1. Executive Summary & Business Objectives

### 1.1 Business Problem
Technical recruiters, engineering hiring managers, and prospective collaborators spend an average of 30–60 seconds evaluating a candidate's portfolio. Traditional portfolios frequently fail due to:
1. Cluttered navigation delaying access to verifiable credentials and resume.
2. Inconsistent proof of work (broken demo links or inaccessible repositories).
3. Friction-heavy contact forms that deter outreach or expose candidates to spam.
4. Over-engineered structures that make continuous content additions burdensome.

### 1.2 Product Vision
A clean, focused, single-page professional portfolio representing a **Full Stack Developer**. The product prioritizes instant talent evaluation, immediate proof of work via GitHub repositories and optional live demos, friction-free resume acquisition, and direct, spam-safe communication channels.

### 1.3 Key Conversion Goals & Success Metrics
* **Primary Conversion Metric (Goal 1):** Resume Acquisition Rate (Target: > 25% of recruiter visits).
* **Secondary Conversion Metric (Goal 2):** Direct Contact Rate (Clicks on Copy Email, Mailto, or LinkedIn).
* **Proof-of-Work Engagement Metric (Goal 3):** Outbound click-through to verified GitHub repositories and active demo environments.

---

## 2. Target Personas & Evaluation Criteria

| Persona | Primary Goal | Critical Decision Trigger | Evaluation Duration | Primary Drop-off Risk |
| :--- | :--- | :--- | :--- | :--- |
| **Persona A: Technical Recruiter** | Qualify candidate against active Full Stack job requisitions. | Prominent Full Stack Developer headline + immediate Resume download access. | 30–45 seconds | Resume hard to find; unclear technical breadth. |
| **Persona B: Engineering Lead / Manager** | Assess architecture quality, code readability, and full stack implementation skills. | Working GitHub repositories + live demos + clean tech stack tags. | 2–5 minutes | Dead links; generic descriptions without measurable impact. |
| **Persona C: Industry Peer / Collaborator** | Connect for contracting, open-source collaboration, or networking. | Direct LinkedIn and direct Email access without multi-step forms. | 1 minute | Mandatory contact form fields or captcha barriers. |

---

## 3. Scope Boundaries & Policy Decisions

### 3.1 In-Scope (MVP / Phase 1)
* Sticky header navigation with anchor links (`#about`, `#skills`, `#experience`, `#projects`, `#contact`), mobile navigation drawer, and persistent Resume CTA.
* Hero Section featuring professional headline (**Full Stack Developer**), bio elevator pitch, profile photo, and primary action buttons.
* Structured Skills Taxonomy tailored to **Full Stack Development** (Frontend, Backend, Databases & Cloud, Tooling).
* Reverse-chronological Career Experience timeline with ongoing role designations.
* **Dynamically Scalable Projects Showcase:** Open-ended capacity supporting any number of projects ($N \ge 1$) as the owner adds them over time.
* Secure Contact Section (one-click copy email, mailto link, LinkedIn, GitHub).
* Direct PDF Resume viewing and download access.
* Graceful fallback states for omitted live demos, missing preview media, and browser clipboard restrictions.

### 3.2 Out-of-Scope (Explicitly Excluded per Stakeholder Decision)
* **Availability Status Badge / "Open to Work" Indicator:** Explicitly removed per stakeholder requirement to keep the profile timeless, clean, and unburdened by availability status management.
* Public display of raw telephone numbers (anti-scraping / anti-spam policy).
* Server-side contact form submissions requiring database infrastructure.
* Multi-page routing or Content Management System (CMS) backends.

---

## 4. Information Architecture & Page Flow

```
[ Sticky Navigation Header ] (Logo/Name + Anchor Links + Resume Button)
       │
[ 1.0 Hero Section ] (Photo + Name + "Full Stack Developer" + Bio + Resume CTA + Social Links)
       │
[ 2.0 Skills Section ] (Structured Full Stack Taxonomy: Frontend, Backend, Database/Cloud, Tools)
       │
[ 3.0 Work Experience ] (Reverse-chronological career timeline)
       │
[ 4.0 Projects Showcase ] (Dynamic collection of N project cards: Image, Tags, GitHub, Optional Demo)
       │
[ 5.0 Contact & Footer ] (Email Copy Utility, Mailto, LinkedIn, GitHub, Copyright / Freshness)
```

---

## 5. End-to-End User Workflows (UWF)

### UWF-01: Recruiter Fast-Scan & Resume Acquisition Flow
* **Actor:** Technical Recruiter / Talent Acquisition Specialist
* **Pre-condition:** Visitor arrives via shared link, job application submission, or LinkedIn URL.
* **Trigger:** Recruiter opens the portfolio homepage.
* **Flow of Events:**
  1. Recruiter lands on Hero section and immediately views Profile Photo, Name, and **"Full Stack Developer"** professional headline (`BR-01`).
  2. Recruiter scans concise elevator pitch bio.
  3. Recruiter clicks **"View / Download Resume"** button located in the sticky header or Hero section.
  4. System executes resume delivery rule (`BR-02`), opening the PDF in a new preview tab with native browser download/print controls.
  5. Recruiter reviews or saves the document to applicant tracking records.
* **Alternate / Exception Flows:**
  * *AF-1.1 (Resume Asset Missing or Unreachable):* System displays a non-blocking toast: *"Resume temporarily unavailable; please reach out directly via Email or LinkedIn."*
* **Post-condition:** Recruiter views or possesses candidate CV.

---

### UWF-02: Engineering Lead Proof-of-Work Verification Flow
* **Actor:** Engineering Lead / Hiring Manager
* **Pre-condition:** Recruiter has passed candidate portfolio to engineering reviewer.
* **Trigger:** Engineering Lead navigates to the Projects Showcase section.
* **Flow of Events:**
  1. Reviewer navigates to `#projects` via navigation link or natural scroll.
  2. Reviewer scans project cards rendered from the dynamic project catalog (`BR-04.1`).
  3. Reviewer inspects project metadata: title, summary of problem solved, and full stack tech tags (`BR-05`).
  4. Reviewer clicks **"Source Code"** (GitHub) action button.
  5. System opens project repository in a new browser tab with safe referrer headers (`BR-07`).
  6. Reviewer returns to portfolio and checks if a **"Live Demo"** is present.
  7. *If Live Demo exists:* Reviewer clicks "Live Demo"; system loads application in a separate tab.
  8. *If Live Demo does not exist:* System displays standard graceful fallback state (`BR-04.3`).
* **Post-condition:** Reviewer has verified technical depth and repository quality.

---

### UWF-03: Frictionless Candidate Contact Flow
* **Actor:** Any Interested Visitor (Recruiter, Lead, Peer)
* **Pre-condition:** Visitor has decided to contact candidate.
* **Trigger:** Visitor navigates to Contact section or clicks Contact CTA in Hero.
* **Flow of Events (Path A - Webmail User / Clipboard):**
  1. Visitor clicks **"Copy Email"** button.
  2. System writes verified email address to visitor's system clipboard (`BR-06.2`).
  3. System renders immediate visual confirmation badge (e.g., *"Copied to clipboard!"*).
  4. Visual confirmation automatically reverts to default state after 3 seconds (`BR-06.3`).
  5. Visitor pastes email into their webmail client (Gmail, Outlook 365, etc.).
* **Flow of Events (Path B - Native Mail Client User):**
  1. Visitor clicks hyperlinked email address.
  2. Operating system triggers default email handler with pre-populated subject line (`BR-06.1`).
* **Flow of Events (Path C - Social Professional Network):**
  1. Visitor clicks LinkedIn icon/link.
  2. Profile opens in new tab for direct InMail or Connection Request (`BR-07`).
* **Alternate / Exception Flows:**
  * *AF-3.1 (Clipboard Permission Denied / Non-Secure Context):* If browser security prohibits clipboard write, system displays plain text email with prompt: *"Press Ctrl+C to copy: email@domain.com"*.
* **Post-condition:** Direct communication channel successfully initiated without spam risk.

---

### UWF-04: Mobile Navigation & Responsive Exploration Flow
* **Actor:** Mobile Visitor (Recruiter reviewing on smartphone)
* **Pre-condition:** Screen viewport width is less than 768 pixels.
* **Trigger:** Visitor taps the navigation menu icon (hamburger toggle).
* **Flow of Events:**
  1. System reveals an accessible navigation overlay containing all section anchors and the Resume CTA (`BR-08.1`).
  2. Visitor taps a target section link (e.g., "Experience").
  3. System smoothly scrolls the viewport to `#experience` and automatically collapses the navigation overlay (`BR-08.2`).
  4. Page content remains fully interactive without leftover backdrop blocking.
* **Alternate / Exception Flows:**
  * *AF-4.1 (Dismissal without selection):* Visitor taps backdrop or close button; overlay dismisses without changing scroll position.
* **Post-condition:** User navigates sections smoothly on touch devices.

---

## 6. Formal Business Rules Catalog (BR)

### BR-01: Professional Identity & Hero Presentation
* **BR-01.1 (Headline Standardization):** The primary professional title must be set to **"Full Stack Developer"**, signaling broad capability across client-side, server-side, and infrastructure engineering.
* **BR-01.2 (Availability Badge Omission):** Per stakeholder directive, no availability or "Open to Work" status indicator is rendered. The profile remains clean, professional, and timeless.
* **BR-01.3 (Hero Content Density):** The Hero section must present Full Name, Profile Photo, Headline, Elevator Pitch Bio, Resume CTA, and direct outbound links (LinkedIn, GitHub, Email) without requiring initial scrolling on standard desktop viewports.

---

### BR-02: Resume Asset Governance & Delivery Rules
* **BR-02.1 (Delivery Mechanism):** The primary Resume action must open the PDF file in a new browser tab (`target="_blank"`), permitting immediate browser-rendered viewing with native print/download controls.
* **BR-02.2 (File Naming Standard):** Downloaded file must follow an ATS-standard naming schema:  
  `[FirstName]_[LastName]_Full_Stack_Developer_Resume.pdf` (e.g., `Alex_Morgan_Full_Stack_Developer_Resume.pdf`).
* **BR-02.3 (File Size Ceiling):** Resume PDF must not exceed 2.0 MB to prevent mobile network download latency.

---

### BR-03: Career Experience Chronology & Tenures
* **BR-03.1 (Ordering):** Work experience entries must strictly follow reverse-chronological order based on start date.
* **BR-03.2 (Current Role Designation):** Any role without an end date must display the end period as `"Present"` and indicate ongoing tenure.
* **BR-03.3 (Display Caps):** A maximum of 4–5 relevant career positions should be displayed initially to prevent recruiter cognitive fatigue.

---

### BR-04: Scalable Project Showcase & Ingestion Rules
* **BR-04.1 (Dynamic Scaling - N Projects):** The Projects section must support an arbitrary number of project cards ($N \ge 1$). Adding new projects must simply require adding an item to the data collection without modifying layout code or grid definitions.
* **BR-04.2 (Ordering / Ingestion):** Projects are rendered in order of definition (newest first). Any project flagged as `featured: true` will automatically appear at the top of the collection.
* **BR-04.3 (Optional Live Demo Rule):**
  * When a live demo URL is supplied: A prominent "Live Demo" button is displayed.
  * When no live demo URL is supplied (e.g., backend CLI, private staging, data pipeline): The "Live Demo" button must be hidden completely, avoiding inactive or disabled "Coming Soon" buttons that degrade user trust.
* **BR-04.4 (Image Degradation Fallback):** If a project cover image is omitted or fails to load, the card must render a styled placeholder incorporating the project initials and category icon, ensuring zero broken-image artifacts.
* **BR-04.5 (Repository Accessibility):** All repository links must point to public, non-authenticated repositories.

---

### BR-05: Skills Architecture (Full Stack Developer Baseline)
* **BR-05.1 (Categorical Taxonomy):** Skills must be structured into four distinct domains representing full stack competence:
  1. **Frontend:** Core UI technologies, frameworks, component libraries, state management.
  2. **Backend:** Server-side languages, runtime environments, REST/GraphQL APIs, microservices.
  3. **Databases & Cloud:** Relational/NoSQL databases, cloud providers, containerization, storage.
  4. **Tools & Practices:** Version control, CI/CD, testing, agile workflows.
* **BR-05.2 (Future Extensibility):** The taxonomy is modular so individual skills and categories can be updated, expanded, or re-ordered in future iterations without impacting visual layout.
* **BR-05.3 (Tag Limits per Project):** Each project card must display between 3 and 6 primary technologies to maintain scannability.

---

### BR-06: Communication Channels & Spam Mitigation Rules
* **BR-06.1 (Mailto Construction):** The primary email link must specify a predefined subject line to provide context:  
  `mailto:user@domain.com?subject=Inquiry%20via%20Portfolio`
* **BR-06.2 (Clipboard Behavior):** The "Copy Email" action must copy raw email text only (no formatting, no prefixes).
* **BR-06.3 (Feedback State Duration):** Visual confirmation ("Copied!") must display for exactly 3,000 milliseconds before transitioning back to the idle "Copy Email" state.
* **BR-06.4 (Anti-Harassment & Privacy Policy):** Personal mobile telephone numbers and direct physical residential addresses must never be published in plain text.

---

### BR-07: External Link Navigation & Session Preservation Rules
* **BR-07.1 (Context Retention):** All outbound links (GitHub, LinkedIn, Live Demos, Resume PDF) must open in a new browser browsing context (`target="_blank"` with `rel="noopener noreferrer"`).
* **BR-07.2 (Internal Anchor Navigation):** Navigation within the page (`#about`, `#skills`, `#experience`, `#projects`, `#contact`) must update the browser URL fragment smoothly without full page reloads.

---

### BR-08: Responsive Navigation & Touch Target Governance
* **BR-08.1 (Mobile Breakpoint Behavior):** On viewports narrower than 768px, horizontal navigation links must collapse into a mobile drawer overlay.
* **BR-08.2 (Auto-Dismissal):** Tapping any section link inside the mobile drawer must trigger smooth scrolling to that anchor and immediately dismiss the drawer.
* **BR-08.3 (Touch Target Minimums):** All interactive buttons, links, and icons must have a minimum clickable area of 44x44 pixels to ensure touch accessibility.

---

### BR-09: Accessibility & Inclusive Design Rules (WCAG 2.1 AA)
* **BR-09.1 (Visual Contrast):** Text elements must maintain a minimum contrast ratio of 4.5:1 against their backgrounds (3:1 for large display headlines).
* **BR-09.2 (Screen Reader Labeling):** Any icon-only button (e.g., GitHub icon, Copy icon) must provide descriptive accessible names (e.g., "Copy email address to clipboard", "Visit GitHub profile").
* **BR-09.3 (Keyboard Navigability):** All interactive elements must be focusable via the `Tab` key in logical sequential reading order.

---

### BR-10: Social Share & Metadata Integrity Governance
* **BR-10.1 (Social Card Previews):** When the portfolio URL is shared via messaging apps (Slack, LinkedIn, WhatsApp, X), the platform must receive structured OpenGraph metadata:
  * Title: `[Full Name] - Full Stack Developer`
  * Description: Concise elevator pitch summary.
  * Preview Image: High-resolution professional social banner image.
* **BR-10.2 (Content Freshness Indicator):** The footer must include current year copyright and active status indicator to demonstrate that the portfolio is currently maintained.

---

## 7. User Story Acceptance Criteria (Given / When / Then)

### AC-01: Resume Access
* **Given** a recruiter is browsing the portfolio on desktop or mobile,
* **When** they click or tap the "Resume" button,
* **Then** the PDF opens in a new tab without blocking popups, allowing direct reading and saving.

### AC-02: Copy Email Feedback
* **Given** a visitor wishes to contact the candidate via webmail,
* **When** they click "Copy Email",
* **Then** the email address is saved to their clipboard, the button text changes to "Copied!" for 3 seconds, and then automatically returns to the idle state.

### AC-03: Project Without Live Demo
* **Given** a project is purely a backend service, data pipeline, or CLI without a hosted frontend,
* **When** a reviewer views its project card,
* **Then** only the "Source Code" button is displayed; no inactive, greyed-out, or "Coming Soon" demo button appears.

### AC-04: Scalable Project Uploads
* **Given** the candidate has 1, 4, or 10 projects defined in data,
* **When** the page renders,
* **Then** all $N$ projects render cleanly in a responsive grid without layout deformation.

---

## 8. Stakeholder Decision Log & Resolution History

| # | Business Domain | Original Question | Stakeholder Decision | PRD Resolution & Status |
| :--- | :--- | :--- | :--- | :--- |
| **D1** | **Availability Status** | Should an "Open to Work" status indicator be displayed? | **Remove it completely.** Not considered important; keep profile timeless. | **RESOLVED:** Availability badge removed from Scope, Workflows, and Architecture (`BR-01.2`). |
| **D2** | **Project Volume & Scaling** | How many projects will be showcased at launch? | **Dynamic / Open-ended ("Upload as I do").** Do not lock to a fixed count. | **RESOLVED:** Section 6 `BR-04.1` updated to support dynamic scaling ($N \ge 1$) with automatic layout handling. |
| **D3** | **Skills Taxonomy & Role** | How should technical skills be structured? | **Baselined as "Full Stack Developer".** Update/specialize further in the future. | **RESOLVED:** `BR-01.1` and `BR-05.1` locked to Full Stack Developer baseline (Frontend, Backend, Database/Cloud, Tooling). |
| **D4** | **Resume Asset Delivery** | Where will the PDF resume file be stored? | Local asset bundled with portfolio for maximum speed and uptime. | **RESOLVED:** Managed under `BR-02` with standard naming convention. |
| **D5** | **Outreach Subject** | What email subject line format should be pre-filled? | Standard inquiry format: `Inquiry via Portfolio`. | **RESOLVED:** Managed under `BR-06.1`. |

---

## 9. Sign-Off & Handoff Confirmation

| Role | Status | Date |
| :--- | :--- | :--- |
| **Business Analyst / Product** | **Approved & Locked** | Current Baseline |
| **Stakeholder** | **Decisions D1–D5 Incorporated** | Approved |
| **Design & Development** | **Ready for Execution** | Handoff Ready |
