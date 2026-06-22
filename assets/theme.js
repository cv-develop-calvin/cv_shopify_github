/**
 * CS Flair - Artisan Jewelry Theme
 * Main JavaScript Module
 */
(function () {
  'use strict';

  /* ==========================================================================
     1. Navbar Scroll Effect
     Adds/removes .scrolled class on the header when user scrolls past 50px
     ========================================================================== */
  function initNavbarScroll() {
    var header = document.querySelector('[data-header]');
    if (!header) return;

    var SCROLL_THRESHOLD = 50;

    function handleScroll() {
      if (window.scrollY > SCROLL_THRESHOLD) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  /* ==========================================================================
     2. Scroll Reveal
     IntersectionObserver on .reveal elements - adds .visible when in view
     ========================================================================== */
  function initScrollReveal() {
    var revealElements = document.querySelectorAll('.reveal');
    if (!revealElements.length) return;

    if (!('IntersectionObserver' in window)) {
      revealElements.forEach(function (el) {
        el.classList.add('visible');
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    revealElements.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ==========================================================================
     3. Smooth Scroll
     All anchor links (a[href^="#"]) scroll smoothly to target
     ========================================================================== */
  function initSmoothScroll() {
    var anchorLinks = document.querySelectorAll('a[href^="#"]');

    anchorLinks.forEach(function (link) {
      link.addEventListener('click', function (e) {
        var href = this.getAttribute('href');
        if (href === '#' || href === '#0') return;

        var target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();

        var headerHeight = 0;
        var header = document.querySelector('[data-header]');
        if (header) {
          headerHeight = header.offsetHeight;
        }

        var targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });

        // Update URL hash without jumping
        if (history.pushState) {
          history.pushState(null, null, href);
        }
      });
    });
  }

  /* ==========================================================================
     4. Wishlist Toggle
     Click .product-wishlist buttons to toggle .active class and fill/unfill heart
     ========================================================================== */
  function initWishlistToggle() {
    var wishlistButtons = document.querySelectorAll('.product-wishlist');

    wishlistButtons.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();

        var isActive = this.classList.toggle('active');

        var heartSvg = this.querySelector('svg');
        if (heartSvg) {
          var heartPath = heartSvg.querySelector('path');
          if (heartPath) {
            if (isActive) {
              heartPath.setAttribute('fill', 'currentColor');
              heartPath.setAttribute('stroke', 'currentColor');
            } else {
              heartPath.setAttribute('fill', 'none');
              heartPath.setAttribute('stroke', 'currentColor');
            }
          }
        }

        // Dispatch custom event for other scripts to hook into
        var event = new CustomEvent('wishlist:toggle', {
          detail: {
            active: isActive,
            productId: this.getAttribute('data-product-id') || null,
            handle: this.getAttribute('data-product-handle') || null
          },
          bubbles: true
        });
        this.dispatchEvent(event);
      });
    });
  }

  /* ==========================================================================
     5. Announcement Bar Dismiss
     Close button hides bar, saves dismissed state to sessionStorage
     ========================================================================== */
  function initAnnouncementBar() {
    var STORAGE_KEY = 'csflair_announcement_dismissed';
    var announcementBar = document.querySelector('[data-announcement-bar]');
    var closeBtn = document.querySelector('[data-announcement-close]');

    if (!announcementBar) return;

    // Check dismissed state on load
    var isDismissed = sessionStorage.getItem(STORAGE_KEY);
    if (isDismissed === 'true') {
      announcementBar.setAttribute('aria-hidden', 'true');
      announcementBar.style.display = 'none';
      return;
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        announcementBar.setAttribute('aria-hidden', 'true');
        announcementBar.style.display = 'none';
        sessionStorage.setItem(STORAGE_KEY, 'true');

        // Dispatch event so layout can adjust
        var event = new CustomEvent('announcement:dismissed', { bubbles: true });
        document.dispatchEvent(event);
      });
    }
  }

  /* ==========================================================================
     6. Mobile Menu Toggle
     Hamburger button opens/closes mobile drawer overlay
     ========================================================================== */
  function initMobileMenu() {
    var menuToggle = document.querySelector('[data-mobile-menu-toggle]');
    var menuDrawer = document.querySelector('[data-mobile-menu-drawer]');
    var menuOverlay = document.querySelector('[data-mobile-menu-overlay]');
    var menuClose = document.querySelector('[data-mobile-menu-close]');
    var body = document.body;

    if (!menuToggle || !menuDrawer) return;

    function openMenu() {
      menuDrawer.classList.add('is-open');
      menuDrawer.setAttribute('aria-hidden', 'false');
      if (menuOverlay) {
        menuOverlay.classList.add('is-visible');
      }
      body.style.overflow = 'hidden';
      menuToggle.setAttribute('aria-expanded', 'true');

      // Trap focus inside drawer
      var firstFocusable = menuDrawer.querySelector(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }

    function closeMenu() {
      menuDrawer.classList.remove('is-open');
      menuDrawer.setAttribute('aria-hidden', 'true');
      if (menuOverlay) {
        menuOverlay.classList.remove('is-visible');
      }
      body.style.overflow = '';
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.focus();
    }

    menuToggle.addEventListener('click', function () {
      var isOpen = menuDrawer.classList.contains('is-open');
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    if (menuClose) {
      menuClose.addEventListener('click', closeMenu);
    }

    if (menuOverlay) {
      menuOverlay.addEventListener('click', closeMenu);
    }

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuDrawer.classList.contains('is-open')) {
        closeMenu();
      }
    });
  }

  /* ==========================================================================
     7. Newsletter Form
     Prevent default submit, show success message, hide form
     ========================================================================== */
  function initNewsletterForm() {
    var newsletterForms = document.querySelectorAll('[data-newsletter-form]');

    newsletterForms.forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();

        var emailInput = form.querySelector('input[type="email"]');
        var email = emailInput ? emailInput.value.trim() : '';

        // Basic email validation
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
          var errorEl = form.querySelector('[data-newsletter-error]');
          if (errorEl) {
            errorEl.style.display = 'block';
            errorEl.textContent = 'Please enter a valid email address.';
          }
          if (emailInput) {
            emailInput.focus();
          }
          return;
        }

        // Hide form and show success message
        var successEl = form.parentElement.querySelector('[data-newsletter-success]');
        if (successEl) {
          form.style.display = 'none';
          successEl.style.display = 'block';
        }

        // Dispatch custom event
        var event = new CustomEvent('newsletter:submit', {
          detail: { email: email },
          bubbles: true
        });
        form.dispatchEvent(event);
      });
    });
  }

  /* ==========================================================================
     8. Product Card Quick View Hover Effects
     Enhance product card interaction on hover
     ========================================================================== */
  function initProductCardEffects() {
    var productCards = document.querySelectorAll('[data-product-card]');

    if (!productCards.length) return;

    // Check for hover capability (non-touch devices)
    var hasHover = window.matchMedia('(hover: hover)').matches;

    productCards.forEach(function (card) {
      var quickViewBtn = card.querySelector('[data-quick-view]');
      var imageWrapper = card.querySelector('[data-product-image]');

      if (hasHover) {
        card.addEventListener('mouseenter', function () {
          card.classList.add('is-hovered');
          if (quickViewBtn) {
            quickViewBtn.setAttribute('aria-hidden', 'false');
          }
        });

        card.addEventListener('mouseleave', function () {
          card.classList.remove('is-hovered');
          if (quickViewBtn) {
            quickViewBtn.setAttribute('aria-hidden', 'true');
          }
        });
      }

      // Quick view button click
      if (quickViewBtn) {
        quickViewBtn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();

          var event = new CustomEvent('quickview:open', {
            detail: {
              productId: this.getAttribute('data-product-id') || null,
              productHandle: this.getAttribute('data-product-handle') || null
            },
            bubbles: true
          });
          this.dispatchEvent(event);
        });
      }

      // Image secondary reveal on hover
      if (imageWrapper) {
        var secondaryImage = imageWrapper.querySelector('[data-product-image-secondary]');
        if (secondaryImage && hasHover) {
          card.addEventListener('mouseenter', function () {
            secondaryImage.style.opacity = '1';
          });
          card.addEventListener('mouseleave', function () {
            secondaryImage.style.opacity = '0';
          });
        }
      }
    });
  }

  /* ==========================================================================
     Initialize All Modules
     ========================================================================== */
  document.addEventListener('DOMContentLoaded', function () {
    initNavbarScroll();
    initScrollReveal();
    initSmoothScroll();
    initWishlistToggle();
    initAnnouncementBar();
    initMobileMenu();
    initNewsletterForm();
    initProductCardEffects();
  });
})();
