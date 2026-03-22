/* ═══════════════════════════════════════════════════
   EVOLVE 1.0 — Main Application
   SPA Router + Cosmic Canvas + Page Renderers
   ═══════════════════════════════════════════════════ */

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api'
  : 'https://evolve-r1qs.onrender.com/api'; // Corrected: must include /api prefix

// ═══════════════════════════════════════════════════
// LIVE COSMIC CANVAS BACKGROUND
// ═══════════════════════════════════════════════════
class CosmicBackground {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.stars = [];
    this.shootingStars = [];
    this.orbitals = [];
    this.satellites = [];
    this.nebulaClouds = [];
    this.floatingParticles = [];
    this.animId = null;
    this.mouse = { x: -1000, y: -1000 };
    this.time = 0;
  }

  init() {
    const old = document.getElementById('cosmicCanvas');
    if (old) old.remove();

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'cosmicCanvas';
    document.body.prepend(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    this.resize();
    this.createElements();

    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createElements() {
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Stars — dense starfield
    this.stars = [];
    for (let i = 0; i < 280; i++) {
      this.stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 2.2 + 0.2,
        opacity: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.03 + 0.005,
        twinklePhase: Math.random() * Math.PI * 2,
        hue: Math.random() > 0.85 ? (220 + Math.random() * 60) : 0, // some colored stars
      });
    }

    this.shootingStars = [];

    // Orbital rings
    this.orbitals = [];
    for (let i = 0; i < 4; i++) {
      this.orbitals.push({
        cx: w * (0.15 + Math.random() * 0.7),
        cy: h * (0.15 + Math.random() * 0.7),
        rx: 100 + Math.random() * 200,
        ry: 35 + Math.random() * 70,
        rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.003,
        opacity: 0.03 + Math.random() * 0.05,
      });
    }

    // Floating satellites
    this.satellites = [];
    for (let i = 0; i < 8; i++) {
      this.satellites.push({
        cx: w * (0.1 + Math.random() * 0.8),
        cy: h * (0.1 + Math.random() * 0.8),
        radius: 50 + Math.random() * 180,
        angle: Math.random() * Math.PI * 2,
        speed: (0.002 + Math.random() * 0.008) * (Math.random() > 0.5 ? 1 : -1),
        size: 1.2 + Math.random() * 2.5,
        color: ['#9b7ae8', '#c084fc', '#6e5cc4', '#e0d0ff', '#7dd3fc'][Math.floor(Math.random() * 5)],
        trail: [],
      });
    }

    // Nebula clouds
    this.nebulaClouds = [];
    for (let i = 0; i < 5; i++) {
      this.nebulaClouds.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: 200 + Math.random() * 400,
        color: ['110,92,196', '155,122,232', '192,132,252', '100,80,180', '80,60,200'][i],
        opacity: 0.012 + Math.random() * 0.025,
        driftX: (Math.random() - 0.5) * 0.2,
        driftY: (Math.random() - 0.5) * 0.15,
      });
    }

    // Floating particles — small gently drifting dots
    this.floatingParticles = [];
    for (let i = 0; i < 40; i++) {
      this.floatingParticles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: 0.5 + Math.random() * 1.5,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: -0.1 - Math.random() * 0.4,
        opacity: 0.2 + Math.random() * 0.5,
        hue: 250 + Math.random() * 40,
      });
    }
  }

  spawnShootingStar() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    this.shootingStars.push({
      x: Math.random() * w * 0.8,
      y: Math.random() * h * 0.4,
      length: 100 + Math.random() * 150,
      speed: 8 + Math.random() * 10,
      angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
      opacity: 1,
      decay: 0.012 + Math.random() * 0.01,
    });
  }

  animate() {
    this.time++;
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Nebula clouds
    this.nebulaClouds.forEach(cloud => {
      cloud.x += cloud.driftX;
      cloud.y += cloud.driftY;
      if (cloud.x < -cloud.size) cloud.x = w + cloud.size;
      if (cloud.x > w + cloud.size) cloud.x = -cloud.size;
      if (cloud.y < -cloud.size) cloud.y = h + cloud.size;
      if (cloud.y > h + cloud.size) cloud.y = -cloud.size;

      const gradient = ctx.createRadialGradient(cloud.x, cloud.y, 0, cloud.x, cloud.y, cloud.size);
      gradient.addColorStop(0, `rgba(${cloud.color}, ${cloud.opacity})`);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(cloud.x - cloud.size, cloud.y - cloud.size, cloud.size * 2, cloud.size * 2);
    });

    // Orbital rings
    this.orbitals.forEach(orb => {
      orb.rotation += orb.rotSpeed;
      ctx.save();
      ctx.translate(orb.cx, orb.cy);
      ctx.rotate(orb.rotation);
      ctx.strokeStyle = `rgba(155, 122, 232, ${orb.opacity})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, orb.rx, orb.ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    // Stars with twinkling
    this.stars.forEach(star => {
      const twinkle = Math.sin(this.time * star.twinkleSpeed + star.twinklePhase);
      const opacity = star.opacity * (0.5 + twinkle * 0.5);
      const size = star.size * (0.8 + twinkle * 0.2);

      const dx = (this.mouse.x - w / 2) * 0.006 * star.size;
      const dy = (this.mouse.y - h / 2) * 0.006 * star.size;

      ctx.beginPath();
      ctx.arc(star.x + dx, star.y + dy, size, 0, Math.PI * 2);
      if (star.hue > 0) {
        ctx.fillStyle = `hsla(${star.hue}, 60%, 80%, ${opacity})`;
      } else {
        ctx.fillStyle = `rgba(220, 210, 255, ${opacity})`;
      }
      ctx.fill();

      if (star.size > 1.6) {
        ctx.beginPath();
        ctx.arc(star.x + dx, star.y + dy, size * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(155, 122, 232, ${opacity * 0.1})`;
        ctx.fill();
      }
    });

    // Floating particles
    this.floatingParticles.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;
      if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;

      const waveX = Math.sin(this.time * 0.01 + p.y * 0.01) * 0.5;
      ctx.beginPath();
      ctx.arc(p.x + waveX, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 60%, 75%, ${p.opacity * (0.5 + Math.sin(this.time * 0.02 + p.x) * 0.5)})`;
      ctx.fill();
    });

    // Satellites orbiting with trails
    this.satellites.forEach(sat => {
      sat.angle += sat.speed;
      const x = sat.cx + Math.cos(sat.angle) * sat.radius;
      const y = sat.cy + Math.sin(sat.angle) * sat.radius * 0.4;

      sat.trail.push({ x, y, opacity: 0.6 });
      if (sat.trail.length > 18) sat.trail.shift();

      sat.trail.forEach((pt, i) => {
        pt.opacity *= 0.87;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, sat.size * 0.5 * (i / sat.trail.length), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(155, 122, 232, ${pt.opacity * 0.3})`;
        ctx.fill();
      });

      ctx.beginPath();
      ctx.arc(x, y, sat.size, 0, Math.PI * 2);
      ctx.fillStyle = sat.color;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, sat.size * 4, 0, Math.PI * 2);
      const glow = ctx.createRadialGradient(x, y, 0, x, y, sat.size * 4);
      glow.addColorStop(0, `rgba(155, 122, 232, 0.15)`);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fill();
    });

    // Shooting stars
    if (Math.random() < 0.007) this.spawnShootingStar();
    this.shootingStars = this.shootingStars.filter(ss => {
      ss.x += Math.cos(ss.angle) * ss.speed;
      ss.y += Math.sin(ss.angle) * ss.speed;
      ss.opacity -= ss.decay;

      if (ss.opacity <= 0) return false;

      ctx.beginPath();
      ctx.moveTo(ss.x, ss.y);
      ctx.lineTo(
        ss.x - Math.cos(ss.angle) * ss.length * ss.opacity,
        ss.y - Math.sin(ss.angle) * ss.length * ss.opacity
      );
      const gradient = ctx.createLinearGradient(
        ss.x, ss.y,
        ss.x - Math.cos(ss.angle) * ss.length,
        ss.y - Math.sin(ss.angle) * ss.length
      );
      gradient.addColorStop(0, `rgba(220, 210, 255, ${ss.opacity})`);
      gradient.addColorStop(1, 'rgba(220, 210, 255, 0)');
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.stroke();

      return true;
    });

    this.animId = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
  }
}

