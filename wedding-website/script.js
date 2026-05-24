/* ============================================
   Anna & Will Wedding Website — Scripts
   ============================================ */

(function () {
  'use strict';

  // ---------- Countdown Timer ----------
  const WEDDING_DATE = new Date('2026-09-19T16:30:00-04:00');

  function updateCountdown() {
    var now = new Date();
    var diff = WEDDING_DATE - now;

    if (diff <= 0) {
      document.getElementById('days').textContent = '0';
      document.getElementById('hours').textContent = '0';
      document.getElementById('minutes').textContent = '0';
      document.getElementById('seconds').textContent = '0';
      return;
    }

    var days = Math.floor(diff / (1000 * 60 * 60 * 24));
    var hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((diff % (1000 * 60)) / 1000);

    document.getElementById('days').textContent = days;
    document.getElementById('hours').textContent = hours;
    document.getElementById('minutes').textContent = minutes;
    document.getElementById('seconds').textContent = seconds;
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  // ---------- Navbar scroll effect ----------
  var navbar = document.getElementById('navbar');
  var lastScroll = 0;

  window.addEventListener('scroll', function () {
    var currentScroll = window.pageYOffset;
    if (currentScroll > 80) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    lastScroll = currentScroll;
  });

  // ---------- Mobile nav toggle ----------
  var navToggle = document.querySelector('.nav-toggle');
  var navLinks = document.querySelector('.nav-links');

  if (navToggle) {
    navToggle.addEventListener('click', function () {
      var isOpen = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close nav when clicking a link
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Close mobile nav on outside click
  document.addEventListener('click', function (e) {
    if (navLinks.classList.contains('open') &&
        !navLinks.contains(e.target) &&
        !navToggle.contains(e.target)) {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });

  // ---------- Smooth scroll for anchor links ----------
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#') return;
      var target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        var offset = navbar.offsetHeight + 10;
        var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

  // ---------- Scroll reveal animations ----------
  var revealElements = document.querySelectorAll(
    '.itinerary-day, .bio-card, .travel-card, .registry-card, .faq-item, .timeline-item, .story-text, .venue-text, .venue-video'
  );

  revealElements.forEach(function (el) {
    el.classList.add('reveal');
  });

  function checkReveal() {
    var triggerBottom = window.innerHeight * 0.88;
    revealElements.forEach(function (el) {
      var top = el.getBoundingClientRect().top;
      if (top < triggerBottom) {
        el.classList.add('visible');
      }
    });
  }

  window.addEventListener('scroll', checkReveal);
  window.addEventListener('load', checkReveal);

  // ---------- RSVP Form ----------
  var form = document.getElementById('rsvp-form');
  var successMessage = document.getElementById('rsvp-success');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Clear previous errors
      form.querySelectorAll('.error-message').forEach(function (el) {
        el.textContent = '';
      });
      form.querySelectorAll('.invalid').forEach(function (el) {
        el.classList.remove('invalid');
      });

      var isValid = true;

      // Validate name
      var nameInput = document.getElementById('rsvp-name');
      if (!nameInput.value.trim()) {
        document.getElementById('name-error').textContent = 'Please enter your name';
        nameInput.classList.add('invalid');
        isValid = false;
      }

      // Validate email
      var emailInput = document.getElementById('rsvp-email');
      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailInput.value.trim()) {
        document.getElementById('email-error').textContent = 'Please enter your email';
        emailInput.classList.add('invalid');
        isValid = false;
      } else if (!emailRegex.test(emailInput.value)) {
        document.getElementById('email-error').textContent = 'Please enter a valid email';
        emailInput.classList.add('invalid');
        isValid = false;
      }

      // Validate attendance
      var attendingSelect = document.getElementById('rsvp-attending');
      if (!attendingSelect.value) {
        document.getElementById('attending-error').textContent = 'Please select an option';
        attendingSelect.classList.add('invalid');
        isValid = false;
      }

      if (!isValid) {
        var firstError = form.querySelector('.invalid');
        if (firstError) firstError.focus();
        return;
      }

      // Collect form data
      var formData = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        attending: attendingSelect.value,
        guests: document.getElementById('rsvp-guests').value,
        dietary: document.getElementById('rsvp-dietary').value.trim(),
        events: Array.from(form.querySelectorAll('input[name="events"]:checked')).map(function(cb) { return cb.value; }),
        song: document.getElementById('rsvp-song').value.trim(),
        message: document.getElementById('rsvp-message').value.trim(),
        timestamp: new Date().toISOString()
      };

      // Log the RSVP (in production, this would send to a backend)
      console.log('RSVP Submitted:', formData);

      // Show success
      form.style.display = 'none';
      successMessage.hidden = false;
      successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  // ---------- Active nav link highlighting ----------
  var sections = document.querySelectorAll('section[id]');

  function highlightNav() {
    var scrollY = window.pageYOffset + navbar.offsetHeight + 50;
    sections.forEach(function (section) {
      var top = section.offsetTop;
      var height = section.offsetHeight;
      var id = section.getAttribute('id');
      var link = document.querySelector('.nav-links a[href="#' + id + '"]');
      if (link) {
        if (scrollY >= top && scrollY < top + height) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      }
    });
  }

  window.addEventListener('scroll', highlightNav);
})();
