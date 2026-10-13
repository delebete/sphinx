// ==UserScript==
// @name         Spotify 16x Auto-FastForward & Pure Mobile Shell
// @namespace    http://tampermonkey.net/
// @version      3.0
// @match        https://open.spotify.com/*
// @run-at       document_idle
// ==/UserScript==

(function() {
  'use strict';

  // --- 1. PREVENT ACCIDENTAL PINCH / DOUBLE-TAP ZOOMING ---
  function enforceMobileViewport() {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      document.head.appendChild(meta);
    }
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
  }
  enforceMobileViewport();
  document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });

  // --- 2. GIANT MOBILE TOUCH UI STYLES ---
  const shellStyles = `
    html, body {
      overflow: hidden !important;
      position: fixed !important;
      width: 100vw !important;
      height: 100vh !important;
      margin: 0 !important;
      padding: 0 !important;
      touch-action: pan-y !important;
      -webkit-text-size-adjust: 100% !important;
    }

    #sp-mobile-shell {
      position: fixed !important;
      inset: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background: #121212 !important;
      color: #ffffff !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      z-index: 2147483647 !important;
      display: flex !important;
      flex-direction: column !important;
      box-sizing: border-box !important;
      user-select: none !important;
      -webkit-user-select: none !important;
    }

    /* Giant Header */
    .sp-shell-header {
      padding: 24px 28px 12px 28px !important;
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      flex-shrink: 0 !important;
    }
    .sp-shell-header h1 {
      font-size: 38px !important;
      font-weight: 900 !important;
      letter-spacing: -1px !important;
      margin: 0 !important;
    }
    .sp-pill-ad {
      font-size: 18px !important;
      font-weight: 800 !important;
      padding: 8px 18px !important;
      border-radius: 24px !important;
      background: #e91429 !important;
      color: #fff !important;
      animation: shell-blink 0.8s infinite alternate !important;
    }
    .sp-pill-song {
      font-size: 18px !important;
      font-weight: 700 !important;
      padding: 8px 18px !important;
      border-radius: 24px !important;
      background: #1db954 !important;
      color: #000 !important;
    }
    @keyframes shell-blink {
      from { opacity: 0.6; }
      to { opacity: 1; }
    }

    /* Body Container */
    .sp-shell-body {
      flex: 1 !important;
      overflow-y: auto !important;
      padding: 10px 24px 220px 24px !important;
      -webkit-overflow-scrolling: touch !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
    }

    /* Mobile Hero Player Card */
    .sp-hero-card {
      width: 100% !important;
      max-width: 600px !important;
      background: linear-gradient(180deg, #242424 0%, #161616 100%) !important;
      border-radius: 28px !important;
      padding: 32px 24px !important;
      box-sizing: border-box !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      box-shadow: 0 16px 40px rgba(0,0,0,0.7) !important;
    }
    .sp-hero-img {
      width: 80vw !important;
      max-width: 420px !important;
      aspect-ratio: 1 / 1 !important;
      border-radius: 20px !important;
      object-fit: cover !important;
      box-shadow: 0 16px 40px rgba(0,0,0,0.8) !important;
      margin-bottom: 28px !important;
      background: #282828 !important;
    }
    .sp-hero-info {
      width: 100% !important;
      text-align: left !important;
      margin-bottom: 12px !important;
    }
    .sp-hero-title {
      font-size: 32px !important;
      font-weight: 800 !important;
      line-height: 1.25 !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      display: block !important;
      color: #ffffff !important;
    }
    .sp-hero-artist {
      font-size: 24px !important;
      font-weight: 500 !important;
      color: #b3b3b3 !important;
      margin-top: 8px !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      display: block !important;
    }

    /* Oversized Scrubber Bar & Timestamps */
    .sp-scrubber-box {
      width: 100% !important;
      margin: 20px 0 6px 0 !important;
      padding: 20px 0 !important; /* Huge tap & drag hit area */
      cursor: pointer !important;
      touch-action: none !important;
    }
    .sp-scrubber-rail {
      width: 100% !important;
      height: 12px !important;
      background: #404040 !important;
      border-radius: 6px !important;
      position: relative !important;
    }
    .sp-scrubber-fill {
      width: 0% !important;
      height: 100% !important;
      background: #1db954 !important;
      border-radius: 6px !important;
      position: relative !important;
    }
    .sp-scrubber-handle {
      position: absolute !important;
      right: -10px !important;
      top: -6px !important;
      width: 24px !important;
      height: 24px !important;
      background: #ffffff !important;
      border-radius: 50% !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.5) !important;
    }
    .sp-time-row {
      display: flex !important;
      justify-content: space-between !important;
      width: 100% !important;
      margin-top: 4px !important;
      font-size: 18px !important;
      font-weight: 600 !important;
      color: #a7a7a7 !important;
    }

    /* Bottom Dock (Controls + Tabs) */
    .sp-bottom-dock {
      position: absolute !important;
      bottom: 0 !important;
      left: 0 !important;
      right: 0 !important;
      background: linear-gradient(180deg, rgba(18,18,18,0) 0%, #000000 35%) !important;
      display: flex !important;
      flex-direction: column !important;
      padding-bottom: env(safe-area-inset-bottom, 14px) !important;
    }

    /* Giant Touch Buttons */
    .sp-dock-controls {
      display: flex !important;
      justify-content: space-evenly !important;
      align-items: center !important;
      padding: 16px 12px 24px 12px !important;
    }
    .sp-dock-controls button {
      background: transparent !important;
      border: none !important;
      color: #b3b3b3 !important;
      cursor: pointer !important;
      padding: 14px !important;
      min-width: 64px !important;
      min-height: 64px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      border-radius: 50% !important;
      position: relative !important;
      transition: transform 0.1s ease, color 0.15s ease !important;
      -webkit-tap-highlight-color: transparent !important;
    }
    .sp-dock-controls button:active {
      transform: scale(0.86) !important;
    }
    .sp-dock-controls button svg {
      width: 44px !important;
      height: 44px !important;
      fill: currentColor !important;
    }

    /* Active State Glow for Shuffle / Repeat */
    .sp-dock-controls button.is-active {
      color: #1db954 !important;
    }
    .sp-dock-controls button.is-active::after {
      content: '' !important;
      position: absolute !important;
      bottom: 6px !important;
      width: 6px !important;
      height: 6px !important;
      background: #1db954 !important;
      border-radius: 50% !important;
    }

    .sp-play-circle {
      background: #1db954 !important;
      color: #000000 !important;
      width: 90px !important;
      height: 90px !important;
      border-radius: 50% !important;
      box-shadow: 0 6px 24px rgba(29, 185, 84, 0.5) !important;
    }
    .sp-play-circle:active {
      transform: scale(0.92) !important;
    }
    .sp-play-circle svg {
      width: 42px !important;
      height: 42px !important;
      fill: #000000 !important;
    }

    /* Bottom Navigation Tabs */
    .sp-dock-tabs {
      height: 74px !important;
      background: #000000 !important;
      display: flex !important;
      justify-content: space-around !important;
      align-items: center !important;
      border-top: 1px solid #222222 !important;
    }
    .sp-tab {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      background: none !important;
      border: none !important;
      color: #b3b3b3 !important;
      font-size: 15px !important;
      font-weight: 700 !important;
      gap: 6px !important;
      cursor: pointer !important;
      flex: 1 !important;
      height: 100% !important;
      -webkit-tap-highlight-color: transparent !important;
    }
    .sp-tab svg {
      width: 32px !important;
      height: 32px !important;
      fill: currentColor !important;
    }
    .sp-tab.active {
      color: #ffffff !important;
    }
  `;

  const sheet = document.createElement('style');
  sheet.textContent = shellStyles;
  document.head.appendChild(sheet);

  // --- 3. AUDIO ENGINE & FAST-FORWARD ---
  let cachedMedia = null;
  function getMedia() {
    const el = document.querySelector('audio, video');
    if (el && el !== cachedMedia) cachedMedia = el;
    return cachedMedia;
  }

  function isAd() {
    if (navigator.mediaSession?.metadata) {
      const title = (navigator.mediaSession.metadata.title || '').toLowerCase();
      const artist = (navigator.mediaSession.metadata.artist || '').toLowerCase();
      if (title.includes('advertisement') || artist.includes('spotify')) return true;
    }
    const hasTrackLink = document.querySelector('[data-testid="context-item-link"], [data-testid="nowplaying-track-link"]');
    return !hasTrackLink;
  }

  function formatTime(secs) {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  // --- 4. RELIABLE SCRUBBING ENGINE ---
  let isDraggingScrubber = false;

  function executeSeek(percentage) {
    // 1. Try Spotify's internal desktop slider via simulated click
    const desktopProgress = document.querySelector('[data-testid="playback-progressbar"]');
    if (desktopProgress) {
      const rect = desktopProgress.getBoundingClientRect();
      const clickX = rect.left + (rect.width * percentage);
      const clickY = rect.top + (rect.height / 2);
      
      const evtDown = new MouseEvent('mousedown', { bubbles: true, clientX: clickX, clientY: clickY });
      const evtUp = new MouseEvent('mouseup', { bubbles: true, clientX: clickX, clientY: clickY });
      desktopProgress.dispatchEvent(evtDown);
      desktopProgress.dispatchEvent(evtUp);
    }

    // 2. Fallback to direct HTML5 media seek
    const media = getMedia();
    if (media && media.duration) {
      media.currentTime = media.duration * percentage;
    }
  }

  // --- 5. POLL STATE & UPDATE VISUAL INDICATORS ---
  function syncState() {
    const media = getMedia();
    if (!media) return;

    // Fast-Forward on Ads
    const ad = isAd();
    const targetSpeed = ad ? 16.0 : 1.0;
    if (media.playbackRate !== targetSpeed) {
      media.playbackRate = targetSpeed;
      media.defaultPlaybackRate = targetSpeed;
    }

    // Shell UI Elements
    const badge = document.getElementById('sp-shell-badge');
    const title = document.getElementById('sp-shell-title');
    const artist = document.getElementById('sp-shell-artist');
    const art = document.getElementById('sp-shell-art');
    const progress = document.getElementById('sp-shell-fill');
    const timeCurr = document.getElementById('sp-time-curr');
    const timeDur = document.getElementById('sp-time-dur');
    const playSvg = document.getElementById('sp-shell-playsvg');
    const btnShuf = document.getElementById('sp-btn-shuf');
    const btnRep = document.getElementById('sp-btn-rep');

    if (badge) {
      badge.innerText = ad ? '16x AD' : '1x SONG';
      badge.className = ad ? 'sp-pill-ad' : 'sp-pill-song';
    }

    if (navigator.mediaSession?.metadata) {
      const meta = navigator.mediaSession.metadata;
      if (title) title.innerText = meta.title || 'Playing';
      if (artist) artist.innerText = meta.artist || 'Spotify';
      if (art && meta.artwork?.length > 0) {
        art.src = meta.artwork[meta.artwork.length - 1].src;
      }
    }

    // Play/Pause icon sync
    if (playSvg) {
      if (media.paused) {
        playSvg.innerHTML = '<polygon points="8 6 26 16 8 26 8 6"></polygon>';
      } else {
        playSvg.innerHTML = '<rect x="8" y="6" width="6" height="20"></rect><rect x="18" y="6" width="6" height="20"></rect>';
      }
    }

    // Shuffle & Repeat Active States (reading desktop DOM aria attributes)
    const nativeShuf = document.querySelector('[data-testid="control-button-shuffle"]');
    if (nativeShuf && btnShuf) {
      const active = nativeShuf.getAttribute('aria-checked') === 'true';
      btnShuf.classList.toggle('is-active', active);
    }

    const nativeRep = document.querySelector('[data-testid="control-button-repeat"]');
    if (nativeRep && btnRep) {
      const repState = nativeRep.getAttribute('aria-checked');
      btnRep.classList.toggle('is-active', repState === 'true' || repState === 'mixed');
    }

    // Progress Bar & Time
    if (!isDraggingScrubber && media.duration) {
      const pct = (media.currentTime / media.duration) * 100;
      if (progress) progress.style.width = `${pct}%`;
      if (timeCurr) timeCurr.innerText = formatTime(media.currentTime);
      if (timeDur) timeDur.innerText = formatTime(media.duration);
    }
  }

  setInterval(syncState, 200);

  // --- 6. CONTROLLER TRIGGERS ---
  function clickDesktop(testId) {
    const el = document.querySelector(`[data-testid="${testId}"]`);
    if (el) el.click();
    setTimeout(syncState, 50);
  }

  function mountShell() {
    if (document.getElementById('sp-mobile-shell')) return;

    const root = document.body || document.documentElement;
    if (!root) return;

    const shell = document.createElement('div');
    shell.id = 'sp-mobile-shell';
    shell.innerHTML = `
      <div class="sp-shell-header">
        <h1>Now Playing</h1>
        <span id="sp-shell-badge" class="sp-pill-song">1x SONG</span>
      </div>

      <div class="sp-shell-body">
        <div class="sp-hero-card">
          <img id="sp-shell-art" class="sp-hero-img" src="" alt="Album Art" />
          <div class="sp-hero-info">
            <span id="sp-shell-title" class="sp-hero-title">Connecting...</span>
            <span id="sp-shell-artist" class="sp-hero-artist">Spotify</span>
          </div>

          <!-- Interactive Scrubber -->
          <div class="sp-scrubber-box" id="sp-scrub-box">
            <div class="sp-scrubber-rail" id="sp-rail">
              <div class="sp-scrubber-fill" id="sp-shell-fill">
                <div class="sp-scrubber-handle"></div>
              </div>
            </div>
          </div>
          <div class="sp-time-row">
            <span id="sp-time-curr">0:00</span>
            <span id="sp-time-dur">0:00</span>
          </div>
        </div>
      </div>

      <div class="sp-bottom-dock">
        <div class="sp-dock-controls">
          <button id="sp-btn-shuf" title="Shuffle">
            <svg viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>
          </button>
          <button id="sp-btn-prev" title="Previous">
            <svg viewBox="0 0 24 24"><path d="M6 6h2.5v12H6zm3.5 6l9 6.5V5.5z"/></svg>
          </button>
          <button id="sp-btn-play" class="sp-play-circle" title="Play/Pause">
            <svg id="sp-shell-playsvg" viewBox="0 0 32 32"><polygon points="8 6 26 16 8 26 8 6"></polygon></svg>
          </button>
          <button id="sp-btn-next" title="Next">
            <svg viewBox="0 0 24 24"><path d="M5.5 18.5l9-6.5-9-6.5v13zM15.5 6H18v12h-2.5z"/></svg>
          </button>
          <button id="sp-btn-rep" title="Repeat">
            <svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>
          </button>
        </div>

        <nav class="sp-dock-tabs">
          <button class="sp-tab active" onclick="window.location.href='/'">
            <svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
            <span>Home</span>
          </button>
          <button class="sp-tab" onclick="window.location.href='/search'">
            <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            <span>Search</span>
          </button>
          <button class="sp-tab" onclick="window.location.href='/collection/playlists'">
            <svg viewBox="0 0 24 24"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z"/></svg>
            <span>Your Library</span>
          </button>
        </nav>
      </div>
    `;

    root.appendChild(shell);

    // Event attachments
    document.getElementById('sp-btn-play')?.addEventListener('click', () => clickDesktop('control-button-playpause'));
    document.getElementById('sp-btn-next')?.addEventListener('click', () => clickDesktop('control-button-skip-forward'));
    document.getElementById('sp-btn-prev')?.addEventListener('click', () => clickDesktop('control-button-skip-back'));
    document.getElementById('sp-btn-shuf')?.addEventListener('click', () => clickDesktop('control-button-shuffle'));
    document.getElementById('sp-btn-rep')?.addEventListener('click', () => clickDesktop('control-button-repeat'));

    // Drag-and-Tap Scrubber Handlers
    const scrubBox = document.getElementById('sp-scrub-box');
    const rail = document.getElementById('sp-rail');
    const fill = document.getElementById('sp-shell-fill');

    function updateFromPointer(e) {
      const rect = rail.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      fill.style.width = `${ratio * 100}%`;
      return ratio;
    }

    scrubBox.addEventListener('pointerdown', (e) => {
      isDraggingScrubber = true;
      scrubBox.setPointerCapture(e.pointerId);
      const ratio = updateFromPointer(e);
      const media = getMedia();
      if (media?.duration) {
        document.getElementById('sp-time-curr').innerText = formatTime(media.duration * ratio);
      }
    });

    scrubBox.addEventListener('pointermove', (e) => {
      if (!isDraggingScrubber) return;
      const ratio = updateFromPointer(e);
      const media = getMedia();
      if (media?.duration) {
        document.getElementById('sp-time-curr').innerText = formatTime(media.duration * ratio);
      }
    });

    scrubBox.addEventListener('pointerup', (e) => {
      if (!isDraggingScrubber) return;
      const ratio = updateFromPointer(e);
      executeSeek(ratio);
      setTimeout(() => { isDraggingScrubber = false; }, 150);
    });
  }

  const mountLoop = setInterval(() => {
    mountShell();
    if (document.getElementById('sp-mobile-shell')) clearInterval(mountLoop);
  }, 250);
})();