let cosmic = null;

// ── SPA Router ───────────────────────────────────────
function router() {
  const hash = window.location.hash || '#/';
  const app = document.getElementById('app');
  app.innerHTML = '';

  if (!cosmic) {
    cosmic = new CosmicBackground();
    cosmic.init();
  }

  const particles = `
    <div class="bg-particles">
      <div class="orb"></div>
      <div class="orb"></div>
      <div class="orb"></div>
    </div>`;

  const isCrossPageScroll = !!localStorage.getItem('scrollToSection');

  if (hash === '#/register') {
    app.innerHTML = particles + renderNavbar() + renderRegistration();
    initRegistrationForm();
  } else if (hash === '#/payment') {
    app.innerHTML = particles + renderNavbar() + renderPayment();
    initPaymentForm();
  } else if (hash === '#/success') {
    app.innerHTML = particles + renderNavbar() + renderSuccess();
  } else if (hash === '#/select-problem') {
    app.innerHTML = particles + renderNavbar() + renderProblemSelection();
    initProblemSelection();
  } else {
    app.innerHTML = particles + renderNavbar() + renderLanding();
    initLanding();
  }

  // Only scroll to top if we aren't handling a cross-page section scroll
  if (!isCrossPageScroll) {
    window.scrollTo(0, 0);
  }
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);

// ── Navbar ───────────────────────────────────────────
function renderNavbar() {
  return `
    <nav class="navbar" id="mainNav">
      <a href="#/" class="logo">
        <img src="college-logo.png" alt="Rajalakshmi Institute of Technology">
      </a>
      <ul class="nav-links" id="navLinks">
        <li><a href="#/" data-scroll="about">About</a></li>
        <li><a href="#/" data-scroll="timeline">Timeline</a></li>
        <li><a href="#/" data-scroll="tracks">Tracks</a></li>
        <li><a href="#/" data-scroll="rules">Rules</a></li>
        <li><a href="#/" data-scroll="coordinators">Contact</a></li>
      </ul>
      <span class="nav-cta" style="background: var(--bg-surface); color: var(--text-secondary); cursor: not-allowed; border: 1px solid rgba(255,255,255,0.1);">Registration Closed</span>
      <button class="hamburger" id="hamburgerBtn" aria-label="Toggle menu">
        <span></span><span></span><span></span>
      </button>
    </nav>`;
}

function initNavbar() {
  const nav = document.getElementById('mainNav');
  const hamburger = document.getElementById('hamburgerBtn');
  const links = document.getElementById('navLinks');

  if (!nav) return;

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  });

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      links.classList.toggle('open');
    });
  }

  // Smooth scroll for nav section links
  document.querySelectorAll('[data-scroll]').forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('data-scroll');
      const hash = window.location.hash || '#/';

      if (hash !== '#/') {
        // If not on landing page, redirect first
        // Navigation will happen via the href="#/" and we'll handle scrolling in initLanding
        localStorage.setItem('scrollToSection', targetId);
      } else {
        e.preventDefault();
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
      // Close mobile menu
      if (links) links.classList.remove('open');
    });
  });
}

