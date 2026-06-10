/* ══════════════════════════════════════
   AUDIO — AUTOPLAY SYNCED WITH INTRO
   ══════════════════════════════════════
   Attempt immediate autoplay at t=0 so beat 1
   lines up with "UNO." at 0.1s.
   If browser blocks it, the overlay click
   and toggle button both serve as fallback.
   ══════════════════════════════════════ */
(function() {
  const audio     = document.getElementById('bg-audio');
  const toggleBtn = document.getElementById('audio-toggle');
  const label     = toggleBtn.querySelector('.audio-label');
  const overlay   = document.querySelector('.intro-overlay');

  audio.volume = 0.75;
  audio.currentTime = 0;
  let started = false;
  let muted   = false;

  function markPlaying() {
    started = true;
    label.textContent = 'NOW PLAYING';
    toggleBtn.classList.remove('muted');
  }

  function markBlocked() {
    started = false;
    label.textContent = 'CLICK TO PLAY';
    toggleBtn.classList.add('muted');
  }

  // ── Attempt 1: fire immediately on script execution (t=0)
  // Works when the page was reached via a user click (e.g. from corporate page)
  audio.play().then(markPlaying).catch(() => {
    // ── Attempt 2: try again the moment the DOM is fully ready
    // Sometimes helps on mobile where the audio element needs
    // the full document to be parsed before play() works
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        audio.play().then(markPlaying).catch(markBlocked);
      }, { once: true });
    } else {
      markBlocked();
    }
  });

  // ── Fallback: first touch/click anywhere on the intro overlay
  if (overlay) {
    overlay.addEventListener('pointerdown', () => {
      if (started) return;
      audio.currentTime = 0;
      audio.play().then(markPlaying).catch(markBlocked);
    }, { once: true });
  }

  // ── Toggle button: start if not yet started, otherwise mute/unmute
  toggleBtn.addEventListener('click', () => {
    if (!started) {
      audio.currentTime = 0;
      audio.play().then(markPlaying).catch(markBlocked);
      return;
    }
    muted = !muted;
    audio.muted = muted;
    toggleBtn.classList.toggle('muted', muted);
    label.textContent = muted ? 'MUTED' : 'NOW PLAYING';
  });
})();

/* ══════════════════════════════════════
   FORM SUBMIT
   ══════════════════════════════════════ */
function handleSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector('.btn-send');
  const orig = btn.textContent;
  btn.textContent = '✓ Got it!';
  btn.style.background = 'var(--paper)';
  btn.style.color = 'var(--ink)';
  btn.style.animation = 'none';
  setTimeout(() => {
    btn.textContent = orig;
    btn.style.background = '';
    btn.style.color = '';
    btn.style.animation = '';
    e.target.reset();
  }, 3000);
}

/* ══════════════════════════════════════
   VINYL NAV CYCLE + MUTE + NEXT SONG
   ══════════════════════════════════════ */
(function() {
  const order = ['.v-about', '.v-work', '.v-contact'];
  let current = 0;
  const nav        = document.querySelector('.vinyl-nav');
  const record     = document.querySelector('.vinyl-record');
  const audio      = document.getElementById('bg-audio');
  const nextBtn    = document.getElementById('vinyl-next');
  const trackLabel = document.getElementById('vinyl-track-label');

  // ── PLAYLIST — add your .mp3 filenames here later ──
  const playlist = [
    { src: 'Assets/bg.mp3', title: 'BG TRACK 1' },
    { src: 'Assets/The_Rock_Show.mp3', title: 'TRACK 2' },
    { src: 'Assets/Im_Not_Okay_I_Promise.mp3', title: 'TRACK 3' },
    { src: 'Assets/She_Wants_to_be_me.mp3', title: 'TRACK 4' },
    { src: 'Assets/Faint.mp3', title: 'TRACK 5' },
  ];
  let trackIndex = 0;

  function loadTrack(idx, autoplay) {
    const track = playlist[idx];
    audio.src = track.src;
    audio.load();
    if (trackLabel) trackLabel.textContent = track.title;
    if (autoplay) {
      audio.play().then(syncVinylMuteState).catch(() => {});
    }
  }

  function nextTrack() {
    trackIndex = (trackIndex + 1) % playlist.length;
    loadTrack(trackIndex, true);
    // Flash the record red on skip
    const svg = nav.querySelector('.vinyl-svg');
    if (svg) {
      svg.style.filter = 'hue-rotate(0deg) brightness(2) saturate(4)';
      setTimeout(() => { svg.style.filter = ''; }, 180);
    }
  }

  // Auto-advance when a track ends (only meaningful with multiple tracks)
  audio.addEventListener('ended', () => {
    if (playlist.length > 1) nextTrack();
  });

  // Set initial label
  if (trackLabel) trackLabel.textContent = playlist[0].title;

  function showLink(idx) {
    order.forEach((sel, i) => {
      const el = document.querySelector(sel);
      if (i === idx) el.classList.add('active');
      else el.classList.remove('active');
    });
  }
  showLink(0);

  function syncVinylMuteState() {
    const isMuted = !audio || audio.muted || audio.paused;
    nav.classList.toggle('vinyl-muted', isMuted);
    nav.dataset.tooltip = isMuted ? 'CLICK TO PLAY' : 'CLICK TO MUTE';
  }

  nav.addEventListener('click', function(e) {
    if (e.target.classList.contains('v-link')) return;
    if (e.target === nextBtn || nextBtn.contains(e.target)) return; // handled separately

    if (e.target === record || record.contains(e.target)) {
      if (!audio) return;
      if (audio.paused) {
        audio.play().then(syncVinylMuteState).catch(() => {});
      } else {
        audio.muted = !audio.muted;
        syncVinylMuteState();
      }
    } else {
      current = (current + 1) % order.length;
      showLink(current);
    }
  });

  nextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    nextTrack();
  });

  if (audio) {
    audio.addEventListener('play',         syncVinylMuteState);
    audio.addEventListener('pause',        syncVinylMuteState);
    audio.addEventListener('volumechange', syncVinylMuteState);
  }

  record.style.cursor = 'pointer';
  nav.style.cursor    = 'pointer';

  syncVinylMuteState();
})();


