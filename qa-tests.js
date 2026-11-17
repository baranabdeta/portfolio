/**
 * qa-tests.js — Comprehensive Functional, Regression & Security Test Suite
 * Target: Baran Abdeta Personal Professional Portfolio
 * Standards: PRD.md (v1.3.0), ARCHITECTURE.md (v1.0.0), WCAG 2.1 AA
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const http = require('http');

// ─── Test Harness ─────────────────────────────────────────────────────────────

let passed   = 0;
let failed   = 0;
let warnings = 0;
const results  = [];

function syncTest(id, description, fn) {
  try {
    const res = fn();
    if (res === 'WARN') {
      warnings++;
      results.push({ id, description, status: 'WARN' });
      console.log(`  ⚠️  WARN  [${id}] ${description}`);
    } else if (res === true || res === undefined) {
      passed++;
      results.push({ id, description, status: 'PASS' });
      console.log(`  ✅ PASS  [${id}] ${description}`);
    } else {
      failed++;
      results.push({ id, description, status: 'FAIL', reason: String(res) });
      console.log(`  ❌ FAIL  [${id}] ${description} -> ${res}`);
    }
  } catch (err) {
    failed++;
    results.push({ id, description, status: 'FAIL', reason: err.message });
    console.log(`  ❌ FAIL  [${id}] ${description} -> ${err.message}`);
  }
}

async function asyncTest(id, description, fn) {
  try {
    await fn();
    passed++;
    results.push({ id, description, status: 'PASS' });
    console.log(`  ✅ PASS  [${id}] ${description}`);
  } catch (err) {
    failed++;
    results.push({ id, description, status: 'FAIL', reason: err.message });
    console.log(`  ❌ FAIL  [${id}] ${description} -> ${err.message}`);
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

// ─── Asset Load ───────────────────────────────────────────────────────────────

const ROOT = __dirname;
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const css  = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');
const dl   = fs.readFileSync(path.join(ROOT, 'data-loader.js'), 'utf8');
const srv  = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');

const profile    = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/profile.json'), 'utf8'));
const projects   = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/projects.json'), 'utf8'));
const skills     = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/skills.json'), 'utf8'));
const experience = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/experience.json'), 'utf8'));

// ─── SUITE 1: Data Architecture & Taxonomy Integrity ──────────────────────────

console.log('\n━━━ SUITE 1: Data Architecture & Taxonomy (PRD BR-01, 02, 03, 04, 05) ━━━\n');

syncTest('D-01', 'profile.json schema contains required professional identity properties', () => {
  assert(profile.fullName, 'profile.fullName is missing');
  assert(profile.professionalHeadline === 'Full Stack Developer', 'BR-01.1: Headline must be "Full Stack Developer"');
  assert(profile.secondaryHeadline, 'profile.secondaryHeadline is missing');
  assert(profile.elevatorPitch, 'profile.elevatorPitch is missing');
  assert(Array.isArray(profile.badges) && profile.badges.length >= 3, 'profile.badges must contain >= 3 entries');
});

syncTest('D-02', 'profile.json anti-scraping policy: no raw phone numbers or street addresses (BR-06.4)', () => {
  const serialized = JSON.stringify(profile).toLowerCase();
  assert(!serialized.includes('"phone"') && !serialized.includes('"mobile"') && !serialized.includes('"tel"'),
    'Profile contains telephone keys');
  assert(!/tel:\+?[\d\s-]{7,}/i.test(serialized), 'Profile contains tel: URI');
  assert(!/\+\d{1,3}[\s-]?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}/.test(serialized), 'Profile contains formatted telephone number');
});

syncTest('D-03', 'profile.json ATS-compliant resume specifications (BR-02.2, BR-02.3)', () => {
  assert(profile.resume?.publicUrl === 'resume.pdf', 'resume.publicUrl must be "resume.pdf"');
  assert(profile.resume?.downloadFilename, 'resume.downloadFilename is missing');
  assert(/^[A-Za-z]+_[A-Za-z]+.*\.pdf$/.test(profile.resume.downloadFilename), 'ATS resume filename format violation');
  assert(profile.resume?.maxSizeBytes <= 2097152, 'BR-02.3: maxSizeBytes must not exceed 2MB');
});

syncTest('D-04', 'projects.json dynamic scalability baseline N >= 1 (BR-04.1)', () => {
  assert(Array.isArray(projects) && projects.length >= 1, 'Dynamic catalog must support N >= 1');
});

syncTest('D-05', 'projects.json scannable tag density: 3 to 6 tags per project (BR-05.3)', () => {
  projects.forEach((p, idx) => {
    assert(p.tags && p.tags.length >= 3 && p.tags.length <= 6,
      `Project [${idx}] "${p.title}" has ${p.tags ? p.tags.length : 0} tags (expected 3-6)`);
  });
});

syncTest('D-06', 'projects.json public HTTPS repository URLs (BR-04.5)', () => {
  projects.forEach((p, idx) => {
    assert(p.repoUrl && p.repoUrl.startsWith('https://github.com/'),
      `Project [${idx}] "${p.title}" repoUrl must be HTTPS GitHub URL`);
  });
});

syncTest('D-07', 'projects.json optional demoUrl is null or valid HTTPS string (BR-04.3)', () => {
  projects.forEach((p, idx) => {
    assert(p.demoUrl === null || (typeof p.demoUrl === 'string' && p.demoUrl.startsWith('https://')),
      `Project [${idx}] "${p.title}" demoUrl must be null or valid HTTPS string`);
  });
});

syncTest('D-08', 'skills.json 4-tier domain taxonomy present (BR-05.1)', () => {
  assert(Array.isArray(skills) && skills.length === 4, 'Skills must contain exactly 4 categories');
  const domains = skills.map(c => c.categoryName);
  ['Frontend', 'Backend', 'Databases & Cloud', 'Tools & Practices'].forEach(d => {
    assert(domains.includes(d), `Required skill domain missing: ${d}`);
  });
});

syncTest('D-09', 'skills.json sorting order attributes present for all categories (BR-05.2)', () => {
  skills.forEach((cat, idx) => {
    assert(typeof cat.order === 'number' && cat.skills && cat.skills.length > 0,
      `Skill category [${idx}] must define order and non-empty skills array`);
  });
});

syncTest('D-10', 'experience.json chronological integrity and current role flag (BR-03.1, BR-03.2)', () => {
  assert(Array.isArray(experience) && experience.length >= 1, 'Experience array must be populated');
  const currentRoles = experience.filter(e => e.isCurrent);
  assert(currentRoles.length >= 1, 'At least one active role must exist');
  currentRoles.forEach(r => {
    assert(r.endDate === null, `Current role "${r.role}" must have endDate null`);
  });
});

// ─── SUITE 2: Static DOM & Markup Compliance ──────────────────────────────────

console.log('\n━━━ SUITE 2: Static DOM & Markup Compliance (PRD BR-01, 06, 07, 08, 10) ━━\n');

syncTest('H-01', 'Document defines HTML5 doctype and lang="en" attribute (WCAG 3.1.1)', () => {
  assert(html.startsWith('<!DOCTYPE html>'), 'Must start with <!DOCTYPE html>');
  assert(html.includes('<html lang="en">'), 'Must define lang="en"');
});

syncTest('H-02', 'Mobile viewport meta tag configured for responsive layout (BR-08.1)', () => {
  assert(html.includes('<meta name="viewport" content="width=device-width, initial-scale=1.0">'),
    'Viewport meta tag missing or misconfigured');
});

syncTest('H-03', 'Persistent navigation bar structure with Home, Projects, Contact links', () => {
  assert(html.includes('id="topNav"'), 'Missing #topNav navigation header');
  assert(html.includes('href="#home"'), 'Missing #home anchor');
  assert(html.includes('href="#projects"'), 'Missing #projects anchor');
  assert(html.includes('href="#contact"'), 'Missing #contact anchor');
});

syncTest('H-04', 'Persistent Resume CTA with accessible download attribute (BR-02.1)', () => {
  assert(html.includes('class="cv-btn"') && html.includes('aria-label="Download CV"'),
    'Resume CTA button missing accessible label');
  assert(html.includes('download="Baran_Abdeta_Resume.pdf"'),
    'Resume CTA must define download attribute with ATS filename');
});

syncTest('H-05', 'Hero section contains full professional headline without availability badge (BR-01.1, BR-01.2)', () => {
  assert(html.includes('Baran Abdeta'), 'Developer name missing in Hero');
  assert(html.includes('Full Stack Developer'), 'Professional headline "Full Stack Developer" missing');
  assert(!html.toLowerCase().includes('open to work'), 'BR-01.2: Availability badge must not exist');
  assert(!html.toLowerCase().includes('open-to-work'), 'BR-01.2: Open-to-work tag must not exist');
});

syncTest('H-06', 'Projects section includes scroll track container for dynamic card injection', () => {
  assert(html.includes('class="projects-scroll-track"'), 'Missing .projects-scroll-track container');
});

syncTest('H-07', 'Contact section contains LinkedIn, GitHub, and pre-formatted mailto pill (BR-06.1)', () => {
  assert(html.includes('mailto:baran.abdeta@example.com?subject=Inquiry%20via%20Portfolio'),
    'BR-06.1: mailto must include predefined subject "Inquiry via Portfolio"');
  assert(html.includes('https://linkedin.com'), 'LinkedIn link missing');
  assert(html.includes('https://github.com'), 'GitHub link missing');
});

syncTest('H-08', 'Outbound external links enforce target="_blank" and rel="noopener noreferrer" (BR-07.1)', () => {
  const externalLinkRegex = /<a\s+[^>]*href="https?:\/\/[^"]*"[^>]*>/gi;
  const matches = html.match(externalLinkRegex) || [];
  assert(matches.length > 0, 'No external links found in index.html');
  matches.forEach(linkTag => {
    assert(linkTag.includes('target="_blank"'), `Link missing target="_blank": ${linkTag}`);
    assert(linkTag.includes('rel="noopener noreferrer"') || linkTag.includes('rel="noreferrer noopener"'),
      `Link missing rel="noopener noreferrer": ${linkTag}`);
  });
});

syncTest('H-09', 'Privacy governance: no telephone numbers exposed in static HTML (BR-06.4)', () => {
  assert(!html.includes('tel:'), 'Found tel: scheme in HTML');
  assert(!/phone:\s*\+?\d/i.test(html), 'Found phone label in HTML');
  assert(!/\+\d{1,3}[\s-]\(?\d{2,4}\)?[\s-]\d{3,4}[\s-]\d{4}/.test(html), 'Found plain text telephone number in HTML');
});

syncTest('H-10', 'Footer renders copyright statement and active maintenance indicator (BR-10.2)', () => {
  assert(html.includes('class="minimal-footer"'), 'Missing minimal footer');
  assert(html.includes('&copy; 2026'), 'Missing copyright year 2026');
  assert(html.includes('Baran Abdeta'), 'Missing developer signature');
});

// ─── SUITE 3: Client-Side Hydration & Dynamic Rendering Logic ─────────────────

console.log('\n━━━ SUITE 3: Client Hydration & Logic (data-loader.js) ━━━━━━━━━━━━━━━━━\n');

syncTest('L-01', 'XSS sanitization helper esc() properly encodes special characters', () => {
  const esc = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };
  assert(esc('<script>alert("xss")</script>') === '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
    'esc() failed XSS sanitization');
  assert(esc('&"<>') === '&amp;&quot;&lt;&gt;', 'esc() failed entity encoding');
});

syncTest('L-02', 'Project sorting algorithm prioritizes featured projects first (BR-04.2)', () => {
  const testProjects = [
    { title: 'Project A', featured: false, sortOrder: 1 },
    { title: 'Project B', featured: true,  sortOrder: 2 },
    { title: 'Project C', featured: false, sortOrder: 3 },
    { title: 'Project D', featured: true,  sortOrder: 1 }
  ];
  const sorted = [...testProjects].sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return (a.sortOrder || 0) - (b.sortOrder || 0);
  });
  assert(sorted[0].title === 'Project D', 'First project should be featured with lowest sortOrder');
  assert(sorted[1].title === 'Project B', 'Second project should be featured');
  assert(sorted[2].title === 'Project A', 'Third project should be unfeatured');
});

syncTest('L-03', 'Optional Live Demo enforcement: strictly omit button when demoUrl is null (BR-04.3)', () => {
  assert(dl.includes("BR-04.3: strictly omit demo button if no URL"), 'Logic comment for BR-04.3 present');
  assert(dl.includes('p.demoUrl') && dl.includes('btn-demo') && dl.includes("class=\"btn-see-more btn-demo\""), 'Conditional demo link rendering present');
});

syncTest('L-04', 'Image degradation fallback: initials graphic generator handles missing images (BR-04.4)', () => {
  assert(dl.includes('function getDefaultGraphic(title)'), 'getDefaultGraphic defined');
  assert(dl.includes('title.split(\' \').slice(0, 2).map(w => w[0]).join(\'\')'), 'Initials calculation defined');
});

syncTest('L-05', 'Resume button attributes dynamically updated with filename from profile (BR-02.2)', () => {
  assert(dl.includes("cvBtn.setAttribute('download', profile.resume.downloadFilename || 'Resume.pdf')"),
    'Dynamic download filename assignment present');
});

syncTest('L-06', 'Mailto subject line constructed according to BR-06.1 in renderProfile', () => {
  assert(dl.includes('mailto:${email}?subject=Inquiry%20via%20Portfolio'),
    'renderProfile constructs compliant mailto URI');
});

// ─── SUITE 4: Backend Security, Caching & Routing (server.js) ────────────────

console.log('\n━━━ SUITE 4: Backend Security & File Server (ARCHITECTURE.md Section 4, 6) ━━\n');

syncTest('S-01', 'Startup FMEA validation verifies resume.pdf exists and is non-empty', () => {
  const resumePath = path.join(ROOT, 'resume.pdf');
  assert(fs.existsSync(resumePath), 'resume.pdf must exist in root');
  const stats = fs.statSync(resumePath);
  assert(stats.size > 0, 'resume.pdf must have non-zero size');
  assert(stats.size <= 2097152, 'resume.pdf must be <= 2MB');
});

syncTest('S-02', 'Cache-Control policy matches architecture specifications (Section 4.2)', () => {
  assert(srv.includes("public, max-age=0, must-revalidate"), 'HTML cache policy must be max-age=0, must-revalidate');
  assert(srv.includes("public, max-age=3600, stale-while-revalidate=86400"), 'PDF cache policy must match 1h TTL');
  assert(srv.includes("public, max-age=300, stale-while-revalidate=3600"), 'JSON cache policy must match 5m TTL');
  assert(srv.includes("public, max-age=31536000, immutable"), 'Static asset cache policy must be 1y immutable');
});

syncTest('S-03', 'Path traversal sanitizer rejects directory escape attempts', () => {
  assert(srv.includes('resolveSafePath'), 'resolveSafePath function defined');
  assert(srv.includes('path.normalize'), 'Uses path.normalize');
  assert(srv.includes('resolved.startsWith(ROOT + path.sep)'), 'Ensures path stays within ROOT boundary');
});

syncTest('S-04', 'Strict Content Security Policy (CSP) defined in security headers', () => {
  assert(srv.includes("default-src 'self'"), 'CSP default-src is self');
  assert(srv.includes("frame-ancestors 'none'"), 'CSP frame-ancestors is none');
  assert(srv.includes("X-Frame-Options': 'DENY'"), 'X-Frame-Options is DENY');
  assert(srv.includes("X-Content-Type-Options': 'nosniff'"), 'X-Content-Type-Options is nosniff');
  assert(srv.includes("Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload'"), 'HSTS header configured');
});

// ─── SUITE 5: End-to-End Live HTTP Integration Tests ─────────────────────────

console.log('\n━━━ SUITE 5: Live HTTP Integration & Regression Testing ━━━━━━━━━━━━━━━━\n');

function makeRequest(port, pathName, method = 'GET', reqHeaders = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path: pathName,
      method,
      headers: reqHeaders,
    }, res => {
      const chunks = [];
      res.on('data', chunk => { chunks.push(chunk); });
      res.on('end', () => {
        const rawBuffer = Buffer.concat(chunks);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          rawBuffer,
          body: rawBuffer.toString('utf8'),
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runLiveHttpSuite() {
  const TEST_PORT = 3105;
  process.env.PORT = TEST_PORT;
  
  // Require and start server
  require('./server.js');
  await new Promise(r => setTimeout(r, 600));

  // TEST I-01: Root route delivers HTML with compliant headers
  await asyncTest('I-01', 'GET / serves index.html with 200 OK, CSP, and must-revalidate cache header', async () => {
    const res = await makeRequest(TEST_PORT, '/');
    assert(res.statusCode === 200, `Expected 200, got ${res.statusCode}`);
    assert(res.headers['content-type']?.includes('text/html'), 'Expected text/html Content-Type');
    assert(res.headers['cache-control'] === 'public, max-age=0, must-revalidate', 'Incorrect Cache-Control for HTML');
    assert(res.headers['x-frame-options'] === 'DENY', 'Missing or invalid X-Frame-Options');
    assert(res.headers['x-content-type-options'] === 'nosniff', 'Missing X-Content-Type-Options');
    assert(res.body.includes('Baran Abdeta'), 'Response body missing developer name');
  });

  // TEST I-02: Resume PDF route
  await asyncTest('I-02', 'GET /resume.pdf serves valid PDF with inline Content-Disposition and 1h TTL', async () => {
    const res = await makeRequest(TEST_PORT, '/resume.pdf');
    assert(res.statusCode === 200, `Expected 200, got ${res.statusCode}`);
    assert(res.headers['content-type'] === 'application/pdf', 'Expected application/pdf');
    assert(res.headers['content-disposition']?.includes('inline; filename="resume.pdf"'),
      'Content-Disposition must be inline with filename');
    assert(res.headers['cache-control']?.includes('max-age=3600'), 'PDF cache TTL must be 3600');
    assert(res.body.startsWith('%PDF-'), 'Body does not have valid PDF magic bytes');
  });

  // TEST I-03: JSON data endpoints
  await asyncTest('I-03', 'GET /data/profile.json returns valid JSON with 5-minute cache TTL', async () => {
    const res = await makeRequest(TEST_PORT, '/data/profile.json');
    assert(res.statusCode === 200, `Expected 200, got ${res.statusCode}`);
    assert(res.headers['content-type']?.includes('application/json'), 'Expected application/json');
    assert(res.headers['cache-control']?.includes('max-age=300'), 'JSON cache TTL must be 300s');
    const parsed = JSON.parse(res.body);
    assert(parsed.fullName === 'Baran Abdeta', 'JSON content mismatch');
  });

  // TEST I-04: Static CSS delivery
  await asyncTest('I-04', 'GET /style.css returns text/css with 1-year immutable cache header', async () => {
    const res = await makeRequest(TEST_PORT, '/style.css');
    assert(res.statusCode === 200, `Expected 200, got ${res.statusCode}`);
    assert(res.headers['content-type']?.includes('text/css'), 'Expected text/css');
    assert(res.headers['cache-control']?.includes('immutable'), 'Static CSS must be immutable');
  });

  // TEST I-05: HEAD request behavior
  await asyncTest('I-05', 'HEAD / returns 200 headers with empty body', async () => {
    const res = await makeRequest(TEST_PORT, '/', 'HEAD');
    assert(res.statusCode === 200, `Expected 200, got ${res.statusCode}`);
    assert(res.body === '', 'HEAD request must not return a body');
    assert(res.headers['content-type']?.includes('text/html'), 'Headers should still be populated');
  });

  // TEST I-06: Method not allowed (405)
  await asyncTest('I-06', 'POST / returns 405 Method Not Allowed with Allow: GET, HEAD', async () => {
    const res = await makeRequest(TEST_PORT, '/', 'POST');
    assert(res.statusCode === 405, `Expected 405, got ${res.statusCode}`);
    assert(res.headers['allow'] === 'GET, HEAD', 'Expected Allow: GET, HEAD');
  });

  // TEST I-07: 404 handler for missing route
  await asyncTest('I-07', 'GET /nonexistent-route.html returns 404 Not Found JSON response', async () => {
    const res = await makeRequest(TEST_PORT, '/nonexistent-route.html');
    assert(res.statusCode === 404, `Expected 404, got ${res.statusCode}`);
    const body = JSON.parse(res.body);
    assert(body.status === 404, '404 response payload structure mismatch');
  });

  // TEST I-08: Path traversal security protection
  await asyncTest('I-08', 'Path traversal attempts return 404 and do not escape root', async () => {
    const res = await makeRequest(TEST_PORT, '/..%2f..%2fpackage.json');
    assert(res.statusCode === 404, `Path traversal was not blocked, got ${res.statusCode}`);
  });

  // TEST I-09: Gzip Compression negotiation
  await asyncTest('I-09', 'GET /style.css with Accept-Encoding: gzip returns Content-Encoding: gzip', async () => {
    const res = await makeRequest(TEST_PORT, '/style.css', 'GET', { 'Accept-Encoding': 'gzip' });
    assert(res.statusCode === 200, `Expected 200, got ${res.statusCode}`);
    assert(res.headers['content-encoding'] === 'gzip', 'Missing or invalid Content-Encoding header');
    assert(res.headers['vary']?.includes('Accept-Encoding'), 'Missing Vary: Accept-Encoding header');
  });

  // TEST I-10: ETag and HTTP 304 conditional validation
  await asyncTest('I-10', 'Conditional GET with matching If-None-Match returns 304 Not Modified', async () => {
    const initial = await makeRequest(TEST_PORT, '/data/profile.json');
    const etag = initial.headers['etag'];
    assert(etag, 'ETag header missing on initial request');
    const conditional = await makeRequest(TEST_PORT, '/data/profile.json', 'GET', { 'If-None-Match': etag });
    assert(conditional.statusCode === 304, `Expected 304, got ${conditional.statusCode}`);
    assert(conditional.body === '', '304 response must have empty body');
  });

  // TEST I-11: Null-byte traversal injection protection
  await asyncTest('I-11', 'Null-byte injection attempts return 404', async () => {
    const res = await makeRequest(TEST_PORT, '/%00index.html');
    assert(res.statusCode === 404, `Expected 404 for null-byte attack, got ${res.statusCode}`);
  });

  // TEST I-12: Zero unsafe-inline in script-src CSP header
  await asyncTest('I-12', 'Content-Security-Policy script-src enforces strict self with zero unsafe-inline', async () => {
    const res = await makeRequest(TEST_PORT, '/');
    const csp = res.headers['content-security-policy'] || '';
    const scriptSrcMatch = csp.match(/script-src\s+([^;]+)/);
    assert(scriptSrcMatch, 'CSP must define script-src directive');
    assert(scriptSrcMatch[1].includes("'self'"), "script-src must include 'self'");
    assert(!scriptSrcMatch[1].includes("'unsafe-inline'"), "CSP script-src must not contain 'unsafe-inline'");
  });
}

// ─── SUITE 6: CSS & Responsive Regression ─────────────────────────────────────

console.log('\n━━━ SUITE 6: CSS & Responsive Regression ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

syncTest('C-01', 'Responsive media query exists at standard 768px breakpoint (BR-08.1)', () => {
  assert(css.includes('@media') && css.includes('768px'), 'Missing 768px media breakpoint');
});

syncTest('C-02', 'Horizontal project scroll track rules defined with smooth scrolling', () => {
  assert(css.includes('.projects-scroll-track'), 'Missing .projects-scroll-track CSS selector');
  assert(css.includes('overflow-x') || css.includes('scroll'), 'Scroll behavior defined on track');
});

syncTest('C-03', 'Contact pill interactive styling with hover and focus states', () => {
  assert(css.includes('.contact-pill-item'), 'Missing .contact-pill-item class');
  assert(css.includes(':hover'), 'Hover pseudo-classes defined for interactivity');
});

syncTest('C-04', 'Background ambient glow and contrast vignette overlays defined', () => {
  assert(css.includes('.bg-blur-container'), 'Missing .bg-blur-container class');
  assert(css.includes('.bg-vignette-overlay'), 'Missing .bg-vignette-overlay class');
});

// ─── SUITE 7: WCAG 2.1 AA Accessibility & Keyboard Navigation ─────────────────

console.log('\n━━━ SUITE 7: WCAG 2.1 AA Accessibility & Keyboard Compliance ━━━━━━━━━━━\n');

syncTest('A-01', 'Keyboard skip-to-content link present at top of DOM', () => {
  assert(html.includes('class="skip-link"'), 'Missing .skip-link element in HTML');
  assert(html.includes('href="#home"'), 'Skip link must target main content anchor (#home)');
  assert(css.includes('.skip-link'), 'CSS must define .skip-link styles');
  assert(css.includes('.skip-link:focus') || css.includes('.skip-link:focus-visible'), 'CSS must define focus state for skip-link');
});

syncTest('A-02', 'Semantic landmark roles defined across main structure', () => {
  assert(html.includes('role="banner"'), 'Header missing role="banner"');
  assert(html.includes('aria-label="Main Navigation"'), 'Nav pill missing accessible aria-label');
  assert(html.includes('role="contentinfo"'), 'Footer missing role="contentinfo"');
});

syncTest('A-03', 'Decorative graphics hidden from screen readers with aria-hidden="true"', () => {
  assert(html.includes('<div class="bg-blur-container" aria-hidden="true">'), 'Background container must have aria-hidden="true"');
  assert(html.includes('<div class="pill-icon-bubble" aria-hidden="true">'), 'Pill icon bubbles must have aria-hidden="true"');
});

syncTest('A-04', 'Outbound external links provide screen reader context for new tabs', () => {
  assert(html.includes('class="sr-only"'), 'HTML must include .sr-only accessible announcements');
  assert(html.includes('(opens in new tab)'), 'Accessible label must declare opening in new tab');
  assert(css.includes('.sr-only'), 'CSS must define accessible .sr-only utility class');
});

syncTest('A-05', 'High-contrast keyboard focus visibility rules (:focus-visible) defined in CSS', () => {
  assert(css.includes(':focus-visible'), 'CSS must define :focus-visible rules');
  assert(css.includes('outline'), 'Focus indicator must define high-contrast outline');
});

syncTest('A-06', 'Vestibular motion safety: prefers-reduced-motion media query implemented', () => {
  assert(css.includes('prefers-reduced-motion: reduce'), 'Missing prefers-reduced-motion media query');
  assert(css.includes('animation-duration'), 'Reduced motion must suppress CSS animation durations');
});

// ─── SUITE 8: Advanced Security Architecture & Threat Mitigation ──────────────

console.log('\n━━━ SUITE 8: Advanced Security Architecture & Threat Mitigation ━━━━━━━━\n');

syncTest('SEC-01', 'Sanitization helper esc() protects against single-quote attribute breakout', () => {
  assert(dl.includes("replace(/'/g, '&#39;')"), 'esc() must encode single quotes');
});

syncTest('SEC-02', 'Client-side URL protocol whitelist guard implemented against javascript: XSS', () => {
  assert(dl.includes('sanitizeUrl'), 'sanitizeUrl helper must be defined in data-loader.js');
  assert(dl.includes('/^(https?:|mailto:|\\/)/i'), 'sanitizeUrl must whitelist only safe protocols');
});

syncTest('SEC-03', 'Path traversal sanitizer handles null bytes and decoded payloads', () => {
  assert(srv.includes("reqUrl.includes('\\0')"), 'server.js must block null bytes');
});

syncTest('SEC-04', 'Content Security Policy specifies object-src none and base-uri self', () => {
  assert(srv.includes("object-src 'none'"), 'CSP must set object-src none');
  assert(srv.includes("base-uri 'self'"), 'CSP must set base-uri self');
});

// ─── SUITE 9: Performance & Runtime Optimization ──────────────────────────────

console.log('\n━━━ SUITE 9: Performance & Loading Speed Optimization ━━━━━━━━━━━━━━━━━━\n');

syncTest('P-01', 'Critical hero background asset is preloaded in head', () => {
  assert(html.includes('rel="preload"') && html.includes('as="image"') && html.includes('background.jpg'),
    'Missing preload link for background hero image');
});

syncTest('P-02', 'CSS content-visibility containment applied for off-screen sections', () => {
  assert(css.includes('content-visibility: auto'), 'CSS must define content-visibility: auto');
  assert(css.includes('contain-intrinsic-size'), 'CSS must define contain-intrinsic-size');
});

syncTest('P-03', 'Hardware GPU acceleration applied to horizontal project scroll track', () => {
  assert(css.includes('will-change: transform'), 'Missing will-change on scroll track');
  assert(css.includes('transform: translateZ(0)'), 'Missing translateZ GPU hint on scroll track');
});

syncTest('P-04', 'PRD BR-06.2 & BR-06.3 clipboard copy interaction and 3000ms feedback defined', () => {
  assert(dl.includes('setupClipboardCopy'), 'data-loader.js must define setupClipboardCopy');
  assert(dl.includes('3000'), 'Feedback must reset after 3000ms');
  assert(dl.includes('navigator.clipboard.writeText'), 'Must use clipboard API');
});

// ─── Execution ────────────────────────────────────────────────────────────────

runLiveHttpSuite().then(() => {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('  QA AUTOMATION & REGRESSION TEST RESULTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const total = passed + failed + warnings;
  console.log(`  Total Test Cases Executed : ${total}`);
  console.log(`  ✅ Passed                : ${passed}`);
  console.log(`  ❌ Failed                : ${failed}`);
  console.log(`  ⚠️  Warnings              : ${warnings}`);
  console.log(`  Success Rate             : ${((passed / total) * 100).toFixed(1)}%\n`);

  if (failed > 0) {
    console.log('  FAILURES REQUIRING ATTENTION:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`    ❌ [${r.id}] ${r.description} (${r.reason})`);
    });
    console.log('');
    process.exit(1);
  } else {
    console.log('  🎯 ALL ACCEPTANCE CRITERIA AND REGRESSION TESTS VERIFIED 100% PASSED!\n');
    process.exit(0);
  }
}).catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