// ══════════════════════════════════════════════════════
// LANDING PAGE
// ══════════════════════════════════════════════════════
function renderLanding() {
  return `
    <!-- Hero -->
    <section class="hero" id="hero">
      <div class="hero-badge">
        <span class="dot" style="background-color: #ff4444; box-shadow: 0 0 10px #ff4444;"></span>
        Registration Closed
      </div>

      <div class="hero-logo-wrapper">
        <div class="hero-logo-glow"></div>
        <div class="hero-logo-ring hero-logo-ring-1"></div>
        <div class="hero-logo-ring hero-logo-ring-2"></div>
        <img src="logo-new.png" alt="EVOLVE 1.0" class="hero-logo">
      </div>

      <div class="sponsor-section reveal">
        <span class="sponsor-label">Sponsored by</span>
        <a href="https://velonetics.com/" target="_blank" class="sponsor-link">
          <img src="https://velonetics.com/wp-content/uploads/2024/07/VELONETIS-V-.png" alt="Velonetics" class="sponsor-logo">
        </a>
      </div>

      <p class="subtitle">A An inter-college hackathon for social impact & Innovation — Innovate, Create & Empower through Technology</p>

      <div class="hero-actions">
        <!-- <a href="#/register" class="btn-primary">
          <span class="btn-shimmer"></span>
          Register Your Team
        </a> -->
      </div>

      <div class="hero-stats">
        <div class="stat">
          <div class="stat-num" data-count="4">2-4</div>
          <div class="stat-label">Team Size</div>
        </div>
        <div class="stat">
          <div class="stat-num">₹200</div>
          <div class="stat-label">Per Team</div>
        </div>
        <div class="stat">
          <div class="stat-num">3</div>
          <div class="stat-label">Tracks</div>
        </div>
        <div class="stat">
          <div class="stat-num">1 Day</div>
          <div class="stat-label">Event</div>
        </div>
      </div>

      <div class="scroll-indicator">
        <div class="scroll-arrow"></div>
      </div>
    </section>

    <!-- About -->
    <section class="section" id="about">
      <div class="section-header reveal">
        <div class="section-tag">About the Event</div>
        <h2 class="section-title">Empowering Innovation</h2>
        <p class="section-desc">Foster creativity among students while highlighting solutions aligned with UN SDG goals in technology, education, health, and social impact.</p>
      </div>
      <div class="about-grid">
        <div class="about-card reveal" style="--delay:0s">
          <div class="card-icon">💡</div>
          <h3>Innovation First</h3>
          <p>Build cutting-edge solutions that address real-world challenges through technology and creative thinking.</p>
        </div>
        <div class="about-card reveal" style="--delay:0.1s">
          <div class="card-icon">🌍</div>
          <h3>SDG Social Impact</h3>
          <p>Focus on solutions that address UN Sustainable Development Goals in technology, education, health, and environmental sustainability.</p>
        </div>
        <div class="about-card reveal" style="--delay:0.2s">
          <div class="card-icon">🏆</div>
          <h3>Compete & Learn</h3>
          <p>Present your work to expert judges, receive mentorship, and win exciting prizes across 3 specialized tracks.</p>
        </div>
        <div class="about-card reveal" style="--delay:0.3s">
          <div class="card-icon">🎯</div>
          <h3>Secret Challenge</h3>
          <p>On event day, receive a surprise challenge with 3 levels of secret features to integrate into your solution.</p>
        </div>
      </div>
    </section>

    <!-- Timeline -->
    <section class="section" id="timeline">
      <div class="event-date-container reveal">
        <div class="date-glow"></div>
        <div class="date-label">Save the Date</div>
        <div class="date-value">APRIL 7, 2026</div>
        <div class="date-decoration">
          <span></span><span></span><span></span>
        </div>
      </div>

      <div class="section-header reveal">
        <div class="section-tag">Event Day Schedule</div>
        <h2 class="section-title">Timeline</h2>
        <p class="section-desc">A packed day of innovation, challenges, and celebration.</p>
      </div>
      <div class="timeline">
        <div class="timeline-item reveal" style="--delay:0s">
          <div class="time">8:30 AM</div>
          <h3>Arrival & Registration</h3>
          <p>Teams check in, receive welcome kits. Guidance provided for team seating.</p>
        </div>
        <div class="timeline-item reveal" style="--delay:0.1s">
          <div class="time">9:00 AM</div>
          <h3>Opening Ceremony</h3>
          <p>Welcome address and project theme brief introduction.</p>
        </div>
        <div class="timeline-item reveal" style="--delay:0.15s">
          <div class="time">9:30 AM</div>
          <h3>Secret Challenge Pursuit</h3>
          <p>Receive unique challenges and adapt with secret features.</p>
        </div>
        <div class="timeline-item reveal" style="--delay:0.2s">
          <div class="time">12:40 PM</div>
          <h3>Lunch Break</h3>
          <p>Refreshments and networking with fellow participants and mentors.</p>
        </div>
        <div class="timeline-item reveal" style="--delay:0.25s">
          <div class="time">1:30 PM</div>
          <h3>Final Presentations</h3>
          <p>3-minute presentations + 2-minute Q&A. Judges evaluate live based on all criteria.</p>
        </div>
        <div class="timeline-item reveal" style="--delay:0.3s">
          <div class="time">3:30 PM onwards</div>
          <h3>Awards & Closing Ceremony</h3>
          <p>Winners announcement, certificates for all, and closing remarks.</p>
        </div>
      </div>
    </section>

    <!-- Tracks -->
    <section class="section" id="tracks">
      <div class="section-header reveal">
        <div class="section-tag">Competition Tracks</div>
        <h2 class="section-title">Problem Statements</h2>
      </div>
      <div class="tracks-release-box reveal">
        <div class="release-icon">🚀</div>
        <h3 class="release-title">Problem Statements will be released on<br><span class="release-date">5th April 2026, 8:00 AM IST</span></h3>
        <p class="release-subtitle">Stay tuned! All registered teams will receive an email notification when the problem statements go live.</p>
        <div class="release-countdown">
          <div class="countdown-item"><span id="countdown-days">--</span><small>Days</small></div>
          <div class="countdown-item"><span id="countdown-hours">--</span><small>Hours</small></div>
          <div class="countdown-item"><span id="countdown-mins">--</span><small>Minutes</small></div>
          <div class="countdown-item"><span id="countdown-secs">--</span><small>Seconds</small></div>
        </div>
      </div>
    </section>

    <!-- Judging -->
    <section class="section" id="judging">
      <div class="section-header reveal">
        <div class="section-tag">Evaluation</div>
        <h2 class="section-title">Judging Criteria</h2>
      </div>
      <div class="judging-grid">
        <div class="judge-card reveal" style="--delay:0s">
          <div class="judge-icon">✨</div>
          <h3>Innovation</h3>
          <p>Originality and creativity of the solution. How novel is the approach?</p>
        </div>
        <div class="judge-card reveal" style="--delay:0.08s">
          <div class="judge-icon">🌍</div>
          <h3>SDG Social Impact</h3>
          <p>Depth and relevance of the solution's impact on social issues and alignment with SDG goals.</p>
        </div>
        <div class="judge-card reveal" style="--delay:0.16s">
          <div class="judge-icon">⚙️</div>
          <h3>Feasibility</h3>
          <p>Technical viability and potential for real-world deployment.</p>
        </div>
        <div class="judge-card reveal" style="--delay:0.24s">
          <div class="judge-icon">🎤</div>
          <h3>Presentation</h3>
          <p>Clarity, confidence, and effectiveness of the pitch.</p>
        </div>
        <div class="judge-card reveal" style="--delay:0.32s">
          <div class="judge-icon">🔐</div>
          <h3>Challenge Adaptation</h3>
          <p>How well the team incorporated the surprise challenge features.</p>
        </div>
      </div>
    </section>

    <!-- Rules -->
    <section class="section" id="rules">
      <div class="section-header reveal">
        <div class="section-tag">Official Guidelines</div>
        <h2 class="section-title rulebook-title">Rulebook</h2>
      </div>
      <div class="rules-grid">
        <div class="rule-card reveal" style="--delay:0s">
          <div class="rule-num">1</div>
          <h3>Team Composition</h3>
          <ul>
            <li>Each team must consist of a minimum of <strong>2</strong> and a maximum of <strong>4</strong> participants.</li>
            <li>Participants may belong to the same or different departments or institutions.</li>
            <li>Each participant can be part of <strong>only one team</strong>.</li>
          </ul>
        </div>
        <div class="rule-card reveal" style="--delay:0.06s">
          <div class="rule-num">2</div>
          <h3>Eligibility</h3>
          <ul>
            <li>Students from <strong>any college or university</strong> are eligible to participate for the event.</li>
            <li>Participants must register through the <strong>official registration platform</strong> before the event.</li>
          </ul>
        </div>
        <div class="rule-card reveal" style="--delay:0.12s">
          <div class="rule-num">3</div>
          <h3>Project Development Guidelines</h3>
          <ul>
            <li>All projects must be developed within the <strong>hackathon timeline</strong>.</li>
            <li>Teams are encouraged to build <strong>original and innovative solutions</strong> addressing the given problem statements.</li>
          </ul>
        </div>
        <div class="rule-card reveal" style="--delay:0.18s">
          <div class="rule-num">4</div>
          <h3>Use of Tools and Technologies</h3>
          <ul>
            <li>Participants are free to use <strong>any programming language, framework, or development platform</strong>.</li>
            <li>AI tools may be used for assistance, but the <strong>core idea, implementation, and development</strong> must be carried out by the team members themselves.</li>
          </ul>
        </div>
        <div class="rule-card reveal" style="--delay:0.24s">
          <div class="rule-num">5</div>
          <h3>Equipment and Resources</h3>
          <ul>
            <li>Participants must bring their own <strong>laptops, chargers, and required software tools</strong>.</li>
            <li>The organizing team will provide basic infrastructure such as workspace, internet access, and power supply.</li>
          </ul>
        </div>
        <div class="rule-card reveal" style="--delay:0.3s">
          <div class="rule-num">6</div>
          <h3>Event Format</h3>
          <ul>
            <li>Registered teams will receive the <strong>official problem statements</strong>.</li>
            <li>Teams may begin preparing their solution remotely within the permitted time window.</li>
            <li>During the event, teams will refine their solutions and incorporate an <strong>additional challenge</strong> introduced by the organizers on the day of the event.</li>
            <li>Teams will present their final solution to the judging panel.</li>
          </ul>
        </div>
        <div class="rule-card reveal" style="--delay:0.36s">
          <div class="rule-num">7</div>
          <h3>Judging Criteria</h3>
          <ul>
            <li>Innovation and originality</li>
            <li>Impact and relevance to the theme</li>
            <li>Technical feasibility and implementation</li>
            <li>Quality of presentation and demonstration</li>
            <li>Overall problem-solving approach</li>
          </ul>
        </div>
        <div class="rule-card reveal" style="--delay:0.42s">
          <div class="rule-num">8</div>
          <h3>Code of Conduct</h3>
          <ul>
            <li>Participants must maintain <strong>professional conduct</strong> throughout the event.</li>
            <li>Teams are expected to respect judges, organizers, volunteers, and fellow participants.</li>
            <li>Any form of <strong>misconduct, plagiarism, or violation of rules</strong> may result in immediate disqualification.</li>
          </ul>
        </div>
        <div class="rule-card reveal" style="--delay:0.48s">
          <div class="rule-num">9</div>
          <h3>Decision of Judges</h3>
          <ul>
            <li>The decision of the judging panel will be <strong>final and binding</strong>.</li>
            <li>The organizing committee reserves the right to modify event procedures if necessary to ensure fair evaluation.</li>
          </ul>
        </div>
        <div class="rule-card reveal" style="--delay:0.54s">
          <div class="rule-num">10</div>
          <h3>Compliance</h3>
          <ul>
            <li>By participating in EVOLVE, teams agree to <strong>abide by all rules and guidelines</strong> stated in this rulebook and follow the instructions provided by the organizing committee.</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Coordinators -->
    <section class="section" id="coordinators">
      <div class="section-header reveal">
        <div class="section-tag">Get In Touch</div>
        <h2 class="section-title">Student Coordinators</h2>
      </div>
      <div class="about-grid">
        <div class="about-card reveal" style="--delay:0s">
          <div class="card-icon">📞</div>
          <h3>Rupesh S</h3>
          <p><a href="tel:9894646003" style="color:var(--text-primary); text-decoration:none; font-weight:bold; font-size: 1.2rem; letter-spacing: 1px;">9894646003</a></p>
        </div>
        <div class="about-card reveal" style="--delay:0.1s">
          <div class="card-icon">📞</div>
          <h3>Adithyaa A</h3>
          <p><a href="tel:7200909287" style="color:var(--text-primary); text-decoration:none; font-weight:bold; font-size: 1.2rem; letter-spacing: 1px;">7200909287</a></p>
        </div>
        <div class="about-card reveal" style="--delay:0.2s">
          <div class="card-icon">📞</div>
          <h3>Satyanarayanaa H</h3>
          <p><a href="tel:8122950540" style="color:var(--text-primary); text-decoration:none; font-weight:bold; font-size: 1.2rem; letter-spacing: 1px;">8122950540</a></p>
        </div>
        <div class="about-card reveal" style="--delay:0.3s">
          <div class="card-icon">📞</div>
          <h3>Mugesh M N</h3>
          <p><a href="tel:9042553150" style="color:var(--text-primary); text-decoration:none; font-weight:bold; font-size: 1.2rem; letter-spacing: 1px;">9042553150</a></p>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="section cta-section">
      <div class="cta-box reveal">
        <div class="cta-glow"></div>
        <div class="section-tag">Event Update</div>
        <h2 class="section-title">Registration Closed</h2>
        <!-- <a href="#/register" class="btn-primary" style="display:inline-block;margin-top:20px;">
          <span class="btn-shimmer"></span>
          Register Now — ₹200/team
        </a> -->
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <img src="logo.png" alt="EVOLVE 1.0" class="footer-logo">
      <p>An inter-college hackathon for social impact & Innovation</p>
      <p>Innovate · Create · Empower</p>
      <div class="footer-links">
        <a href="#about" data-scroll="about">About</a>
        <a href="#timeline" data-scroll="timeline">Timeline</a>
        <a href="#rules" data-scroll="rules">Rules</a>
        <a href="#coordinators" data-scroll="coordinators">Contact</a>
        <!-- <a href="#/register">Register</a> -->
      </div>
      <p style="margin-top:24px;font-size:0.8rem;">© 2026 EVOLVE 1.0. All rights reserved.</p>
    </footer>`;
}

