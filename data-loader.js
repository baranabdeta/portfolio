/**
 * data-loader.js
 * Fetches typed JSON data stores and hydrates the portfolio DOM.
 * Zero external dependencies — runs on the static file server.
 * Implements WCAG 2.1 AA accessibility attributes and defensive sanitization.
 */

'use strict';

// ─── Helpers & Sanitization ───────────────────────────────────────────────────

/**
 * Escapes HTML entities to defend against Cross-Site Scripting (XSS).
 * Encodes &, <, >, ", and ' characters.
 * @param {string|number} str
 * @returns {string}
 */
function esc(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Validates and sanitizes URLs against unauthorized protocols (e.g. javascript:).
 * Whitelists only http, https, mailto, and relative paths.
 * @param {string} url
 * @returns {string}
 */
function sanitizeUrl(url) {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (/^(https?:|mailto:|\/)/i.test(trimmed)) {
    return esc(trimmed);
  }
  console.warn(`[data-loader] Rejected non-whitelisted URL protocol: ${trimmed}`);
  return '#';
}

function fetchJSON(url) {
  return fetch(url).then(r => {
    if (!r.ok) throw new Error(`Failed to load ${url}: ${r.status}`);
    return r.json();
  });
}

// ─── Project Card Mock Graphics ───────────────────────────────────────────────

const MOCK_GRAPHICS = {
  'mock-analytics': `
    <div class="browser-dots" aria-hidden="true"><span></span><span></span><span></span></div>
    <div class="mock-chart-graphic" aria-hidden="true">
      <div class="mock-bar b1"></div><div class="mock-bar b2"></div>
      <div class="mock-bar b3"></div><div class="mock-bar b4"></div>
      <div class="mock-bar b5"></div>
    </div>`,
  'mock-devflow': `
    <div class="browser-dots" aria-hidden="true"><span></span><span></span><span></span></div>
    <div class="mock-pipeline-graphic" aria-hidden="true">
      <span class="node active">Build</span>
      <span class="node-arrow">&rarr;</span>
      <span class="node active">Test</span>
      <span class="node-arrow">&rarr;</span>
      <span class="node">Deploy</span>
    </div>`,
  'mock-nexus': `
    <div class="browser-dots" aria-hidden="true"><span></span><span></span><span></span></div>
    <div class="mock-ecommerce-graphic" aria-hidden="true">
      <div class="mock-card-mini"></div><div class="mock-card-mini"></div>
    </div>`,
  'mock-sentinels': `
    <div class="browser-dots" aria-hidden="true"><span></span><span></span><span></span></div>
    <div class="mock-ai-graphic" aria-hidden="true">
      <span class="ai-sparkle">&#10022;</span>
      <span class="ai-code-line">embeddings.search()</span>
    </div>`,
};

function getDefaultGraphic(title) {
  const initials = title.split(' ').slice(0, 2).map(w => w[0]).join('');
  return `<div class="browser-dots" aria-hidden="true"><span></span><span></span><span></span></div>
    <div class="mock-default-graphic" aria-hidden="true"><span class="default-initials">${esc(initials)}</span></div>`;
}

// ─── Renderers ────────────────────────────────────────────────────────────────

function renderProjects(projects) {
  const track = document.querySelector('.projects-scroll-track');
  if (!track) return;

  // Sort: featured first, then by sortOrder
  const sorted = [...projects].sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return (a.sortOrder || 0) - (b.sortOrder || 0);
  });

  track.innerHTML = sorted.map(p => {
    const graphic = MOCK_GRAPHICS[p.mockType] || getDefaultGraphic(p.title);
    const tags = (p.tags || []).slice(0, 6).map(t =>
      `<span class="stack-tag">${esc(t)}</span>`
    ).join('');
    const demoBtn = p.demoUrl
      ? `<a href="${sanitizeUrl(p.demoUrl)}" target="_blank" rel="noopener noreferrer" class="btn-see-more btn-demo" aria-label="Open live demo for ${esc(p.title)} (opens in new tab)">
           <span>Live Demo</span>
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
             <line x1="5" y1="12" x2="19" y2="12"></line>
             <polyline points="12 5 19 12 12 19"></polyline>
           </svg>
           <span class="sr-only">(opens in new tab)</span>
         </a>`
      : ''; // BR-04.3: strictly omit demo button if no URL

    return `<article class="project-card" aria-label="${esc(p.title)} project card">
      <div class="project-img-box ${esc(p.mockType || '')}">${graphic}</div>
      <div class="project-info">
        <h3 class="project-name">${esc(p.title)}</h3>
        <p class="project-desc">${esc(p.description)}</p>
        <div class="project-stacks" aria-label="Technologies used">${tags}</div>
        <div class="project-actions">
          <a href="${sanitizeUrl(p.repoUrl)}" target="_blank" rel="noopener noreferrer" class="btn-see-more" aria-label="View ${esc(p.title)} source repository on GitHub (opens in new tab)">
            <span>See More</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
            <span class="sr-only">(opens in new tab)</span>
          </a>
          ${demoBtn}
        </div>
      </div>
    </article>`;
  }).join('');
}

