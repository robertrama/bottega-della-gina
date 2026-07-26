/* La Bottega della Gina — main interactions */
(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Footer year ---- */
  var yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Mobile nav ---- */
  var hamburger = document.getElementById('hamburger');
  var mobileNav = document.getElementById('mobile-nav');
  var mainContent = document.getElementById('main');
  var footerContent = document.querySelector('.site-footer');
  var lastFocusedNav = null;

  function openMobileNav() {
    lastFocusedNav = document.activeElement;
    mobileNav.hidden = false;
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    /* Hide the rest of the page from assistive tech and keyboard focus
       while the full-screen panel is open — it's the only reachable content. */
    if (mainContent) mainContent.setAttribute('inert', '');
    if (footerContent) footerContent.setAttribute('inert', '');

    if (!prefersReducedMotion && typeof gsap !== 'undefined') {
      gsap.fromTo(mobileNav, { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
      gsap.fromTo(mobileNav.querySelectorAll('li, .btn'), { opacity: 0, y: 14 }, {
        opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', stagger: 0.05, delay: 0.08
      });
    }

    var firstLink = mobileNav.querySelector('a');
    if (firstLink) firstLink.focus();
  }

  function closeMobileNav() {
    if (mobileNav.hidden) return;
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (mainContent) mainContent.removeAttribute('inert');
    if (footerContent) footerContent.removeAttribute('inert');

    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      mobileNav.hidden = true;
      if (lastFocusedNav) lastFocusedNav.focus();
    }

    if (!prefersReducedMotion && typeof gsap !== 'undefined') {
      gsap.to(mobileNav, { opacity: 0, y: -16, duration: 0.25, ease: 'power2.in', onComplete: finish });
      /* Safety net: same reasoning as the hero entrance in premium.js — if the
         tab is backgrounded mid-close, rAF stalls and onComplete never fires,
         which would leave the page stuck with scroll locked. */
      setTimeout(finish, 1200);
    } else {
      finish();
    }
  }

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', function () {
      var isOpen = hamburger.getAttribute('aria-expanded') === 'true';
      if (isOpen) { closeMobileNav(); } else { openMobileNav(); }
    });

    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMobileNav);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !mobileNav.hidden) closeMobileNav();
    });
  }

  /* ---- Smooth-scroll offset for sticky header ---- */
  var header = document.getElementById('site-header');
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href').slice(1);
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      var offset = (header ? header.offsetHeight : 0) + 12;
      var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      closeMobileNav && closeMobileNav();
      history.replaceState(null, '', '#' + id);
    });
  });

  /* ---- Scroll reveal animations (GSAP + ScrollTrigger) ---- */
  function initReveal() {
    if (prefersReducedMotion || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add('js-reveal-ready');

    var groups = {};
    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      var section = el.closest('section') || document.body;
      if (section.id === 'hero') return; /* hero entrance is handled by premium.js */
      var key = section.id || 'default';
      groups[key] = groups[key] || [];
      groups[key].push(el);
    });

    Object.keys(groups).forEach(function (key) {
      gsap.to(groups[key], {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power2.out',
        stagger: 0.08,
        scrollTrigger: {
          trigger: groups[key][0],
          start: 'top 85%',
          once: true
        }
      });
    });

    /* Subtle hero parallax */
    var heroImg = document.querySelector('.hero-media img');
    if (heroImg) {
      gsap.to(heroImg, {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });
    }

    /* Gallery stagger-in */
    gsap.utils.toArray('.gallery-item').forEach(function (item, i) {
      gsap.to(item, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        delay: (i % 4) * 0.05,
        ease: 'power2.out',
        scrollTrigger: { trigger: item, start: 'top 92%', once: true }
      });
    });
  }

  /* Hero entrance (split-text, Ken Burns, eyebrow rule) lives in premium.js */

  /* ---- Lightbox gallery ---- */
  var GALLERY_COUNT = 15;
  function galleryPath(i, ext) {
    var n = String(i + 1).padStart(2, '0');
    return 'assets/img/gallery/gallery-' + n + '.' + ext;
  }

  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightbox-img');
  var lightboxClose = document.getElementById('lightbox-close');
  var lightboxPrev = document.getElementById('lightbox-prev');
  var lightboxNext = document.getElementById('lightbox-next');
  var currentIndex = 0;
  var lastFocused = null;

  function openLightbox(index) {
    currentIndex = ((index % GALLERY_COUNT) + GALLERY_COUNT) % GALLERY_COUNT;
    lightboxImg.src = galleryPath(currentIndex, 'jpg');
    lightboxImg.alt = 'Foto della bottega, immagine ' + (currentIndex + 1);
    lastFocused = document.activeElement;
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    lightboxClose.focus();
  }

  function closeLightbox() {
    lightbox.hidden = true;
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }

  document.querySelectorAll('.gallery-item').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (window.BDG_GALLERY_DRAG && window.BDG_GALLERY_DRAG.moved) return;
      openLightbox(parseInt(btn.getAttribute('data-index'), 10) || 0);
    });
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener('click', function () { openLightbox(currentIndex - 1); });
  if (lightboxNext) lightboxNext.addEventListener('click', function () { openLightbox(currentIndex + 1); });

  if (lightbox) {
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (!lightbox || lightbox.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') openLightbox(currentIndex - 1);
    if (e.key === 'ArrowRight') openLightbox(currentIndex + 1);
  });

  /* ---- Newsletter form ---- */
  var form = document.getElementById('newsletter-form');
  if (form) {
    var emailInput = document.getElementById('newsletter-email');
    var errorEl = document.getElementById('newsletter-error');
    var successEl = document.getElementById('newsletter-success');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim());

      if (!isValidEmail) {
        errorEl.hidden = false;
        emailInput.focus();
        return;
      }

      errorEl.hidden = true;
      /*
        Nessun endpoint di invio configurato: qui si simula il successo lato client.
        Collegare Mailchimp/Brevo aggiornando l'attributo action del form in index.html
        e rimuovere/adattare questo preventDefault una volta collegato il servizio reale.
      */
      successEl.hidden = false;
      form.reset();
    });

    emailInput.addEventListener('input', function () {
      if (!errorEl.hidden) errorEl.hidden = true;
    });
  }

  /* ---- Init ---- */
  window.addEventListener('load', function () {
    initReveal();
  });
})();