function initLanding() {
  initNavbar();

  // Scroll reveal with stagger
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = entry.target.style.getPropertyValue('--delay') || '0s';
        entry.target.style.transitionDelay = delay;
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // Handle cross-page scroll targets
  const scrollTarget = localStorage.getItem('scrollToSection');
  if (scrollTarget) {
    localStorage.removeItem('scrollToSection');
    setTimeout(() => {
      const targetEl = document.getElementById(scrollTarget);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  // Parallax effect on hero elements
  const hero = document.querySelector('.hero');
  if (hero) {
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      const heroLogo = hero.querySelector('.hero-logo-wrapper');
      const badge = hero.querySelector('.hero-badge');
      const stats = hero.querySelector('.hero-stats');
      if (heroLogo) heroLogo.style.transform = `translateY(${scrollY * 0.15}px)`;
      if (badge) badge.style.transform = `translateY(${scrollY * 0.08}px)`;
      if (stats) stats.style.transform = `translateY(${scrollY * -0.05}px)`;
    });
  }

  // Footer scroll links
  document.querySelectorAll('.footer [data-scroll]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('data-scroll');
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Countdown to April 5, 2026, 8:00 AM
  const releaseDate = new Date('2026-04-05T08:00:00+05:30').getTime();
  function updateCountdown() {
    const now = Date.now();
    const diff = releaseDate - now;
    if (diff <= 0) {
      const el = document.querySelector('.release-title');
      if (el) el.innerHTML = 'Problem Statements are <span class="release-date">LIVE!</span>';
      return;
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    const dEl = document.getElementById('countdown-days');
    const hEl = document.getElementById('countdown-hours');
    const mEl = document.getElementById('countdown-mins');
    const sEl = document.getElementById('countdown-secs');
    if (dEl) dEl.textContent = String(days).padStart(2, '0');
    if (hEl) hEl.textContent = String(hours).padStart(2, '0');
    if (mEl) mEl.textContent = String(mins).padStart(2, '0');
    if (sEl) sEl.textContent = String(secs).padStart(2, '0');
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);
}

// ══════════════════════════════════════════════════════
// REGISTRATION PAGE
// ══════════════════════════════════════════════════════
function renderParticipantFields(index, mandatory) {
  const badge = mandatory
    ? '<span class="badge-mandatory">Mandatory</span>'
    : '<span class="badge-optional">Optional</span>';

  return `
    <div class="form-section-title">
      Participant ${index} ${badge}
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Name ${mandatory ? '<span class="req">*</span>' : ''}</label>
        <input type="text" id="p${index}_name" placeholder="Full Name" ${mandatory ? 'required' : ''}>
        <span class="error-msg" id="p${index}_name_err"></span>
      </div>
      <div class="form-group">
        <label>Register Number ${mandatory ? '<span class="req">*</span>' : ''}</label>
        <input type="text" id="p${index}_reg" placeholder="e.g. 21CSE001" ${mandatory ? 'required' : ''}>
        <span class="error-msg" id="p${index}_reg_err"></span>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Phone Number ${mandatory ? '<span class="req">*</span>' : ''}</label>
        <input type="tel" id="p${index}_phone" placeholder="10-digit number" ${mandatory ? 'required' : ''}>
        <span class="error-msg" id="p${index}_phone_err"></span>
      </div>
      <div class="form-group">
        <label>Email ${mandatory ? '<span class="req">*</span>' : ''}</label>
        <input type="email" id="p${index}_email" placeholder="email@example.com" ${mandatory ? 'required' : ''}>
        <span class="error-msg" id="p${index}_email_err"></span>
      </div>
    </div>`;
}

function renderRegistration() {
  return `
    <div class="page-wrapper">
      <div class="form-container">
        <h1>Register Your Team</h1>
        <p class="form-subtitle">Fill in your team details below. Team size: 2-4 participants.</p>

        <form id="regForm" novalidate>
          <!-- Team Info -->
          <div class="form-section-title">Team Information</div>
          <div class="form-row">
            <div class="form-group">
              <label>Team Name <span class="req">*</span></label>
              <input type="text" id="teamName" placeholder="e.g. CodeQueens" required>
              <span class="error-msg" id="teamName_err"></span>
            </div>
            <div class="form-group">
              <label>College <span class="req">*</span></label>
              <input type="text" id="college" placeholder="Your college name" required>
              <span class="error-msg" id="college_err"></span>
            </div>
          </div>

          <!-- Participants -->
          ${renderParticipantFields(1, true)}
          ${renderParticipantFields(2, true)}
          ${renderParticipantFields(3, false)}
          ${renderParticipantFields(4, false)}

          <button type="submit" class="btn-proceed" id="btnProceed">
            <span class="btn-shimmer"></span>
            Proceed to Pay →
          </button>
        </form>
      </div>
    </div>`;
}

function initRegistrationForm() {
  initNavbar();
  const form = document.getElementById('regForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (validateRegistration()) {
      const data = collectFormData();
      sessionStorage.setItem('regData', JSON.stringify(data));
      window.location.hash = '#/payment';
    }
  });

  form.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => {
      input.classList.remove('invalid');
      const errEl = document.getElementById(input.id + '_err');
      if (errEl) errEl.textContent = '';
    });
  });
}

function validateRegistration() {
  let valid = true;

  function check(id, message, validatorFn) {
    const el = document.getElementById(id);
    const err = document.getElementById(id + '_err');
    if (!el || !err) return;
    const val = el.value.trim();
    if (!validatorFn(val)) {
      el.classList.add('invalid');
      err.textContent = message;
      valid = false;
    } else {
      el.classList.remove('invalid');
      err.textContent = '';
    }
  }

  check('teamName', 'Team name is required', v => v.length > 0);
  check('college', 'College name is required', v => v.length > 0);

  // Helper validation regexes
  const phoneRe = /^[0-9]{10}$/;
  const regRe = /^[A-Za-z0-9]{5,20}$/; // Alphanumeric, reasonable length
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // Domain whitelist for standard participants (you can adjust these as needed)
  const allowedDomains = ['srmist.edu.in', 'ritchennai.edu.in', 'rajalakshmi.edu.in'];

  const validateDomain = (email) => {
    if (!email) return false;
    const parts = email.split('@');
    if (parts.length !== 2) return false;
    const domain = parts[1].toLowerCase();
    // Allow gmail for testing/leader, but strict domains for others if you wish
    // For now, we will just ensure it's a valid email structure, but you can 
    // uncomment this to enforce strict domains:
    // return allowedDomains.some(d => domain.endsWith(d));
    return emailRe.test(email);
  }

  for (let i = 1; i <= 2; i++) {
    check(`p${i}_name`, 'Name is required', v => v.length > 0);
    check(`p${i}_reg`, 'Register valid alphanumeric ID', v => regRe.test(v));
    check(`p${i}_phone`, 'Valid 10-digit phone required', v => phoneRe.test(v));
    check(`p${i}_email`, 'Valid email required', v => validateDomain(v));
  }

  for (let i = 3; i <= 4; i++) {
    const name = document.getElementById(`p${i}_name`)?.value.trim();
    const reg = document.getElementById(`p${i}_reg`)?.value.trim();
    const phone = document.getElementById(`p${i}_phone`)?.value.trim();
    const email = document.getElementById(`p${i}_email`)?.value.trim();

    const anyFilled = name || reg || phone || email;
    if (anyFilled) {
      check(`p${i}_name`, 'Name is required', v => v.length > 0);
      check(`p${i}_reg`, 'Register valid alphanumeric ID', v => regRe.test(v));
      check(`p${i}_phone`, 'Valid 10-digit phone required', v => phoneRe.test(v));
      check(`p${i}_email`, 'Valid email required', v => validateDomain(v));
    }
  }

  return valid;
}

