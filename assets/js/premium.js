/* La Bottega della Gina — premium interactions layer
   Hero cinematic entrance, storia reveal, animated counters,
   gallery filmstrip (drag + focus), magnetic buttons. */
(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGsap = function () { return typeof window.gsap !== 'undefined'; };

  window.BDG_GALLERY_DRAG = { moved: false };

  /* ---------------------------------------------------------------------
     Hero cinematic entrance
  --------------------------------------------------------------------- */
  function initHeroCinematic() {
    var hero = document.getElementById('hero');
    if (!hero) return;

    var rule = hero.querySelector('.eyebrow-rule');
    var eyebrowText = hero.querySelector('.eyebrow-wrap .eyebrow');
    var titleSpan = hero.querySelector('.hero-title span');
    var titleEm = hero.querySelector('.hero-title em');
    var subtitle = hero.querySelector('.hero-subtitle');
    var actions = hero.querySelector('.hero-actions');
    var rating = hero.querySelector('.hero-rating');
    var heroImg = hero.querySelector('.hero-media img');

    if (!hasGsap()) {
      /* No GSAP available: ensure content is simply visible */
      return;
    }

    if (prefersReducedMotion) {
      gsap.set([eyebrowText, titleSpan, titleEm, subtitle, actions, rating], { opacity: 1, y: 0, filter: 'none' });
      if (rule) gsap.set(rule, { width: '48px' });
      return;
    }

    /* If the tab loads hidden (opened in the background from a share link,
       an OS that froze the page, etc.) requestAnimationFrame never ticks, so
       a GSAP timeline never advances — show the final state immediately
       instead of leaving the headline/CTA stuck at opacity 0. */
    if (document.hidden) {
      gsap.set(rule, { width: '48px' });
      gsap.set([eyebrowText, titleSpan, titleEm, subtitle, actions, rating], { opacity: 1, y: 0, filter: 'none' });
      if (heroImg) gsap.set(heroImg, { scale: 1 });
      return;
    }

    gsap.set(rule, { width: 0 });
    gsap.set(eyebrowText, { opacity: 0, y: 16 });
    gsap.set([titleSpan, titleEm], { opacity: 0, y: 34, filter: 'blur(14px)' });
    gsap.set([subtitle, actions, rating], { opacity: 0, y: 22 });

    var tl = gsap.timeline({ delay: 0.15 });
    tl.to(rule, { width: '48px', duration: 0.7, ease: 'power2.out' })
      .to(eyebrowText, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '<0.05')
      .to(titleSpan, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: 'power3.out' }, '-=0.25')
      .to(titleEm, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: 'power3.out' }, '-=0.72')
      .to(subtitle, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '-=0.55')
      .to(actions, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, '-=0.5')
      .to(rating, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.35');

    /* Ken Burns slow zoom-out, independent of the scroll-linked parallax in main.js */
    if (heroImg) {
      gsap.fromTo(heroImg, { scale: 1.14 }, { scale: 1, duration: 6, ease: 'power2.out' });
    }

    /* Safety net: rAF-driven tweens don't advance while the tab is hidden
       (backgrounded, minimized, OS-throttled). If the entrance hasn't
       finished a few seconds after it should have, force it to completion
       so the hero content is never left stuck invisible. */
    setTimeout(function () {
      if (tl.progress() < 1) tl.progress(1);
    }, 4000);
  }

  /* ---------------------------------------------------------------------
     Storia — subtle fade-in + gentle zoom-out on the portrait photo
  --------------------------------------------------------------------- */
  function initStoriaReveal() {
    var media = document.getElementById('storia-media');
    if (!media || !hasGsap() || typeof ScrollTrigger === 'undefined') return;

    var mainImg = media.querySelector('.reveal-frame img');
    var smallImg = media.querySelector('.storia-media-small img');
    if (!mainImg) return;

    if (prefersReducedMotion) {
      gsap.set(mainImg, { opacity: 1, scale: 1 });
      if (smallImg) gsap.set(smallImg, { opacity: 1, y: 0 });
      return;
    }

    gsap.set(mainImg, { opacity: 0, scale: 1.06 });
    gsap.to(mainImg, {
      opacity: 1,
      scale: 1,
      duration: 1,
      ease: 'power2.out',
      scrollTrigger: { trigger: media, start: 'top 85%', once: true }
    });

    if (smallImg) {
      gsap.set(smallImg, { opacity: 0, y: 40 });
      gsap.to(smallImg, {
        opacity: 1, y: 24, duration: 0.8, ease: 'power2.out',
        scrollTrigger: { trigger: media, start: 'top 70%', once: true }
      });
    }
  }

  /* ---------------------------------------------------------------------
     Animated stat counters
  --------------------------------------------------------------------- */
  function initCounters() {
    var counters = document.querySelectorAll('.stat-count');
    if (!counters.length) return;

    counters.forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-count')) || 0;
      var suffix = el.getAttribute('data-suffix') || '';

      if (prefersReducedMotion || !hasGsap() || typeof ScrollTrigger === 'undefined') {
        el.textContent = target + suffix;
        return;
      }

      var proxy = { val: 0 };
      ScrollTrigger.create({
        trigger: el,
        start: 'top 90%',
        once: true,
        onEnter: function () {
          gsap.to(proxy, {
            val: target,
            duration: 1.4,
            ease: 'power2.out',
            onUpdate: function () { el.textContent = Math.round(proxy.val) + suffix; }
          });
        }
      });
    });
  }

  /* ---------------------------------------------------------------------
     Generic horizontal filmstrip — drag-to-scroll, arrows, progress bar,
     optional discovery hint and optional per-item focus state. Shared by
     the photo gallery and the reviews carousel below.
  --------------------------------------------------------------------- */
  function initFilmstrip(opts) {
    var viewport = document.querySelector(opts.viewport);
    var track = document.querySelector(opts.track);
    var prevBtn = opts.prev ? document.querySelector(opts.prev) : null;
    var nextBtn = opts.next ? document.querySelector(opts.next) : null;
    var progressBar = opts.progressBar ? document.querySelector(opts.progressBar) : null;
    if (!viewport || !track) return;

    /* Progress bar tied to horizontal scroll position */
    function updateProgress() {
      var max = track.scrollWidth - viewport.clientWidth;
      var ratio = max > 0 ? viewport.scrollLeft / max : 0;
      if (progressBar) {
        var pct = Math.max(8, ratio * 100);
        progressBar.style.width = pct + '%';
      }
    }
    viewport.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();

    /* One-time desktop discovery hint: the horizontal filmstrip isn't an
       obvious drag-to-scroll pattern on desktop the way a native touch swipe
       is on mobile, so nudge fine-pointer visitors once, then remember not
       to show it again. */
    if (opts.hint) {
      var hint = document.querySelector(opts.hint);
      if (hint && isFinePointer) {
        var HINT_KEY = opts.hintKey;
        var alreadySeen;
        try { alreadySeen = localStorage.getItem(HINT_KEY); } catch (e) { alreadySeen = null; }

        if (!alreadySeen) {
          var showTimer = setTimeout(function () { hint.classList.add('is-visible'); }, 900);
          var dismissed = false;
          var dismissHint = function () {
            if (dismissed) return;
            dismissed = true;
            clearTimeout(showTimer);
            hint.classList.remove('is-visible');
            try { localStorage.setItem(HINT_KEY, '1'); } catch (e) { /* storage unavailable */ }
          };
          viewport.addEventListener('scroll', dismissHint, { passive: true, once: true });
          viewport.addEventListener('pointerdown', dismissHint, { once: true });
        }
      }
    }

    if (prevBtn) prevBtn.addEventListener('click', function () {
      viewport.scrollBy({ left: -viewport.clientWidth * 0.8, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
    if (nextBtn) nextBtn.addEventListener('click', function () {
      viewport.scrollBy({ left: viewport.clientWidth * 0.8, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });

    /* Drag-to-scroll (mouse only; touch keeps native momentum scrolling) */
    if (isFinePointer) {
      var dragState = opts.dragState || { moved: false };
      var isDown = false, startX = 0, startScroll = 0, moved = 0;

      viewport.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'touch') return;
        isDown = true; moved = 0;
        startX = e.clientX;
        startScroll = viewport.scrollLeft;
        viewport.classList.add('is-dragging');
      });

      window.addEventListener('pointermove', function (e) {
        if (!isDown) return;
        var dx = e.clientX - startX;
        moved = Math.max(moved, Math.abs(dx));
        viewport.scrollLeft = startScroll - dx;
      });

      function endDrag() {
        if (!isDown) return;
        isDown = false;
        viewport.classList.remove('is-dragging');
        dragState.moved = moved > 6;
        setTimeout(function () { dragState.moved = false; }, 0);
      }
      window.addEventListener('pointerup', endDrag);
      window.addEventListener('pointercancel', endDrag);
    }

    /* Focus state as each item nears the center of the viewport */
    if (opts.focusItemSelector && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          entry.target.classList.toggle('is-focused', entry.isIntersecting);
        });
      }, { root: viewport, threshold: 0.6 });

      track.querySelectorAll(opts.focusItemSelector).forEach(function (item) { io.observe(item); });
    }
  }

  function initGalleryFilmstrip() {
    initFilmstrip({
      viewport: '.gallery-viewport',
      track: '#gallery-track',
      prev: '#gallery-prev',
      next: '#gallery-next',
      progressBar: '#gallery-progress-bar',
      hint: '#gallery-hint',
      hintKey: 'bdg-gallery-hint-seen',
      focusItemSelector: '.gallery-item',
      dragState: window.BDG_GALLERY_DRAG
    });
  }

  function initReviewsFilmstrip() {
    initFilmstrip({
      viewport: '.reviews-viewport',
      track: '#reviews-track',
      prev: '#reviews-prev',
      next: '#reviews-next',
      progressBar: '#reviews-progress-bar'
    });
  }

  /* ---------------------------------------------------------------------
     Magnetic buttons (desktop, fine pointer, motion allowed)
  --------------------------------------------------------------------- */
  function initMagneticButtons() {
    if (!isFinePointer || prefersReducedMotion || !hasGsap()) return;

    document.querySelectorAll('.btn').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var dx = e.clientX - (rect.left + rect.width / 2);
        var dy = e.clientY - (rect.top + rect.height / 2);
        gsap.to(btn, { x: dx * 0.25, y: dy * 0.35, duration: 0.3, ease: 'power2.out' });
      });
      btn.addEventListener('mouseleave', function () {
        gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'power3.out' });
      });
    });
  }

  /* ---------------------------------------------------------------------
     Init
  --------------------------------------------------------------------- */
  function boot() {
    initHeroCinematic();
    initGalleryFilmstrip();
    initReviewsFilmstrip();
    initMagneticButtons();

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
      initStoriaReveal();
      initCounters();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
