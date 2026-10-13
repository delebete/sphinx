// ==UserScript==
// @name         Spotify 16x Auto-FastForward & Pure Mobile Shell
// @namespace    http://tampermonkey.net/
// @version      2.1
// @match        https://open.spotify.com/*
// @run-at       document_idle
// ==/UserScript==

(function() {
  'use strict';

  // --- 1. HARD DISABLE PINCH / DOUBLE-TAP ZOOMING ---
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

  // Prevent double-tap zooming on gesture level
  document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });

  // --- 2. MOBILE-FIRST UI & LARGE TOUCH TARGET STYLES ---
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
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
      z-index: 2147483647 !important;
      display: flex !important;
      flex-direction: column !important;
      box-sizing: border-box !important;
      user-select: none !important;
      -webkit-user-select: none !important;
      touch-action: manipulation !important;
    }

    /* Large Native Header */
    .sp-shell-header {
      padding: 18px 20px 12px 20px !important;
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      flex-shrink: 0 !important;
    }
    .sp-shell-header h1 {
      font-size: 26px !important;
      font-weight: 800 !important;
      letter-spacing: -0.5px !important;
      margin: 0 !important;
    }
    .sp-pill-ad {
      font-size: 13px !important;
      font-weight: 800 !important;
      padding: 6px 12px !important;
      border-radius: 16px !important;
      background: #e91429 !important;
      color: #fff !important;
      animation: shell-blink 0.8s infinite alternate !important;
    }
    .sp-pill-song {
      font-size: 13px !important;
      font-weight: 700 !important;
      padding: 6px 12px !important;
      border-radius: 16px !important;
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
      padding: 8px 20px 180px 20px !important;
      -webkit-overflow-scrolling: touch !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
    }

    /* Mobile Hero Player Card */
    .sp-hero-card {
      width: 100% !important;
      max-width: 440px !important;
      background: linear-gradient(180deg, #242424 0%, #161616 100%) !important;
      border-radius: 18px !important;
      padding: 24px 20px !important;
      box-sizing: border-box !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      box-shadow: 0 10px 30px rgba(0,0,0,0.6) !important;
    }
    .sp-hero-img {
      width: 72vw !important;
      max-width: 290px !important;
      aspect-ratio: 1 / 1 !important;
      border-radius: 14px !important;
      object-fit: cover !important;
      box-shadow: 0 12px 30px rgba(0,0,0,0.7) !important;
      margin-bottom: 22px !important;
      background: #282828 !important;
    }
    .sp-hero-info {
      width: 100% !important;
      text-align: left !important;
      margin-bottom: 8px !important;
    }
    .sp-hero-title {
      font-size: 22px !important;
      font-weight: 800 !important;
      line-height: 1.25 !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      display: block !important;
      color: #ffffff !important;
    }
    .sp-hero-artist {
      font-size: 17px !important;
      font-weight: 500 !important;
      color: #b3b3b3 !important;
      margin-top: 6px !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      display: block !important;
    }

    /* Fat Touch-Friendly Scrubber */
    .sp-scrubber-box {
      width: 100% !important;
      margin: 18px 0 8px 0 !important;
      padding: 12px 0 !important; /* Generous vertical hit target */
      cursor: pointer !important;
      touch-action: none !important;
    }
    .sp-scrubber-rail {
      width: 100% !important;
      height: 6px !important;
      background: #3e3e3e !important;
      border-radius: 3px !important;
      position: relative !important;
    }
    .sp-scrubber-fill {
      width: 0% !important;
      height: 100% !important;
      background: #1db954 !important;
      border-radius: 3px !important;
    }

    /* Bottom Dock (Controls + Tabs) */
    .sp-bottom-dock {
      position: absolute !important;
      bottom: 0 !important;
      left: 0 !important;
      right: 0 !important;
      background: linear-gradient(180deg, rgba(18,18,18,0) 0%, #0a0a0a 28%) !important;
      display: flex !important;
      flex-direction: column !important;
      padding-bottom: env(safe-area-inset-bottom, 10px) !important;
    }

    /* Large Mobile Control Buttons */
    .sp-dock-controls {
      display: flex !important;
      justify-content: space-evenly !important;
      align-items: center !important;
      padding: 14px 10px 18px 10px !important;
    }
    .sp-dock-controls button {
      background: transparent !important;
      border: none !important;
      color: #ffffff !important;
      cursor: pointer !important;
      padding: 12px !important;
      min-width: 50px !important;
      min-height: 50px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      border-radius: 50% !important;
      transition: transform 0.1s ease !important;
      -webkit-tap-highlight-color: transparent !important;
    }
    .sp-dock-controls button:active {
      transform: scale(0.88) !important;
    }
    .sp-dock-controls button svg {
      width: 32px !important;
      height: 32px !important;
      fill: currentColor !important;
    }
    .sp-play-circle {
      background: #1db954 !important;
      color: #000000 !important;
      width: 66px !important;
      height: 66px !important;
      border-radius: 50% !important;
      box-shadow: 0 4px 18px rgba(29, 185, 84, 0.4) !important;
    }
    .sp-play-circle:active {
      transform: scale(0.92) !important;
    }
    .sp-play-circle svg {
      width: 30px !important;
      height: 30px !important;
      fill: #000000 !important;
    }

    /* Oversized Bottom Tabs */
    .sp-dock-tabs {
      height: 64px !important;
      background: #000000 !important;
      display: flex !important;
      justify-content: space-around !important;
      align-items: center !important;
      border-top: 1px solid #1f1f1f !important;
    }
    .sp-tab {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      background: none !important;
      border: none !important;
      color: #b3b3b3 !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      gap: 5px !important;
      cursor: pointer !important;
      flex: 1 !important;
      height: 100% !important;
      -webkit-tap-highlight-color: transparent !important;
    }
    .sp-tab svg {
      width: 26px !important;
      height: 26px !important;
      fill: currentColor !important;
    }
    .sp-tab.active {
      color: #ffffff !important;
    }
  `;

  const sheet = document.createElement('style');
  sheet.textContent = shellStyles;
  document.head.appendChild(sheet);

  // --- 3. AUTO FAST-FORWARD LOGIC ---
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

  function syncState() {
    const media = getMedia();
    if (!media) return;

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
    const playSvg = document.getElementById('sp-shell-playsvg');

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
        playSvg.innerHTML = '<polygon points="6 4 20 12 6 20 6 4"></polygon>';
      } else {
        playSvg.innerHTML = '<rect x="6" y="4" width="4.5" height="16"></rect><rect x="13.5" y="4" width="4.5" height="16"></rect>';
      }
    }

    if (progress && media.duration) {
      progress.style.width = `${(media.currentTime / media.duration) * 100}%`;
    }
  }

  setInterval(syncState, 200);

  // --- 4. CONTROLLER TRIGGERS ---
  function clickDesktop(testId) {
    const el = document.querySelector(`[data-testid="${testId}"]`);
    if (el) el.click();
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
          <img id="sp-shell-art" class="sp-hero-img" src="" alt="Album Artwork" />
          <div class="sp-hero-info">
            <span id="sp-shell-title" class="sp-hero-title">Connecting...</span>
            <span id="sp-shell-artist" class="sp-hero-artist">Spotify</span>
          </div>

          <div class="sp-scrubber-box" id="sp-scrub-box">
            <div class="sp-scrubber-rail">
              <div class="sp-scrubber-fill" id="sp-shell-fill"></div>
            </div>
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
            <svg id="sp-shell-playsvg" viewBox="0 0 24 24"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>
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

    // Event bindings
    document.getElementById('sp-btn-play')?.addEventListener('click', () => clickDesktop('control-button-playpause'));
    document.getElementById('sp-btn-next')?.addEventListener('click', () => clickDesktop('control-button-skip-forward'));
    document.getElementById('sp-btn-prev')?.addEventListener('click', () => clickDesktop('control-button-skip-back'));
    document.getElementById('sp-btn-shuf')?.addEventListener('click', () => clickDesktop('control-button-shuffle'));
    document.getElementById('sp-btn-rep')?.addEventListener('click', () => clickDesktop('control-button-repeat'));

    const scrub = document.getElementById('sp-scrub-box');
    if (scrub) {
      scrub.addEventListener('click', (e) => {
        const rect = scrub.getBoundingClientRect();
        const media = getMedia();
        if (media && media.duration) {
          media.currentTime = media.duration * ((e.clientX - rect.left) / rect.width);
        }
      });
    }
  }

  const mountLoop = setInterval(() => {
    mountShell();
    if (document.getElementById('sp-mobile-shell')) clearInterval(mountLoop);
  }, 250);
})();