function collectFormData() {
  const data = {
    teamName: document.getElementById('teamName').value.trim(),
    college: document.getElementById('college').value.trim(),
    participants: []
  };

  for (let i = 1; i <= 4; i++) {
    const name = document.getElementById(`p${i}_name`)?.value.trim();
    const reg = document.getElementById(`p${i}_reg`)?.value.trim();
    const phone = document.getElementById(`p${i}_phone`)?.value.trim();
    const email = document.getElementById(`p${i}_email`)?.value.trim();

    if (name || reg || phone || email) {
      data.participants.push({ name, reg, phone, email });
    }
  }

  return data;
}

// ══════════════════════════════════════════════════════
// PAYMENT PAGE
// ══════════════════════════════════════════════════════
function renderPayment() {
  const stored = sessionStorage.getItem('regData');
  if (!stored) {
    return `
      <div class="page-wrapper">
        <div class="payment-container">
          <div class="payment-card">
            <h1>No Registration Data</h1>
            <p style="color:var(--text-secondary);margin:20px 0;">
              Please complete the registration form first.
            </p>
            <a href="#/register" class="btn-primary" style="display:inline-block;margin-top:12px;">
              Go to Registration
            </a>
          </div>
        </div>
      </div>`;
  }

  const data = JSON.parse(stored);

  return `
    <div class="page-wrapper">
      <div class="payment-container">
        <div class="payment-card">
          <h1>Complete Payment</h1>
          <p style="color:var(--text-secondary);">Team: <strong style="color:var(--text-primary);">${data.teamName}</strong></p>
          <div class="amount"><span>₹</span>200</div>

          <div class="qr-wrapper">
            <img src="qr-code.png" alt="Payment QR Code" id="qrImage"
                 onerror="this.parentElement.innerHTML='<div style=\\'width:220px;height:220px;display:flex;align-items:center;justify-content:center;background:#f3f4f6;color:#6b7280;font-size:0.9rem;border-radius:8px;text-align:center;padding:20px;\\'>QR Code Image<br><small>(Place qr-code.png in project root)</small></div>'">
          </div>

          <div class="payment-instruction">
            📝 Scan the QR code above and pay ₹200
            <span class="highlight">TYPE "${data.teamName}" AS REASON FOR PAYMENT</span>
          </div>

          <div class="txn-input-group">
            <label>Transaction ID <span style="color:var(--accent-warm);">*</span></label>
            <input type="text" id="txnId" placeholder="Enter Transaction ID (12 characters)" required maxlength="15">
          </div>

          <button class="btn-submit" id="btnSubmit" disabled>
            <span class="btn-shimmer"></span>
            Submit Registration
          </button>
        </div>
      </div>
    </div>`;
}

function initPaymentForm() {
  initNavbar();
  const txnInput = document.getElementById('txnId');
  const submitBtn = document.getElementById('btnSubmit');
  if (!txnInput || !submitBtn) return;

  txnInput.addEventListener('input', () => {
    submitBtn.disabled = txnInput.value.trim().length === 0;
  });

  submitBtn.addEventListener('click', async () => {
    const txnId = txnInput.value.trim();
    if (!txnId) return;

    const stored = sessionStorage.getItem('regData');
    if (!stored) return;

    const data = JSON.parse(stored);
    data.transactionId = txnId;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Registration failed');
      }

      sessionStorage.removeItem('regData');
      sessionStorage.setItem('successTeam', data.teamName);
      window.location.hash = '#/success';
    } catch (err) {
      alert('Error: ' + err.message + '\nPlease try again.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Registration';
    }
  });
}

// ══════════════════════════════════════════════════════
// SUCCESS PAGE
// ══════════════════════════════════════════════════════
function renderSuccess() {
  const teamName = sessionStorage.getItem('successTeam') || 'Your Team';

  return `
    <div class="page-wrapper">
      <div class="success-container">
        <div class="success-card">
          <div class="success-icon">✓</div>
          <h1>Registration Complete!</h1>
          <p>Your registration has been submitted successfully.</p>
          <div class="team-name">${teamName}</div>
          <p>Your details have been recorded. You will receive a confirmation email with your event ticket once your payment is verified.</p>
          <div class="whatsapp-instruction" style="background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.3); border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="color: #22c55e; margin: 0; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 8px;">
              📱 Important for Team Leader
            </p>
            <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 8px 0 0;">
              Please join the <strong>WhatsApp group</strong> using the link provided in your confirmation email for further event updates.
            </p>
          </div>
          <a href="#/" class="btn-primary" style="display:inline-block;margin-top:10px;">
            Back to Home
          </a>
        </div>
      </div>
    </div>`;
}

// ══════════════════════════════════════════════════════
// PROBLEM SELECTION PAGE
// ══════════════════════════════════════════════════════
function renderProblemSelection() {
  const RELEASE_DATE = new Date('2026-04-05T08:00:00+05:30'); // April 5th 8am IST
  const now = new Date();

  if (now < RELEASE_DATE) {
    return `
      <div class="page-wrapper">
        <div class="form-container" style="max-width:800px;text-align:center;padding:60px 20px;">
          <div style="font-size:4rem;margin-bottom:20px;">⏳</div>
          <h1 style="background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Coming Soon</h1>
          <p style="color:var(--text-secondary);font-size:1.1rem;margin:20px 0;">
            Problem statements for EVOLVE 1.0 will be released on <strong>April 5th at 8:00 AM IST</strong>.
          </p>
          <div id="psCountdown" style="font-size:2.5rem;font-weight:700;color:var(--accent-2);margin:30px 0;font-family:monospace;"></div>
          <p style="margin-top:30px;color:var(--text-muted);">Stay tuned and keep practicing!</p>
          <a href="#/" class="btn-primary" style="display:inline-block;margin-top:32px;">Back to Home</a>
        </div>
      </div>
    `;
  }

  return `
    <div class="page-wrapper">
      <div class="form-container" style="max-width:900px;">
        <h1>Select Your Problem Statement</h1>
        <p class="form-subtitle">Only the team leader can select a problem statement. Enter your team name to proceed.</p>

        <!-- Team Verification -->
        <div id="teamVerifySection">
          <div class="form-row" style="grid-template-columns:1fr auto;align-items:end;">
            <div class="form-group">
              <label>Team Name <span class="req">*</span></label>
              <input type="text" id="psTeamName" placeholder="Enter your registered team name">
              <span class="error-msg" id="psTeamName_err"></span>
            </div>
            <button class="btn-proceed" style="width:auto;padding:12px 32px;margin-top:0;" id="btnVerifyTeam">
              Verify Team
            </button>
          </div>
        </div>

        <!-- Problem Statements (hidden until verified) -->
        <div id="problemsSection" style="display:none;">
          <div class="ps-team-info" id="psTeamInfo"></div>

          <div class="ps-track">
            <h3 class="ps-track-title">🔬 Track 1 — Cyber Security</h3>
            <div class="ps-cards" id="track1Cards"></div>
          </div>

          <div class="ps-track">
            <h3 class="ps-track-title">📚 Track 2 — FinTech & Security</h3>
            <div class="ps-cards" id="track2Cards"></div>
          </div>

          <div class="ps-track">
            <h3 class="ps-track-title">🌍 Track 3 — Social Safety</h3>
            <div class="ps-cards" id="track3Cards"></div>
          </div>
        </div>

        <!-- Confirmation Modal -->
        <div class="modal-overlay" id="psModal" style="display:none;">
          <div class="modal-card">
            <h2>Confirm Selection</h2>
            <p id="modalMsg">Are you sure you want to select this problem statement?</p>
            <p id="modalProblemName" style="font-weight:700;color:var(--accent-3);margin:12px 0;font-size:1.1rem;"></p>
            <p style="color:var(--accent-warm);font-size:0.85rem;">⚠️ This action cannot be undone.</p>
            <div style="display:flex;gap:12px;margin-top:24px;">
              <button class="btn-outline" style="flex:1;padding:12px;" id="btnCancelSelect">Cancel</button>
              <button class="btn-primary" style="flex:1;padding:12px;" id="btnConfirmSelect">
                <span class="btn-shimmer"></span>
                Confirm
              </button>
            </div>
          </div>
        </div>

        <!-- Detailed Problem Modal -->
        <div class="modal-overlay" id="psDetailModal" style="display:none;">
          <div class="modal-card ps-detail-modal" id="psDetailContent">
            <!-- Content injected dynamically -->
          </div>
        </div>

      </div>
    </div>`;
}

