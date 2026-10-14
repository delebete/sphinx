// ==UserScript==
// @name         Spotify 16x Auto-FastForward & Pure Mobile Shell
// @namespace    http://tampermonkey.net/
// @version      4.0
// @match        https://open.spotify.com/*
// @run-at       document_idle
// ==/UserScript==

(function() {
  'use strict';

  // --- 1. HARD DISABLE BROWSER PINCH / ZOOM ---
  function enforceViewport() {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      document.head.appendChild(meta);
    }
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
  }
  enforceViewport();
  document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });

  // --- 2. MASSIVE TOUCH UI STYLES ---
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
      padding: 24px 24px 8px 24px !important;
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      flex-shrink: 0 !important;
    }
    .sp-shell-header h1 {
      font-size: 38px !important;
      font-weight: 900 !important;
      margin: 0 !important;
    }
    .sp-pill-ad {
      font-size: 20px !important;
      font-weight: 800 !important;
      padding: 8px 18px !important;
      border-radius: 20px !important;
      background: #e91429 !important;
      color: #fff !important;
      animation: shell-blink 0.8s infinite alternate !important;
    }
    .sp-pill-song {
      font-size: 20px !important;
      font-weight: 800 !important;
      padding: 8px 18px !important;
      border-radius: 20px !important;
      background: #1db954 !important;
      color: #000 !important;
    }
    @keyframes shell-blink {
      from { opacity: 0.5; }
      to { opacity: 1; }
    }

    /* Scrollable Container with Massive Artwork */
    .sp-shell-body {
      flex: 1 !important;
      overflow-y: auto !important;
      padding: 8px 16px 270px 16px !important;
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

    /* GIGANTIC EDGE-TO-EDGE ARTWORK */
    .sp-hero-img {
      width: 92vw !important;
      max-width: 500px !important;
      aspect-ratio: 1 / 1 !important;
      border-radius: 24px !important;
      object-fit: cover !important;
      box-shadow: 0 20px 50px rgba(0,0,0,0.9) !important;
      margin-bottom: 24px !important;
      background: #181818 !important;
    }

    .sp-hero-info {
      width: 92vw !important;
      max-width: 500px !important;
      text-align: left !important;
      margin-bottom: 12px !important;
    }
    .sp-hero-title {
      font-size: 34px !important;
      font-weight: 900 !important;
      line-height: 1.2 !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      display: block !important;
      color: #ffffff !important;
    }
    .sp-hero-artist {
      font-size: 26px !important;
      font-weight: 600 !important;
      color: #a7a7a7 !important;
      margin-top: 6px !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      display: block !important;
    }

    /* MASSIVE INTERACTIVE TIMELINE */
    .sp-scrubber-box {
      width: 92vw !important;
      max-width: 500px !important;
      margin: 16px 0 0 0 !important;
      padding: 24px 0 !important;
      cursor: pointer !important;
      touch-action: none !important;
    }
    .sp-scrubber-rail {
      width: 100% !important;
      height: 18px !important;
      background: #333333 !important;
      border-radius: 9px !important;
      position: relative !important;
    }
    .sp-scrubber-fill {
      width: 0% !important;
      height: 100% !important;
      background: #1db954 !important;
      border-radius: 9px !important;
      position: relative !important;
    }
    .sp-scrubber-handle {
      position: absolute !important;
      right: -18px !important;
      top: -9px !important;
      width: 36px !important;
      height: 36px !important;
      background: #ffffff !important;
      border-radius: 50% !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.8) !important;
    }
    .sp-time-row {
      display: flex !important;
      justify-content: space-between !important;
      width: 92vw !important;
      max-width: 500px !important;
      margin-top: 2px !important;
      font-size: 24px !important;
      font-weight: 700 !important;
      color: #888888 !important;
    }

    /* FIXED BOTTOM SECTION */
    .sp-bottom-dock {
      position: absolute !important;
      bottom: 0 !important;
      left: 0 !important;
      right: 0 !important;
      background: linear-gradient(180deg, rgba(0,0,0,0) 0%, #000000 25%) !important;
      display: flex !important;
      flex-direction: column !important;
      padding-bottom: env(safe-area-inset-bottom, 16px) !important;
    }

    /* HUGE CONTROLS ROW */
    .sp-dock-controls {
      display: flex !important;
      justify-content: space-evenly !important;
      align-items: center !important;
      padding: 16px 12px 28px 12px !important;
    }
    .sp-dock-controls button {
      background: transparent !important;
      border: none !important;
      color: #b3b3b3 !important;
      cursor: pointer !important;
      padding: 16px !important;
      min-width: 76px !important;
      min-height: 76px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      border-radius: 50% !important;
      position: relative !important;
      transition: transform 0.1s ease, color 0.15s ease !important;
      -webkit-tap-highlight-color: transparent !important;
    }
    .sp-dock-controls button:active {
      transform: scale(0.85) !important;
    }
    .sp-dock-controls button svg {
      width: 54px !important;
      height: 54px !important;
      fill: currentColor !important;
    }

    /* SHUFFLE / REPEAT ACTIVE STYLES (BRIGHT GREEN + GLOW + DOT) */
    .sp-dock-controls button.is-active {
      color: #1db954 !important;
    }
    .sp-dock-controls button.is-active svg {
      fill: #1db954 !important;
      filter: drop-shadow(0 0 6px rgba(29, 185, 84, 0.8)) !important;
    }
    .sp-dock-controls button.is-active::after {
      content: '' !important;
      position: absolute !important;
      bottom: 8px !important;
      width: 8px !important;
      height: 8px !important;
      background: #1db954 !important;
      border-radius: 50% !important;
    }

    /* MONSTROUS PLAY / PAUSE BUTTON */
    .sp-play-circle {
      background: #1db954 !important;
      color: #000000 !important;
      width: 120px !important;
      height: 120px !important;
      border-radius: 50% !important;
      box-shadow: 0 8px 30px rgba(29, 185, 84, 0.5) !important;
    }
    .sp-play-circle:active {
      transform: scale(0.92) !important;
    }
    .sp-play-circle svg {
      width: 58px !important;
      height: 58px !important;
      fill: #000000 !important;
    }

    /* TABS */
    .sp-dock-tabs {
      height: 80px !important;
      background: #000000 !important;
      display: flex !important;
      justify-content: space-around !important;
      align-items: center !important;
      border-top: 1px solid #1a1a1a !important;
    }
    .sp-tab {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      background: none !important;
      border: none !important;
      color: #888888 !important;
      font-size: 17px !important;
      font-weight: 700 !important;
      gap: 6px !important;
      cursor: pointer !important;
      flex: 1 !important;
      height: 100% !important;
      -webkit-tap-highlight-color: transparent !important;
    }
    .sp-tab svg {
      width: 38px !important;
      height: 38px !important;
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

  // Seeks by clicking & dragging on Spotify's genuine desktop progressbar element
  function directSpotifySeek(percentage) {
    // 1. Target Spotify's actual slider rail
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

    // 2. Also sync direct audio tag time
    const media = getMedia();
    if (media && media.duration) {
      try {
        media.currentTime = media.duration * percentage;
      } catch (err) {}
    }
  }

  // --- 4. CONTINUOUS STATE ENGINE ---
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

    // Song metadata
    if (navigator.mediaSession?.metadata) {
      const meta = navigator.mediaSession.metadata;
      if (title) title.innerText = meta.title || 'Playing';
      if (artist) artist.innerText = meta.artist || 'Spotify';
      if (art && meta.artwork?.length > 0) {
        art.src = meta.artwork[meta.artwork.length - 1].src;
      }
    }

    // Play/Pause icon
    if (playSvg) {
      if (media.paused) {
        playSvg.innerHTML = '<polygon points="10 8 30 20 10 32 10 8"></polygon>';
      } else {
        playSvg.innerHTML = '<rect x="9" y="8" width="7" height="24"></rect><rect x="23" y="8" width="7" height="24"></rect>';
      }
    }

    // --- ACCURATE SHUFFLE & REPEAT DETECTION ---
    const nativeShuf = document.querySelector('[data-testid="control-button-shuffle"]');
    if (nativeShuf && btnShuf) {
      const isAriaTrue = nativeShuf.getAttribute('aria-checked') === 'true';
      const hasActiveLabel = (nativeShuf.getAttribute('aria-label') || '').toLowerCase().includes('disable');
      const hasSpotGreen = getComputedStyle(nativeShuf).color.includes('29, 185, 84') || nativeShuf.classList.contains('active');
      btnShuf.classList.toggle('is-active', isAriaTrue || hasActiveLabel || hasSpotGreen);
    }

    const nativeRep = document.querySelector('[data-testid="control-button-repeat"]');
    if (nativeRep && btnRep) {
      const repVal = nativeRep.getAttribute('aria-checked');
      const isRepAria = repVal === 'true' || repVal === 'mixed';
      const hasRepLabel = (nativeRep.getAttribute('aria-label') || '').toLowerCase().includes('disable') || (nativeRep.getAttribute('aria-label') || '').toLowerCase().includes('repeat one');
      const hasRepGreen = getComputedStyle(nativeRep).color.includes('29, 185, 84');
      btnRep.classList.toggle('is-active', isRepAria || hasRepLabel || hasRepGreen);
    }

    // Timeline updates
    if (!isDraggingScrubber && media.duration) {
      const pct = (media.currentTime / media.duration) * 100;
      if (progress) progress.style.width = `${pct}%`;
      if (timeCurr) timeCurr.innerText = formatTime(media.currentTime);
      if (timeDur) timeDur.innerText = formatTime(media.duration);
    }
  }

  setInterval(syncState, 150);

  // --- 5. DISPATCH ACTIONS TO SPOTIFY'S DESKTOP BAR ---
  function clickDesktop(testId) {
    const el = document.querySelector(`[data-testid="${testId}"]`);
    if (el) {
      el.click();
      // Immediately run sync so UI updates with zero lag
      setTimeout(syncState, 40);
    }
  }

  // --- 6. MOUNT FULLSCREEN SHELL ---
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
          <img id="sp-shell-art" class="sp-hero-img" src="" alt="Album Artwork" />
          <div class="sp-hero-info">
            <span id="sp-shell-title" class="sp-hero-title">Connecting...</span>
            <span id="sp-shell-artist" class="sp-hero-artist">Spotify</span>
          </div>

          <!-- MASSIVE SCRUBBER -->
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
            <svg viewBox="0 0 24 24"><path d="M6 6h3v12H6zm4 6l10 7.5V4.5z"/></svg>
          </button>
          <button id="sp-btn-play" class="sp-play-circle" title="Play/Pause">
            <svg id="sp-shell-playsvg" viewBox="0 0 40 40"><polygon points="10 8 30 20 10 32 10 8"></polygon></svg>
          </button>
          <button id="sp-btn-next" title="Next">
            <svg viewBox="0 0 24 24"><path d="M4 19.5l10-7.5-10-7.5v15zM15 6h3v12h-3z"/></svg>
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

    // --- RELIABLE DRAG & TOUCH TIMELINE SCRUBBING ---
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