/* ══════════════════════════════════════
   MAGNETIC BUTTONS
   ══════════════════════════════════════ */
(function() {
  const magnetEls = document.querySelectorAll('.btn, .btn-send, .sell-out-btn');
  magnetEls.forEach(el => {
    el.addEventListener('mousemove', function(e) {
      const rect = el.getBoundingClientRect();
      const cx   = rect.left + rect.width  / 2;
      const cy   = rect.top  + rect.height / 2;
      const dx   = (e.clientX - cx) * 0.32;
      const dy   = (e.clientY - cy) * 0.32;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    el.addEventListener('mouseleave', function() {
      el.style.transform = '';
    });
  });
})();


/* ══════════════════════════════════════
   SCROLL REVEAL (IntersectionObserver)
   ══════════════════════════════════════ */
(function() {
  const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(el => obs.observe(el));
})();

/* ══════════════════════════════════════
   PUNK NAVBAR SCROLL SPY
   ══════════════════════════════════════ */
(function() {
  const navLinks = document.querySelectorAll('.punk-nav-links a');
  const sections = [
    document.getElementById('top'),
    document.getElementById('about'),
    document.getElementById('work'),
    document.getElementById('contact'),
  ].filter(Boolean);

  function onScroll() {
    let current = sections[0];
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 80) current = sec;
    });
    navLinks.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + current.id);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ══════════════════════════════════════
   RANDOM IDLE GLITCH
   ══════════════════════════════════════ */
(function() {
  function randomGlitch() {
    const glitchables = document.querySelectorAll('.r-letter, .section-title, .nav-stamp');
    if (!glitchables.length) return;
    const el = glitchables[Math.floor(Math.random() * glitchables.length)];
    const origTransform = el.style.transform;
    const origFilter    = el.style.filter;
    el.style.filter    = 'hue-rotate(180deg) invert(1)';
    el.style.transform = (origTransform || '') + ' skewX(15deg) translateX(4px)';
    setTimeout(() => {
      el.style.filter    = origFilter;
      el.style.transform = origTransform;
    }, 80);
    // Schedule next
    setTimeout(randomGlitch, 1500 + Math.random() * 4000);
  }
  setTimeout(randomGlitch, 2500);
})();

/* ══════════════════════════════════════
   EXPLOSION SCATTER
   ══════════════════════════════════════ */
const revertBtn = document.getElementById('revert-btn');
revertBtn.addEventListener('click', () => {
  document.body.style.overflow = 'hidden';
  document.body.classList.add('explosion-active');
  const elementsToScatter = document.querySelectorAll('.proj-card, .stamp, .zine-box, .torn-ticket, .sticker-badge, .sticker-pin, .hero-left, .hero-pin, .vinyl-nav, .logo-float, .about-photo-wrap, .about-text-col, .contact-left, .contact-form, .sell-out-btn, .section-label, .featured-row, footer');
  elementsToScatter.forEach(el => {
    const xDist    = (Math.random() - 0.5) * 200;
    const yDist    = (Math.random() - 0.5) * 200;
    const rotation = (Math.random() - 0.5) * 1080;
    const scale    = Math.random() * 1.5 + 0.2;
    el.style.transition = 'transform 1.2s cubic-bezier(0.1, 0.8, 0.2, 1), opacity 0.8s ease-out';
    el.style.transform  = `translate(${xDist}vw, ${yDist}vh) rotate(${rotation}deg) scale(${scale})`;
    el.style.opacity    = '0';
  });
  setTimeout(() => { window.location.href = 'index.html'; }, 1500);
});

/* ══════════════════════════════════════
   PALETTE CYCLE — nav triangle click
   ══════════════════════════════════════ */
(function() {
  const triangle = document.getElementById('palette-triangle');
  if (!triangle) return;

  const palettes = [
    { theme: '',           label: 'BLINK-182 — TOYPAJ'                        },
    { theme: 'mcr',        label: 'MCR — Three Cheers for Sweet Revenge'       },
    { theme: 'bfs',        label: 'Bowling for Soup — Drunk Enough to Dance'   },
    { theme: 'linkinpark', label: 'Linkin Park — Meteora'                    },
    { theme: 'avril lavigne',  label: 'Avril Lavigne — Goodbye Lullaby'             },
    { theme: 'greenday2',  label: 'Green Day — TRÉ!'                        },
  ];
  let current = 0;

  function cycle() {
    current = (current + 1) % palettes.length;
    const p = palettes[current];

    if (p.theme) {
      document.documentElement.setAttribute('data-theme', p.theme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

    // Update tooltip so user knows which palette is active
    triangle.title = p.label;

    triangle.classList.remove('palette-flash');
    void triangle.offsetWidth;
    triangle.classList.add('palette-flash');
    triangle.addEventListener('animationend', () => triangle.classList.remove('palette-flash'), { once: true });
  }

  triangle.addEventListener('click', cycle);
  triangle.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') cycle(); });
})();