// Sample problem statements — replace with real ones when ready
const PROBLEM_STATEMENTS = [
  {
    id: 'PS1',
    track: 1,
    title: 'CivicShield — Tamper-Proof Welfare Disbursement Validation System',
    sdg: 'SDG 16 — Peace, Justice & Strong Institutions | SDG 1 — No Poverty',
    summary: `Build a Sequential Validation Engine — a cryptographically enforced pipeline that wraps every welfare transaction in a verification envelope before a single rupee moves.`,
    problemStatement: `You will build a Sequential Validation Engine — a cryptographically enforced pipeline that wraps every welfare transaction in a verification envelope before a single rupee moves. Every gate must be passed in order. Every failure must be logged. Every approval must be permanently recorded in a tamper-evident ledger. If the system detects fraud or tampering at any point, it freezes itself — automatically, immediately, and completely.

This is not a CRUD application with a fraud label on it. The integrity mechanisms must be real, verifiable, and demonstrably unbypassable.

Dataset : <a href="https://docs.google.com/spreadsheets/d/1JiplJvyJ5sjpTjqFJCgL43DzZCryiIYR/edit?gid=208810484#gid=208810484" target="_blank" style="color:var(--accent-3); text-decoration:underline;">CivicShield_Dataset.xlsx</a>`,
    background: `India's public welfare disbursement systems lose thousands of crores annually — not because funds are unavailable, but because the distribution pipeline has no integrity layer. The same identity claims benefits across multiple regions simultaneously. Cooling windows are gamed by automated scripts. Disbursement ledgers are quietly altered by insiders after the fact. Beneficiaries who died years ago continue receiving monthly payments as ghost entries in poorly maintained registries.

CivicShield is your mandate to fix this.`,
    features: [
      { name: 'Component 1 — Identity Hash Validator', desc: `Every Citizen_ID entering the system must be converted to a SHA-256 hash before any processing begins. The raw Citizen_ID must never be stored or logged anywhere in the pipeline after this point — only the hash travels through all downstream gates and ledger entries.

Your implementation must handle all of the following:
• Compute CitizenHash = SHA256(Citizen_ID + Salt) where Salt is a system-defined constant declared in your configuration. Store and use only the hash from this point forward.
• Before any transaction proceeds, check whether the incoming hash already exists in the active processing queue. If it does, reject immediately as a duplicate concurrent claim and log it with flag DUPLICATE_REJECTED.
• Implement replay attack detection — if the same CitizenHash submits an identical claim (same Scheme_Eligibility, same Scheme_Amount) within a 10-minute window of any previous attempt whether approved or rejected, reject it with flag REPLAY_DETECTED.` },
      { name: 'Component 2 — Three-Gate Sequential Verification Protocol', desc: `Every transaction must pass all three gates in strict order. The engine enforces this sequence — the UI cannot override it, skip a gate, or allow partial processing.

Gate 1 — Eligibility Verification: Look up the incoming CitizenHash against the loaded registry. A transaction passes Gate 1 only if all six conditions are true simultaneously: Citizen_ID maps to an existing record, Account_Status is exactly Active, Aadhaar_Linked is TRUE, Requested scheme matches exactly, Requested amount matches exactly, Claim_Count is <= 3.

Gate 2 — Budget Integrity Check: The system initializes with a fixed disbursement budget of ₹10,00,000. Budget is decremented only after full three-gate approval. If approving would reduce budget below ₹0, reject. When reaching ₹0, system auto-locks entirely.

Gate 3 — Frequency Abuse Detection: No citizen may receive an approved disbursement within 30 days of their Last_Claim_Date. On approval, update Last_Claim_Date.` },
      { name: 'Component 3 — Immutable Hash-Linked Ledger', desc: `Every transaction that completes full three-gate approval must be appended to a hash-linked ledger file where each record contains the hash of the record before it — making silent modification detectable.

Each ledger record must contain exactly these fields: TransactionID, Timestamp, CitizenHash, Scheme, Amount, Region_Code, Income_Tier, GatesPassed, PreviousHash, CurrentHash = SHA256(Timestamp + CitizenHash + Scheme + Amount + PreviousHash).

Integrity rules: After every append, run a full chain integrity check. If mismatch is found, system must freeze immediately. Ledger must be stored as JSON/CSV.` },
      { name: 'Component 4 — Automatic System Lock', desc: `The system must freeze itself without any human action under these three conditions:
1) Ledger hash chain mismatch detected during integrity check.
2) Budget reaches ₹0 after a final approved transaction.
3) Admin triggers Emergency Pause from the admin panel.

When frozen the system must: Block all incoming transaction requests immediately; Display freeze reason clearly; Log the freeze event; Require explicit admin unfreeze for ADMIN_PAUSED.` },
      { name: 'Component 5 — Kill-Switch Admin Panel', desc: `A real-time dashboard giving administrators full visibility and control — auto-refreshing every 5 seconds without page reload.

Must display live: System Status badge (ACTIVE, PAUSED, FROZEN, BUDGET_EXHAUSTED), Budget Remaining in ₹, Total transactions processed, Approval rate percentage, Last 10 transactions.

Must support: Emergency Pause, Resume (only if PAUSED), Tamper Report Download (JSON report when FROZEN), Registry Viewer.` }
    ],
    constraints: `• The system must be a web application with a backend — no frontend-only submissions.
• CivicShield_Dataset.xlsx must be loaded on startup — hardcoding citizen data instead of reading from the file disqualifies the submission.
• All SHA-256 operations must be implemented in your backend code — third-party fraud detection services are not permitted.
• The ledger must be stored as a human-readable JSON or CSV file so evaluators can tamper with it during TC-10.
• Raw Citizen_ID values must never appear in logs, ledger entries, or the admin panel — only CitizenHash.`,
    bonus: `• Role-Based Access: Two admin roles — Viewer (read-only dashboard) and Operator (can pause, resume, download tamper report). Unauthenticated access to any admin endpoint returns 401.
• Fraud Pattern Report: After every 10 transactions, auto-generate a summary showing the most common rejection reason, citizens with highest Claim_Count, and budget burn rate by Region_Code.
• Webhook Alert: When the system freezes for any reason, fire a webhook to a configurable URL with freeze reason, timestamp, last valid ledger hash, and Budget_Remaining.`
  },
  {
    id: 'PS2',
    track: 2,
    title: 'SheSafe — Women\'s Safety Companion',
    sdg: 'SDG 5 — Gender Equality | SDG 11 — Sustainable Cities & Communities',
    summary: `Build a comprehensive women's safety mobile or web application with six core features working together as a unified experience.`,
    problemStatement: `Build a fully functional women's safety mobile or web application with six core features working together as a unified experience. The app must be intuitive enough to use under stress, reliable enough to work in low-connectivity conditions, and discreet enough to not draw attention when discretion matters most.

Domain: Mobile Applications & Public Safety`,
    background: `In a moment of danger, unlocking a phone and navigating to an SOS button can be impossible. Yet most safety apps today are built around exactly that assumption — that a woman in danger has the time, calm, and freedom to interact with her phone.

SheSafe is built around the opposite assumption.

You will build a women's safety companion that works powerfully as a standalone app — and gets smarter when paired with a simple wearable. A woman walking home late shouldn't have to think about triggering help. The app should do the heavy lifting, and optionally, her body should do the rest.`,
    features: [
      { name: 'Feature 1 — SOS System', desc: `A one-tap SOS that a user can trigger instantly without unlocking the app or navigating any menus.
• Single large SOS button to send live GPS directly to emergency contacts via SMS.
• 5-second cancellation window.
• Discreet Mode: Disguise app as neutral screen (calculator/notes). Real app accessible via hidden gesture.
• Continuous location updates every 60 seconds until marked safe.
• Every trigger must be logged.` },
      { name: 'Feature 2 — Live Trip Sharing', desc: `A real-time journey monitoring system that keeps trusted contacts informed.
• User enters destination and starts a trip. App shares live GPS location link.
• Set expected arrival time. If not Marked Safe within 10 minutes of arrival, auto-alert contacts.
• The link must be openable on any browser without app installation.
• Trip history must be saved.` },
      { name: 'Feature 3 — Ride Verification', desc: `A quick vehicle logging system that creates a digital record of every ride taken.
• User enters vehicle reg number, vehicle type, and optional driver name.
• Instantly shared with emergency contacts via SMS with timestamp and current GPS.
• Ride Log saved locally. Manual "Share Ride" available during trip.` },
      { name: 'Feature 4 — Buddy System', desc: `A route-matching system that connects women traveling similar routes at similar times.
• Enter origin, destination, and approximate departure time.
• Match with registered users traveling the same route within a 30-minute window.
• In-app chat coordination once accepted.
• In-app alerts if bunny doesn't confirm safe arrival within 15 mins of ETA.` },
      { name: 'Feature 5 — Community Alert Board', desc: `A crowdsourced live map of reported incidents and unsafe zones.
• Report incidents with pins, incident type, and description.
• Color-coded pins visible on a live map.
• Reports auto-expire after 48 hours unless upvoted to confirm activity.
• Shows user current location next to pins.` },
      { name: 'Feature 6 — Safe Route Suggester', desc: `A routing system factoring in community-reported danger zones.
• Returns two options: fastest route and safest route.
• Safest route avoids active pins within a 200m radius.
• Displays a Safety Score (0 to 100) computed from alert pins.
• Routes auto-update if new community alerts are submitted.` }
    ],
    hardware: {
      components: `Arduino + Pulse Sensor + Vibration Sensor + Bluetooth Module (Optional)`,
      description: `The wearable monitors heart rate and sudden physical vibration simultaneously. If heart rate exceeds 120 BPM and vibration is detected within the same 10-second window, the wearable sends a Bluetooth signal to the app which auto-triggers SOS — no phone interaction required.

Integration requirements:
• Pair Wearable screen in app.
• Persistent indicator of wearable connection.
• Wearable SOS behaves identically to manual SOS.
• Displays warning if disconnected.`
    },
    constraints: `• The system must be a web application or a mobile app
• SMS sending must use a real SMS gateway (Twilio, Fast2SMS, or equivalent) — simulated or console-logged SMS alerts do not qualify
• GPS location must use the device's real location API — hardcoded or mocked coordinates do not qualify
• The tracking link shared with contacts must be openable on any browser without login`,
    bonus: `• Fake Call Feature: User can schedule a fake incoming call to their phone (with a configurable caller name) as a discreet exit strategy.
• Periodic Safe Check-in: App sends silent push notification every 30 mins during active trip to confirm safety.
• Offline SOS: If no internet connectivity, SOS falls back to direct SMS (without a tracking link) so the feature never fails completely.`
  },
  {
    id: 'PS3',
    track: 3,
    title: 'Orchestrix — Multi-Agent Research Intelligence Platform',
    sdg: 'SDG 4 — Quality Education | SDG 9 — Industry, Innovation & Infrastructure',
    summary: `Build a multi-agent AI platform where specialized agents collaborate autonomously to handle the full research pipeline.`,
    problemStatement: `Design and develop a fully functional Research Intelligence Platform built on a multi-agent architecture. Each agent has a defined role and responsibility. The Orchestrator must coordinate them intelligently based on the user's query — deciding which agents to invoke, in what order, and how to merge their outputs into a coherent result.

This is not a wrapper around a single LLM call. Agents must operate with clear separation of concern, and the orchestration logic must be demonstrably non-trivial.

Domain: Artificial Intelligence & Productivity`,
    background: `The modern research workflow is deeply fragmented. A researcher today juggles multiple tools — search engines, citation managers, spreadsheets, and note-taking apps — just to get from a research question to a structured insight. This overhead is particularly painful for students and early-stage researchers who lack institutional access to premium tools.

Orchestrix challenges you to eliminate that fragmentation entirely. You will build a multi-agent AI platform where specialized agents collaborate autonomously to handle the full research pipeline — from discovery to analysis to citation — all orchestrated by a central coordination layer.`,
    features: [
      { name: 'Agent 1 — Research Discovery Agent', desc: `Query real academic data sources (e.g., Semantic Scholar API, arXiv API, CrossRef, OpenAlex — no mocked datasets).
• Return title, authors, year, abstract, source URL, citation count.
• Results must be relevance-ranked using a scoring mechanism.
• Must handle pagination to fetch beyond the first page.` },
      { name: 'Agent 2 — Analysis Agent', desc: `Receives output from Discovery Agent and performs at least three analyses:
• Publication volume trend
• Top contributing authors/institutions
• Keyword/topic frequency
• Citation impact distribution
• Identification of emerging sub-topics
All analyses must be rendered as interactive visualizations in the UI.` },
      { name: 'Agent 3 — Citation Generator Agent', desc: `Accept any paper and generate formatted citations in at least two styles (APA, MLA, IEEE, Chicago).
• Must support bulk citation export (download as .txt or .bib file).
• Citation accuracy will be spot-checked.` },
      { name: 'Agent 4 — Summarization & Synthesis Agent', desc: `Generate a structured summary for any individual paper.
• Generate cross-paper synthesis when multiple papers are selected (identifying common themes, contradictions, or gaps).
• Must make live LLM calls, not use template-based string formatting.` },
      { name: 'Orchestrator System', desc: `A central layer coordinating agents based on execution plan.
• Support sequential and conditional execution.
• Orchestration logic must be visible to user (trace log, execution timeline).
• Agents must be modular.` },
      { name: 'Persistent Knowledge Dashboard', desc: `Store past queries, fetched papers, analyses, and summaries.
• Users can name a session, revisit, add notes, and compare two sessions side by side.
• Data must persist across reloads and sessions.` }
    ],
    constraints: `• The platform must be a web application (mobile is acceptable as an addition, not a substitute).
• No fully pre-built research platforms (e.g., ResearchRabbit, Elicit clones) may be used as your backend. You are building the intelligence layer.
• All external API keys must be submitted alongside the project or configurable via a .env file — hardcoded credentials will disqualify the submission.
• The application must be deployable and runnable by evaluators within 10 minutes using documented setup steps. Projects that fail to run will not be evaluated.`,
    bonus: `• Agent Conflict Resolution: Implement a resolution mechanism that surfaces conflicts to the user if Summarization and Analysis agents disagree.
• Scheduled Research Digest: Allow recurring queries that run automatically and notify users of new papers.`
  }
];