function renderProfile(profile) {
  // Update page title
  if (profile.meta?.ogTitle) {
    document.title = profile.meta.ogTitle;
  }

  // Name
  const nameEl = document.querySelector('.highlight-name');
  if (nameEl && profile.fullName) nameEl.textContent = profile.fullName;

  // Role titles
  const roleTitleMain = document.querySelector('.role-title-main');
  if (roleTitleMain && profile.professionalHeadline) {
    roleTitleMain.textContent = profile.professionalHeadline;
  }
  const roleTitleSub = document.querySelector('.role-title-sub');
  if (roleTitleSub && profile.secondaryHeadline) {
    roleTitleSub.textContent = profile.secondaryHeadline;
  }

  // Bio
  const bioEl = document.querySelector('.hero-bio-centered');
  if (bioEl && profile.elevatorPitch) bioEl.textContent = profile.elevatorPitch;

  // Badges
  const badgesEl = document.querySelector('.hero-badges-centered');
  if (badgesEl && profile.badges?.length) {
    badgesEl.innerHTML = profile.badges.map(b =>
      `<span class="intro-badge">${esc(b)}</span>`
    ).join('');
  }

  // CV download link
  const cvBtn = document.querySelector('.cv-btn');
  if (cvBtn && profile.resume?.publicUrl) {
    cvBtn.href = profile.resume.publicUrl;
    cvBtn.setAttribute('download', profile.resume.downloadFilename || 'Resume.pdf');
  }

  // Contact pills — email
  const emailPill = document.querySelector('.highlight-pill');
  if (emailPill && profile.social?.emailAddress) {
    const email = profile.social.emailAddress;
    emailPill.href = `mailto:${email}?subject=Inquiry%20via%20Portfolio`;
    const sub = emailPill.querySelector('.pill-sub');
    if (sub) sub.textContent = email;
  }

  // LinkedIn pill
  const linkedinPill = document.querySelector('.contact-pill-item[href*="linkedin"]');
  if (linkedinPill && profile.social?.linkedinUrl) {
    linkedinPill.href = profile.social.linkedinUrl;
  }

  // GitHub pill
  const githubPill = document.querySelector('.contact-pill-item[href*="github.com"]');
  if (githubPill && profile.social?.githubUrl) {
    githubPill.href = profile.social.githubUrl;
  }

  // Footer copyright
  const footer = document.querySelector('.minimal-footer span');
  if (footer && profile.fullName) {
    const year = profile.meta?.copyrightYear || new Date().getFullYear();
    footer.innerHTML = `&copy; ${year} ${esc(profile.fullName)} &bull; ${esc(profile.professionalHeadline)} &amp; ${esc(profile.secondaryHeadline)}`;
  }
}

