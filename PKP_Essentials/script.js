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
  // This works because the seamless transition preserves the User Gesture.
  audio.play().then(markPlaying).catch(() => {
    // ── Attempt 2: try again on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
      audio.play().then(markPlaying).catch(markBlocked);
    }, { once: true });
  });

  // ── Global robust fallback: any click on the document starts the audio if blocked
  window.addEventListener('mousedown', () => {
    if (started) return;
    audio.play().then(markPlaying).catch(markBlocked);
  }, { once: true });

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
   THEME + PLAYLIST UNIFIED MANAGER
   ══════════════════════════════════════ */
(function() {
  const order = ['.v-about', '.v-work', '.v-contact'];
  let currentVinylLinkIndex = 0;
  
  const nav        = document.querySelector('.vinyl-nav');
  const record     = document.querySelector('.vinyl-record');
  const audio      = document.getElementById('bg-audio');
  const nextBtn    = document.getElementById('vinyl-next');
  const trackLabel = document.getElementById('vinyl-track-label');
  const vinylImg   = document.getElementById('vinyl-label-image');
  const triangle   = document.getElementById('palette-triangle');

  // ── UNIFIED THEME-SONG PAIRING CONFIGURATION ──
  const playlist = [
    { theme: 'busted',        label: 'Busted — A Present for Everyone',      src: 'Assets/She_Wants_to_be_me.mp3',       title: 'SHE WANTS TO BE ME',             img: 'Assets/Images/BUSTED_APFE.jpg' },
    { theme: 'zebrahead',     label: 'Zebrahead — MFZB',                     src: 'Assets/bg.mp3',                       title: 'INTO YOU',                      img: 'Assets/Images/ZH_MFZB.jpg' },
    { theme: '',              label: 'BLINK-182 — TOYPAJ',                   src: 'Assets/First_Date.mp3',            title: 'FIRST DATE',                  img: 'Assets/Images/BL182_TOPJ.jpg' },
    { theme: 'mcr',           label: 'MCR — Three Cheers for Sweet Revenge',  src: 'Assets/Im_Not_Okay_I_Promise.mp3',    title: "I'M NOT OKAY (I PROMISE)",      img: 'Assets/Images/MCR_TC.jpg' },
    { theme: 'linkinpark',    label: 'Linkin Park — Meteora',                src: 'Assets/Faint.mp3',                    title: 'FAINT',                         img: 'Assets/Images/LP_M.jpg' },
    { theme: 'avril lavigne', label: 'Avril Lavigne — Goodbye Lullaby',      src: 'Assets/Avril_Lavigne.mp3',            title: 'AVRIL LAVIGNE SONG',            img: 'Assets/Images/alt_bg.jpg' },
    { theme: 'greenday2',     label: 'Green Day — TRÉ!',                     src: 'Assets/Green_Day.mp3',                title: 'GREEN DAY SONG',                img: 'Assets/Images/alt_bg.jpg' },
    // ── BLANK TEMPLATE FOR USER TO ADD MORE PAIRS LATER ──
    { theme: 'template',      label: 'Band — Album Name',                     src: 'Assets/Template.mp3',                 title: 'TEMPLATE TITLE',                img: 'Assets/Images/alt_bg.jpg' }
  ];
  
  let trackIndex = 0;

  // Determine initial track index (randomized if coming from index.html)
  const urlParams = new URLSearchParams(window.location.search);
  const forceRandom = urlParams.get('random') === 'true';
  const cameFromIndex = (document.referrer && document.referrer.includes('index.html')) || forceRandom;
  if (cameFromIndex) {
    // Pick a random track from active ones (non-templates) to prevent loading error placeholders
    const activeIndices = playlist
      .map((t, i) => ({ src: t.src, idx: i }))
      .filter(t => !t.src.includes('Template.mp3') && !t.src.includes('Avril_Lavigne.mp3') && !t.src.includes('Green_Day.mp3'))
      .map(t => t.idx);
    
    if (activeIndices.length > 0) {
      trackIndex = activeIndices[Math.floor(Math.random() * activeIndices.length)];
    }
  }

  // Function to apply the theme and trigger the physical swap effects
  function applyTheme(themeName, triggerTransition = true) {
    // 1. Swap data-theme attribute on document element
    if (themeName) {
      document.documentElement.setAttribute('data-theme', themeName);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

    // 2. Trigger the premium theme-specific physical screen shake & flash transition
    if (triggerTransition) {
      triggerThemeTransition(themeName);
    }
  }

  // Helper to trigger custom transitions per theme
  function triggerThemeTransition(themeName) {
    // Clear previous classes
    document.body.classList.remove('theme-swapping');
    document.body.classList.forEach(className => {
      if (className.startsWith('swap-active-')) {
        document.body.classList.remove(className);
      }
    });

    // Determine the animation suffix class
    let suffix = 'blink';
    if (themeName === 'mcr') suffix = 'mcr';
    else if (themeName === 'linkinpark') suffix = 'linkinpark';
    else if (themeName === 'busted') suffix = 'busted';
    else if (themeName === 'zebrahead') suffix = 'zebrahead';
    else if (themeName === 'avril lavigne') suffix = 'avril-lavigne';
    else if (themeName === 'greenday2') suffix = 'greenday2';
    else if (themeName === '') suffix = 'blink';
    else suffix = 'blink'; // default fallback for templates or others

    // Force DOM reflow to restart animation
    void document.body.offsetWidth;

    // Trigger physical shake animation & color-specific overlay flash
    document.body.classList.add('theme-swapping');
    document.body.classList.add(`swap-active-${suffix}`);

    // Clean up animation classes once transition is complete (800ms)
    setTimeout(() => {
      document.body.classList.remove('theme-swapping');
      document.body.classList.remove(`swap-active-${suffix}`);
    }, 800);
  }

  function loadTrack(idx, autoplay) {
    const track = playlist[idx];
    if (!track) return;
    
    // Set audio source
    audio.src = track.src;
    audio.load();
    
    // Update labels and vinyl covers
    if (trackLabel) trackLabel.textContent = track.title;
    if (vinylImg) vinylImg.setAttribute('href', track.img);
    
    // Update theme to match the song (only trigger transitions if active play/swap)
    applyTheme(track.theme, autoplay);
    
    // Sync the palette triangle's tooltip/title
    if (triangle) {
      triangle.title = track.label;
    }

    if (autoplay) {
      audio.play().then(syncVinylMuteState).catch((err) => {
        console.warn("Autoplay failed or audio not loaded:", err);
      });
    }
  }

  // Skip to next track
  function nextTrack() {
    // Shuffle logic: pick a random track that isn't the current one
    let availableIndices = playlist.map((_, i) => i).filter(i => i !== trackIndex);
    trackIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    
    loadTrack(trackIndex, true);
    
    // Flash the record red on skip
    const svg = nav.querySelector('.vinyl-svg');
    if (svg) {
      svg.style.filter = 'hue-rotate(0deg) brightness(2) saturate(4)';
      setTimeout(() => { svg.style.filter = ''; }, 180);
    }
  }

  // Handle audio error (e.g. if the user hasn't replaced a template file yet)
  if (audio) {
    audio.addEventListener('error', (e) => {
      console.warn("Audio file failed to load:", audio.src);
      if (trackLabel) {
        trackLabel.textContent = `[MISSING: ${playlist[trackIndex].title}]`;
      }
    });
  }

  // Auto-advance when track ends
  audio.addEventListener('ended', () => {
    if (playlist.length > 1) nextTrack();
  });

  // Set initial track state (attempt autoplay if coming from index.html)
  if (playlist.length > 0) {
    loadTrack(trackIndex, cameFromIndex);
  }

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
      currentVinylLinkIndex = (currentVinylLinkIndex + 1) % order.length;
      showLink(currentVinylLinkIndex);
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

  if (record) record.style.cursor = 'pointer';
  if (nav) nav.style.cursor    = 'pointer';

  // ── PALETTE CYCLE — nav triangle click ──
  if (triangle) {
    function cycleTheme() {
      // Advance to next track (which will trigger loadTrack and apply the theme)
      trackIndex = (trackIndex + 1) % playlist.length;
      loadTrack(trackIndex, true);

      // Flashing animation on the triangle
      triangle.classList.remove('palette-flash');
      void triangle.offsetWidth;
      triangle.classList.add('palette-flash');
      triangle.addEventListener('animationend', () => triangle.classList.remove('palette-flash'), { once: true });
    }

    triangle.addEventListener('click', cycleTheme);
    triangle.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') cycleTheme(); });
  }

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
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1500);
});

/* Palette Cycle has been unified with the Vinyl Audio Player in the manager above to keep themes and tracks 100% in sync */;