function initProblemSelection() {
  initNavbar();

  const RELEASE_DATE = new Date('2026-04-05T08:00:00+05:30');
  const psCountdown = document.getElementById('psCountdown');

  if (psCountdown) {
    const updateCountdown = () => {
      const now = new Date();
      const diff = RELEASE_DATE - now;

      if (diff <= 0) {
        window.location.reload();
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      psCountdown.textContent = `${days}d ${hours}h ${mins}m ${secs}s`;
    };

    updateCountdown();
    setInterval(updateCountdown, 1000);
    return;
  }

  let verifiedTeam = null;
  let selectedProblem = null;

  const btnVerify = document.getElementById('btnVerifyTeam');
  const teamInput = document.getElementById('psTeamName');
  const errEl = document.getElementById('psTeamName_err');
  const verifySection = document.getElementById('teamVerifySection');
  const problemsSection = document.getElementById('problemsSection');
  const teamInfoEl = document.getElementById('psTeamInfo');
  const modal = document.getElementById('psModal');
  const modalProblemName = document.getElementById('modalProblemName');
  const btnCancel = document.getElementById('btnCancelSelect');
  const btnConfirm = document.getElementById('btnConfirmSelect');

  const modalDetail = document.getElementById('psDetailModal');
  const detailContent = document.getElementById('psDetailContent');

  if (!btnVerify) return;

  btnVerify.addEventListener('click', async () => {
    const teamName = teamInput.value.trim();
    if (!teamName) {
      errEl.textContent = 'Team name is required';
      teamInput.classList.add('invalid');
      return;
    }

    btnVerify.textContent = 'Verifying...';
    btnVerify.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/registrations`);
      const result = await res.json();

      if (!result.success) throw new Error('Failed to fetch teams');

      const team = result.data.find(t =>
        t.teamName.toLowerCase() === teamName.toLowerCase() &&
        t.confirmed.toUpperCase() === 'TRUE'
      );

      if (!team) {
        errEl.textContent = 'Team not found or not yet confirmed. Please check spelling or contact organizers.';
        teamInput.classList.add('invalid');
        btnVerify.textContent = 'Verify Team';
        btnVerify.disabled = false;
        return;
      }

      verifiedTeam = team;
      verifySection.style.display = 'none';
      problemsSection.style.display = 'block';
      teamInfoEl.innerHTML = `
        <div class="ps-verified">
          <span class="ps-check">✓</span>
          <strong>${team.teamName}</strong> — ${team.college}
          <span class="ps-leader">Team Leader: ${team.participants[0]?.name || 'N/A'}</span>
        </div>`;

      // Render problem cards
      renderProblemCards(1, 'track1Cards');
      renderProblemCards(2, 'track2Cards');
      renderProblemCards(3, 'track3Cards');

    } catch (err) {
      errEl.textContent = 'Error verifying team: ' + err.message;
      btnVerify.textContent = 'Verify Team';
      btnVerify.disabled = false;
    }
  });

  function renderProblemCards(trackNum, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const problems = PROBLEM_STATEMENTS.filter(p => p.track === trackNum);
    container.innerHTML = problems.map(p => `
      <div class="ps-card" data-id="${p.id}">
        <div class="ps-card-id">${p.id}</div>
        <h4>${p.title}</h4>
        <p>${p.summary}</p>
        <div style="display:flex;gap:10px;margin-top:auto;">
          <button class="btn-details" style="flex:1;" data-id="${p.id}">View Full Details</button>
          <button class="ps-select-btn" style="flex:1;" data-id="${p.id}" data-title="${p.title}">
            Select
          </button>
        </div>
      </div>
    `).join('');

    // Add click handlers for selection
    container.querySelectorAll('.ps-select-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedProblem = { id: btn.dataset.id, title: btn.dataset.title };
        modalProblemName.textContent = `${selectedProblem.id}: ${selectedProblem.title}`;
        modal.style.display = 'flex';
      });
    });

    // Add click handlers for details
    container.querySelectorAll('.btn-details').forEach(btn => {
      btn.addEventListener('click', () => {
        const problem = PROBLEM_STATEMENTS.find(p => p.id === btn.dataset.id);
        if (problem) showProblemDetails(problem);
      });
    });
  }

  function showProblemDetails(p) {
    detailContent.innerHTML = `
      <div class="ps-detail-header">
        <span class="ps-detail-track-badge">Track ${p.track}</span>
        <h2>${p.title}</h2>
        <span class="ps-detail-sdg-tag">${p.sdg}</span>
      </div>
      <div class="ps-detail-body">
        <div class="ps-section">
          <div class="ps-section-title">
            <i class="fas fa-bullseye"></i> Problem Statement
          </div>
          <p class="ps-text" style="white-space: pre-line;">${p.problemStatement}</p>
        </div>

        <div class="ps-section">
          <div class="ps-section-title">
            <i class="fas fa-history"></i> Problem Background
          </div>
          <p class="ps-text" style="white-space: pre-line;">${p.background}</p>
        </div>

        <div class="ps-section">
          <div class="ps-section-title">
            <i class="fas fa-list-check"></i> Mandatory Components & Features
          </div>
          <div class="ps-feature-grid">
            ${p.features.map(f => `
              <div class="ps-feature-item">
                <span class="ps-feature-name">${f.name}</span>
                <p class="ps-feature-desc" style="white-space: pre-line; margin-top: 8px;">${f.desc}</p>
              </div>
            `).join('')}
          </div>
        </div>

        ${p.hardware ? `
        <div class="ps-section">
          <div class="ps-section-title">
            <i class="fas fa-microchip"></i> Hardware Add-on (Optional)
          </div>
          <div class="ps-hardware-box">
             <div class="ps-hardware-title">📟 Hardware Components</div>
             <p class="ps-text" style="font-size:0.95rem;">${p.hardware.components}</p>
             
             <div class="ps-hardware-title" style="margin-top:20px;">🛡️ What it does</div>
             <p class="ps-text" style="font-size:0.95rem; white-space: pre-line;">${p.hardware.description}</p>
          </div>
        </div>` : ''}

        ${p.constraints ? `
        <div class="ps-section">
          <div class="ps-section-title">
            <i class="fas fa-exclamation-triangle"></i> Constraints & Rules
          </div>
          <div class="ps-text" style="white-space: pre-line;">${p.constraints}</div>
        </div>` : ''}

        ${p.bonus ? `
        <div class="ps-section">
          <div class="ps-section-title">
            <i class="fas fa-star"></i> Bonus (Optional)
          </div>
          <div class="ps-text" style="white-space: pre-line;">${p.bonus}</div>
        </div>` : ''}
      </div>
      <div class="modal-footer">
        <button class="btn-outline" style="padding:12px 24px;" onclick="document.getElementById('psDetailModal').style.display='none'">Back</button>
        <button class="btn-primary" style="padding:12px 32px;" id="btnSelectFromDetail" data-id="${p.id}" data-title="${p.title}">
          <span class="btn-shimmer"></span>
          Select This Problem
        </button>
      </div>
    `;

    modalDetail.style.display = 'flex';

    // Handler for selection inside detail modal
    document.getElementById('btnSelectFromDetail').addEventListener('click', (e) => {
      modalDetail.style.display = 'none';
      selectedProblem = { id: e.target.dataset.id, title: e.target.dataset.title };
      modalProblemName.textContent = `${selectedProblem.id}: ${selectedProblem.title}`;
      modal.style.display = 'flex';
    });
  }

  btnCancel.addEventListener('click', () => {
    modal.style.display = 'none';
    selectedProblem = null;
  });

  btnConfirm.addEventListener('click', async () => {
    if (!selectedProblem || !verifiedTeam) return;

    btnConfirm.disabled = true;
    btnConfirm.textContent = 'Submitting...';

    try {
      const res = await fetch(`${API_BASE}/select-problem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamName: verifiedTeam.teamName,
          problemId: selectedProblem.id,
        }),
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.message || 'Failed to select problem');

      modal.style.display = 'none';
      problemsSection.innerHTML = `
        <div class="ps-success">
          <div class="success-icon" style="margin-bottom:20px;">✓</div>
          <h2>Problem Statement Selected!</h2>
          <p style="margin:12px 0;color:var(--text-secondary);">Your team <strong>${verifiedTeam.teamName}</strong> has selected:</p>
          <div class="ps-selected-problem">${selectedProblem.id}: ${selectedProblem.title}</div>
          <p style="margin-top:20px;color:var(--text-muted);font-size:0.9rem;">This has been recorded. Good luck on event day!</p>
          <a href="#/" class="btn-primary" style="display:inline-block;margin-top:24px;">Back to Home</a>
        </div>`;

    } catch (err) {
      alert('Error: ' + err.message);
      btnConfirm.disabled = false;
      btnConfirm.textContent = 'Confirm';
    }
  });
}