function renderExperience(experiences) {
  // If there's an experience section in the DOM, populate it
  const section = document.getElementById('experience');
  if (!section) return; // section not in HTML yet — skip gracefully

  const sorted = [...experiences].sort((a, b) => {
    // Reverse-chronological: current roles first, then by startDate desc
    if (a.isCurrent && !b.isCurrent) return -1;
    if (!a.isCurrent && b.isCurrent) return 1;
    return b.startDate.localeCompare(a.startDate);
  });

  const timeline = section.querySelector('.experience-timeline') || section;
  timeline.innerHTML = `<h2 class="section-title">Work Experience</h2>` +
    sorted.map(e => {
      const end = e.isCurrent ? 'Present' : (e.endDate || '');
      const responsibilities = (e.responsibilities || []).map(r =>
        `<li>${esc(r)}</li>`
      ).join('');
      const techs = (e.technologies || []).map(t =>
        `<span class="stack-tag">${esc(t)}</span>`
      ).join('');

      return `<div class="exp-item">
        <div class="exp-header">
          <div>
            <h3 class="exp-role">${esc(e.role)}</h3>
            <span class="exp-company">${esc(e.company)}</span>
            <span class="exp-location">&bull; ${esc(e.location)}</span>
          </div>
          <span class="exp-dates">${esc(e.startDate.replace('-', '/'))} — ${esc(end)}</span>
        </div>
        <ul class="exp-responsibilities">${responsibilities}</ul>
        <div class="exp-techs">${techs}</div>
      </div>`;
    }).join('');
}

function renderSkills(skillCategories) {
  // If there's a skills section in the DOM, populate it
  const section = document.getElementById('skills');
  if (!section) return; // section not in HTML yet — skip gracefully

  const sorted = [...skillCategories].sort((a, b) => a.order - b.order);
  section.innerHTML = `<h2 class="section-title">Skills</h2>` +
    `<div class="skills-grid">` +
    sorted.map(cat => {
      const items = (cat.skills || []).map(s =>
        `<div class="skill-item skill-level-${esc(s.level)}">
          <span class="skill-name">${esc(s.name)}</span>
        </div>`
      ).join('');
      return `<div class="skill-category">
        <h3 class="skill-cat-title">${esc(cat.categoryName)}</h3>
        <div class="skill-items">${items}</div>
      </div>`;
    }).join('') +
    `</div>`;
}

// ─── Interaction Handlers (PRD BR-06.2, BR-06.3) ─────────────────────────────

function setupNavScroll() {
  const nav = document.getElementById('topNav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 15) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }, { passive: true });
}

function setupClipboardCopy(profile) {
  const emailPill = document.querySelector('.highlight-pill');
  if (!emailPill || !profile?.social?.emailAddress) return;

  const email = profile.social.emailAddress;
  emailPill.addEventListener('click', (e) => {
    // Copy raw email to clipboard (BR-06.2)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email).then(() => {
        const sub = emailPill.querySelector('.pill-sub');
        if (sub) {
          const original = sub.textContent;
          sub.textContent = 'Copied to clipboard!';
          setTimeout(() => {
            sub.textContent = original;
          }, 3000); // Exactly 3000ms visual confirmation (BR-06.3)
        }
      }).catch(() => {
        // Fallback gracefully to default mailto
      });
    }
  });
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

async function hydrate() {
  // Initialize passive scroll observer immediately
  setupNavScroll();

  try {
    const [profile, projects, skills, experience] = await Promise.all([
      fetchJSON('data/profile.json'),
      fetchJSON('data/projects.json'),
      fetchJSON('data/skills.json'),
      fetchJSON('data/experience.json'),
    ]);

    renderProfile(profile);
    renderProjects(projects);
    renderSkills(skills);
    renderExperience(experience);
    setupClipboardCopy(profile);

    console.log('[data-loader] Portfolio hydrated from data store ✓');
  } catch (err) {
    console.error('[data-loader] Hydration error:', err);
  }
}

// Run after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', hydrate);
} else {
  hydrate();
}
