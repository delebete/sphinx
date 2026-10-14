// ==UserScript==
// @name         Spotify 16x Auto-FastForward & Pure Mobile Shell
// @namespace    http://tampermonkey.net/
// @version      5.0
// @match        https://open.spotify.com/*
// @run-at       document_idle
// ==/UserScript==

(function() {
  'use strict';

  // --- 1. HARD-ENFORCE DESKTOP MODE & DISABLE ZOOM PINCH ---
  function lockViewportAndDesktop() {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      document.head.appendChild(meta);
    }
    // Set explicit target density and kill pinch-zoom
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';

    // Set cookie/storage hints Spotify checks for desktop mode
    try {
      localStorage.setItem('sp-desktop-mode', 'true');
      document.cookie = "sp_dc_desk=1; path=/; domain=.spotify.com";
    } catch(e) {}
  }
  lockViewportAndDesktop();
  document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });

  // --- 2. COLOSSAL TOUCH UI STYLES ---
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
      background: #000000 !important;
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
      padding: 30px 32px 10px 32px !important;
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      flex-shrink: 0 !important;
    }
    .sp-shell-header h1 {
      font-size: 50px !important;
      font-weight: 900 !important;
      margin: 0 !important;
      letter-spacing: -1.5px !important;
    }
    .sp-pill-ad {
      font-size: 26px !important;
      font-weight: 800 !important;
      padding: 12px 26px !important;
      border-radius: 30px !important;
      background: #e91429 !important;
      color: #fff !important;
      animation: shell-blink 0.8s infinite alternate !important;
    }
    .sp-pill-song {
      font-size: 26px !important;
      font-weight: 800 !important;
      padding: 12px 26px !important;
      border-radius: 30px !important;
      background: #1db954 !important;
      color: #000 !important;
    }
    @keyframes shell-blink {
      from { opacity: 0.5; }
      to { opacity: 1; }
    }

    /* Body Container */
    .sp-shell-body {
      flex: 1 !important;
      overflow-y: auto !important;
      padding: 10px 20px 380px 20px !important; /* Space for the bottom panel */
      -webkit-overflow-scrolling: touch !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
    }

    .sp-hero-card {
      width: 100% !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      box-sizing: border-box !important;
    }

    /* MASSIVE ALBUM COVER */
    .sp-hero-img {
      width: 94vw !important;
      max-width: 800px !important;
      aspect-ratio: 1 / 1 !important;
      border-radius: 36px !important;
      object-fit: cover !important;
      box-shadow: 0 24px 60px rgba(0,0,0,0.95) !important;
      margin-bottom: 32px !important;
      background: #181818 !important;
    }

    .sp-hero-info {
      width: 94vw !important;
      max-width: 800px !important;
      text-align: left !important;
      margin-bottom: 16px !important;
    }
    .sp-hero-title {
      font-size: 52px !important;
      font-weight: 900 !important;
      line-height: 1.15 !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      display: block !important;
      color: #ffffff !important;
    }
    .sp-hero-artist {
      font-size: 38px !important;
      font-weight: 600 !important;
      color: #a7a7a7 !important;
      margin-top: 10px !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      display: block !important;
    }

    /* MASSIVE SCRUBBER TIMELINE */
    .sp-scrubber-box {
      width: 94vw !important;
      max-width: 800px !important;
      margin: 20px 0 4px 0 !important;
      padding: 30px 0 !important;
      cursor: pointer !important;
      touch-action: none !important;
    }
    .sp-scrubber-rail {
      width: 100% !important;
      height: 28px !important;
      background: #333333 !important;
      border-radius: 14px !important;
      position: relative !important;
    }
    .sp-scrubber-fill {
      width: 0% !important;
      height: 100% !important;
      background: #1db954 !important;
      border-radius: 14px !important;
      position: relative !important;
    }
    .sp-scrubber-handle {
      position: absolute !important;
      right: -28px !important;
      top: -14px !important;
      width: 56px !important;
      height: 56px !important;
      background: #ffffff !important;
      border-radius: 50% !important;
      box-shadow: 0 6px 18px rgba(0,0,0,0.9) !important;
    }
    .sp-time-row {
      display: flex !important;
      justify-content: space-between !important;
      width: 94vw !important;
      max-width: 800px !important;
      margin-top: 6px !important;
      font-size: 36px !important;
      font-weight: 800 !important;
      color: #888888 !important;
    }

    /* DOCKED BOTTOM CONTROL SECTION */
    .sp-bottom-dock {
      position: absolute !important;
      bottom: 0 !important;
      left: 0 !important;
      right: 0 !important;
      background: linear-gradient(180deg, rgba(0,0,0,0) 0%, #000000 20%) !important;
      display: flex !important;
      flex-direction: column !important;
      padding-bottom: env(safe-area-inset-bottom, 20px) !important;
    }

    /* COLOSSAL CONTROLS */
    .sp-dock-controls {
      display: flex !important;
      justify-content: space-evenly !important;
      align-items: center !important;
      padding: 20px 14px 34px 14px !important;
    }
    .sp-dock-controls button {
      background: transparent !important;
      border: none !important;
      color: #b3b3b3 !important;
      cursor: pointer !important;
      padding: 20px !important;
      min-width: 110px !important;
      min-height: 110px !important;
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
      width: 64px !important;
      height: 64px !important;
      fill: currentColor !important;
    }

    /* ACTIVE GLOWS FOR SHUFFLE / REPEAT */
    .sp-dock-controls button.is-active {
      color: #1db954 !important;
    }
    .sp-dock-controls button.is-active svg {
      fill: #1db954 !important;
      filter: drop-shadow(0 0 10px rgba(29, 185, 84, 0.9)) !important;
    }
    .sp-dock-controls button.is-active::after {
      content: '' !important;
      position: absolute !important;
      bottom: 10px !important;
      width: 12px !important;
      height: 12px !important;
      background: #1db954 !important;
      border-radius: 50% !important;
    }

    /* MONUMENTAL PLAY / PAUSE BUTTON (180px) */
    .sp-play-circle {
      background: #1db954 !important;
      color: #000000 !important;
      width: 180px !important;
      height: 180px !important;
      border-radius: 50% !important;
      box-shadow: 0 10px 40px rgba(29, 185, 84, 0.6) !important;
    }
    .sp-play-circle:active {
      transform: scale(0.92) !important;
    }
    .sp-play-circle svg {
      width: 80px !important;
      height: 80px !important;
      fill: #000000 !important;
    }

    /* BOTTOM TABS */
    .sp-dock-tabs {
      height: 110px !important;
      background: #000000 !important;
      display: flex !important;
      justify-content: space-around !important;
      align-items: center !important;
      border-top: 2px solid #1a1a1a !important;
    }
    .sp-tab {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      background: none !important;
      border: none !important;
      color: #888888 !important;
      font-size: 24px !important;
      font-weight: 800 !important;
      gap: 8px !important;
      cursor: pointer !important;
      flex: 1 !important;
      height: 100% !important;
      -webkit-tap-highlight-color: transparent !important;
    }
    .sp-tab svg {
      width: 48px !important;
      height: 48px !important;
      fill: currentColor !important;
    }
    .sp-tab.active {
      color: #ffffff !important;
    }
  `;

  const sheet = document.createElement('style');
  sheet.textContent = shellStyles;
  document.head.appendChild(sheet);

  // --- 3. HARDWARE SEEK ENGINE ---
  function getMedia() {
    return document.querySelector('audio, video');
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

  function directSpotifySeek(percentage) {
    const nativeBar = document.querySelector('[data-testid="playback-progressbar"]');
    if (nativeBar) {
      const rect = nativeBar.getBoundingClientRect();
      const targetX = rect.left + (rect.width * percentage);
      const targetY = rect.top + (rect.height / 2);

      const down = new PointerEvent('pointerdown', { bubbles: true, cancelable: true, clientX: targetX, clientY: targetY, pointerId: 1 });
      const move = new PointerEvent('pointermove', { bubbles: true, cancelable: true, clientX: targetX, clientY: targetY, pointerId: 1 });
      const up = new PointerEvent('pointerup', { bubbles: true, cancelable: true, clientX: targetX, clientY: targetY, pointerId: 1 });

      nativeBar.dispatchEvent(down);
      window.dispatchEvent(move);
      window.dispatchEvent(up);
    }

    const media = getMedia();
    if (media && media.duration) {
      try {
        media.currentTime = media.duration * percentage;
      } catch (err) {}
    }
  }

  // --- 4. STATE SYNC (METADATA + 16x SPEED + ACTIVE INDICATORS) ---
  let isDraggingScrubber = false;

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

    if (playSvg) {
      if (media.paused) {
        playSvg.innerHTML = '<polygon points="14 10 42 26 14 42 14 10"></polygon>';
      } else {
        playSvg.innerHTML = '<rect x="12" y="10" width="10" height="32"></rect><rect x="30" y="10" width="10" height="32"></rect>';
      }
    }

    // Toggle active state classes on Shuffle & Repeat
    const nativeShuf = document.querySelector('[data-testid="control-button-shuffle"]');
    if (nativeShuf && btnShuf) {
      const isAria = nativeShuf.getAttribute('aria-checked') === 'true';
      const isClass = nativeShuf.classList.contains('active') || getComputedStyle(nativeShuf).color.includes('29, 185, 84');
      btnShuf.classList.toggle('is-active', isAria || isClass);
    }

    const nativeRep = document.querySelector('[data-testid="control-button-repeat"]');
    if (nativeRep && btnRep) {
      const repVal = nativeRep.getAttribute('aria-checked');
      const isRepAria = repVal === 'true' || repVal === 'mixed';
      const isRepClass = getComputedStyle(nativeRep).color.includes('29, 185, 84');
      btnRep.classList.toggle('is-active', isRepAria || isRepClass);
    }

    if (!isDraggingScrubber && media.duration) {
      const pct = (media.currentTime / media.duration) * 100;
      if (progress) progress.style.width = `${pct}%`;
      if (timeCurr) timeCurr.innerText = formatTime(media.currentTime);
      if (timeDur) timeDur.innerText = formatTime(media.duration);
    }
  }

  setInterval(syncState, 150);

  function clickDesktop(testId) {
    const el = document.querySelector(`[data-testid="${testId}"]`);
    if (el) {
      el.click();
      setTimeout(syncState, 40);
    }
  }

  // --- 5. MOUNT OVERLAY SHELL ---
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
            <svg viewBox="0 0 24 24"><path d="M6 6h3.5v12H6zm4 6l10 7.5V4.5z"/></svg>
          </button>
          <button id="sp-btn-play" class="sp-play-circle" title="Play/Pause">
            <svg id="sp-shell-playsvg" viewBox="0 0 52 52"><polygon points="14 10 42 26 14 42 14 10"></polygon></svg>
          </button>
          <button id="sp-btn-next" title="Next">
            <svg viewBox="0 0 24 24"><path d="M4 19.5l10-7.5-10-7.5v15zM14.5 6h3.5v12h-3.5z"/></svg>
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

    // Event hooks
    document.getElementById('sp-btn-play')?.addEventListener('click', () => clickDesktop('control-button-playpause'));
    document.getElementById('sp-btn-next')?.addEventListener('click', () => clickDesktop('control-button-skip-forward'));
    document.getElementById('sp-btn-prev')?.addEventListener('click', () => clickDesktop('control-button-skip-back'));
    document.getElementById('sp-btn-shuf')?.addEventListener('click', () => clickDesktop('control-button-shuffle'));
    document.getElementById('sp-btn-rep')?.addEventListener('click', () => clickDesktop('control-button-repeat'));

    // Giant Scrubber Touch Handlers
    const scrubBox = document.getElementById('sp-scrub-box');
    const rail = document.getElementById('sp-rail');
    const fill = document.getElementById('sp-shell-fill');

    function calculateRatio(e) {
      const rect = rail.getBoundingClientRect();
      const x = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
      return Math.max(0, Math.min(1, (x - rect.left) / rect.width));
    }

    scrubBox.addEventListener('pointerdown', (e) => {
      isDraggingScrubber = true;
      scrubBox.setPointerCapture(e.pointerId);
      const ratio = calculateRatio(e);
      fill.style.width = `${ratio * 100}%`;
      const media = getMedia();
      if (media?.duration) {
        document.getElementById('sp-time-curr').innerText = formatTime(media.duration * ratio);
      }
    });

    scrubBox.addEventListener('pointermove', (e) => {
      if (!isDraggingScrubber) return;
      const ratio = calculateRatio(e);
      fill.style.width = `${ratio * 100}%`;
      const media = getMedia();
      if (media?.duration) {
        document.getElementById('sp-time-curr').innerText = formatTime(media.duration * ratio);
      }
    });

    scrubBox.addEventListener('pointerup', (e) => {
      if (!isDraggingScrubber) return;
      const ratio = calculateRatio(e);
      directSpotifySeek(ratio);
      setTimeout(() => { isDraggingScrubber = false; }, 200);
    });
  }

  const mountLoop = setInterval(() => {
    mountShell();
    if (document.getElementById('sp-mobile-shell')) clearInterval(mountLoop);
  }, 200);
})();