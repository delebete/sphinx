// ==UserScript==
// @name         Spotify 16x Auto-FastForward & Exact Mobile UI
// @namespace    http://tampermonkey.net/
// @version      1.2
// @match        https://open.spotify.com/*
// @run-at       document_idle
// ==/UserScript==

(function() {
  'use strict';

  // --- 1. CSS TO TRANSFORM DESKTOP DESKTOP VIEWPORT INTO TRUE MOBILE ---
  const mobileStyles = `
    /* Kill Desktop sidebars, top navigation bars, and activity feeds */
    [data-testid="left-sidebar"],
    .Root__left-sidebar,
    .Root__right-sidebar,
    [aria-label="Friend Activity"],
    header[data-testid="topbar"],
    .Root__top-bar {
      display: none !important;
    }

    /* Full width content with clean bottom padding so nothing hides behind bottom bars */
    .Root__main-view,
    .main-view-container,
    main {
      width: 100vw !important;
      max-width: 100vw !important;
      margin: 0 !important;
      padding: 16px 12px 145px 12px !important;
      box-sizing: border-box !important;
      overflow-x: hidden !important;
    }

    /* 2-column touch grids just like the mobile web view */
    [data-testid="grid-container"] {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 12px !important;
    }

    /* Suppress Spotify's standard desktop bottom player bar */
    footer[data-testid="now-playing-bar"],
    .Root__now-playing-bar {
      display: none !important;
    }

    /* --- EXACT SPOTIFY MOBILE OVERLAY CONTAINER --- */
    #spotify-mobile-container {
      position: fixed !important;
      bottom: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      z-index: 2147483647 !important;
      display: flex !important;
      flex-direction: column !important;
      pointer-events: none !important;
      user-select: none !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
    }

    /* --- FLOATING MINI PLAYER (MOBILE STYLE) --- */
    .sp-mini-player {
      pointer-events: auto !important;
      margin: 0 8px 6px 8px !important;
      background: #282828 !important;
      border-radius: 8px !important;
      box-shadow: 0 8px 24px rgba(0,0,0,0.6) !important;
      overflow: hidden !important;
      display: flex !important;
      flex-direction: column !important;
    }

    .sp-mini-body {
      display: flex !important;
      align-items: center !important;
      padding: 6px 10px !important;
      height: 48px !important;
      box-sizing: border-box !important;
    }

    .sp-track-art {
      width: 36px !important;
      height: 36px !important;
      border-radius: 4px !important;
      background: #181818 !important;
      margin-right: 10px !important;
      object-fit: cover !important;
      flex-shrink: 0 !important;
    }

    .sp-meta {
      flex: 1 !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
      margin-right: 8px !important;
    }

    .sp-title {
      font-size: 13px !important;
      font-weight: 700 !important;
      color: #ffffff !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    .sp-artist-row {
      display: flex !important;
      align-items: center !important;
      gap: 6px !important;
      font-size: 11px !important;
      color: #b3b3b3 !important;
    }

    .sp-artist {
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    .sp-speed-tag {
      font-size: 9px !important;
      font-weight: 800 !important;
      padding: 1px 4px !important;
      border-radius: 3px !important;
      background: #1db954 !important;
      color: #000000 !important;
    }

    .sp-speed-tag.is-ad {
      background: #e91429 !important;
      color: #ffffff !important;
      animation: sp-flash 0.8s infinite alternate !important;
    }

    @keyframes sp-flash {
      from { opacity: 0.6; }
      to { opacity: 1; }
    }

    .sp-btn-icon {
      background: transparent !important;
      border: none !important;
      outline: none !important;
      padding: 6px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      cursor: pointer !important;
      color: #ffffff !important;
    }

    .sp-btn-icon svg {
      width: 22px !important;
      height: 22px !important;
      fill: currentColor !important;
    }

    /* Embedded Scrubber Bar under mini-player */
    .sp-progress-rail {
      width: 100% !important;
      height: 2px !important;
      background: rgba(255,255,255,0.2) !important;
      cursor: pointer !important;
      position: relative !important;
    }

    .sp-progress-fill {
      height: 100% !important;
      width: 0% !important;
      background: #ffffff !important;
      transition: width 0.15s linear !important;
    }

    /* --- NATIVE 4-TAB BOTTOM NAVIGATION BAR --- */
    .sp-bottom-nav {
      pointer-events: auto !important;
      height: 56px !important;
      background: #000000 !important;
      display: flex !important;
      justify-content: space-around !important;
      align-items: center !important;
      padding-bottom: env(safe-area-inset-bottom, 0px) !important;
      border-top: 1px solid rgba(255,255,255,0.06) !important;
    }

    .sp-nav-tab {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      background: transparent !important;
      border: none !important;
      color: #b3b3b3 !important;
      font-size: 10px !important;
      font-weight: 600 !important;
      gap: 3px !important;
      cursor: pointer !important;
      flex: 1 !important;
      height: 100% !important;
    }

    .sp-nav-tab svg {
      width: 22px !important;
      height: 22px !important;
      fill: currentColor !important;
    }

    .sp-nav-tab.active,
    .sp-nav-tab:hover {
      color: #ffffff !important;
    }
  `;

  const sheet = document.createElement('style');
  sheet.textContent = mobileStyles;
  document.head.appendChild(sheet);

  // --- 2. SPEED ACCELERATOR (16x ON ADS, 1x ON TRACKS) ---
  let activeMedia = null;
  function getMedia() {
    const el = document.querySelector('audio, video');
    if (el && el !== activeMedia) activeMedia = el;
    return activeMedia;
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

  function monitorPlayback() {
    const media = getMedia();
    if (!media) return;

    const adDetected = isAd();
    const targetSpeed = adDetected ? 16.0 : 1.0;

    if (media.playbackRate !== targetSpeed) {
      media.playbackRate = targetSpeed;
      media.defaultPlaybackRate = targetSpeed;
    }

    // Refresh UI readouts
    const titleEl = document.getElementById('sp-ui-title');
    const artistEl = document.getElementById('sp-ui-artist');
    const artEl = document.getElementById('sp-ui-art');
    const badgeEl = document.getElementById('sp-ui-badge');
    const progressEl = document.getElementById('sp-ui-progress');
    const playBtnSvg = document.getElementById('sp-play-svg');

    // Title / Artist / Art from MediaSession or DOM
    if (navigator.mediaSession?.metadata) {
      const meta = navigator.mediaSession.metadata;
      if (titleEl) titleEl.innerText = meta.title || 'Unknown Title';
      if (artistEl) artistEl.innerText = meta.artist || 'Unknown Artist';
      if (artEl && meta.artwork && meta.artwork.length > 0) {
        artEl.src = meta.artwork[meta.artwork.length - 1].src;
      }
    }

    // Fallback to DOM artwork if MediaSession is empty
    if (artEl && !artEl.src) {
      const desktopArt = document.querySelector('[data-testid="cover-art-image"]');
      if (desktopArt) artEl.src = desktopArt.src;
    }

    // Badge speed toggle
    if (badgeEl) {
      badgeEl.innerText = adDetected ? '16x AD' : '1x';
      badgeEl.className = adDetected ? 'sp-speed-tag is-ad' : 'sp-speed-tag';
    }

    // Play/Pause icon sync
    if (playBtnSvg) {
      if (media.paused) {
        playBtnSvg.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon>'; // Play Icon
      } else {
        playBtnSvg.innerHTML = '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>'; // Pause Icon
      }
    }

    // Scrubber fill
    if (progressEl && media.duration) {
      progressEl.style.width = `${(media.currentTime / media.duration) * 100}%`;
    }
  }

  setInterval(monitorPlayback, 200);

  // --- 3. DOM CONTROLLER ACTIONS ---
  function triggerDesktop(testId) {
    const btn = document.querySelector(`[data-testid="${testId}"]`);
    if (btn) btn.click();
  }

  function routeTo(urlPath) {
    window.location.href = urlPath;
  }

  // --- 4. BUILD AND INJECT THE EXACT MOBILE UI ---
  function mountMobileInterface() {
    if (document.getElementById('spotify-mobile-container')) return;

    const root = document.body || document.documentElement;
    if (!root) return;

    const container = document.createElement('div');
    container.id = 'spotify-mobile-container';
    container.innerHTML = `
      <!-- MINI PLAYER COMPONENT -->
      <div class="sp-mini-player">
        <div class="sp-mini-body">
          <img id="sp-ui-art" class="sp-track-art" src="" alt="" />
          <div class="sp-meta">
            <span id="sp-ui-title" class="sp-title">Not Playing</span>
            <div class="sp-artist-row">
              <span id="sp-ui-artist" class="sp-artist">Spotify</span>
              <span id="sp-ui-badge" class="sp-speed-tag">1x</span>
            </div>
          </div>
          <!-- Device / Action button -->
          <button id="sp-like-btn" class="sp-btn-icon" title="Save">
            <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          </button>
          <!-- Play / Pause button -->
          <button id="sp-play-btn" class="sp-btn-icon" title="Play/Pause">
            <svg id="sp-play-svg" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          </button>
        </div>
        <div id="sp-rail" class="sp-progress-rail">
          <div id="sp-ui-progress" class="sp-progress-fill"></div>
        </div>
      </div>

      <!-- EXACT 4-TAB NATIVE SPOTIFY MOBILE BOTTOM NAVIGATION -->
      <nav class="sp-bottom-nav">
        <button id="sp-nav-home" class="sp-nav-tab active">
          <svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          <span>Home</span>
        </button>
        <button id="sp-nav-search" class="sp-nav-tab">
          <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          <span>Search</span>
        </button>
        <button id="sp-nav-library" class="sp-nav-tab">
          <svg viewBox="0 0 24 24"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z"/></svg>
          <span>Your Library</span>
        </button>
        <button id="sp-nav-premium" class="sp-nav-tab">
          <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/></svg>
          <span>Premium</span>
        </button>
      </nav>
    `;

    root.appendChild(container);

    // Event attachments
    document.getElementById('sp-play-btn')?.addEventListener('click', () => {
      triggerDesktop('control-button-playpause');
    });

    document.getElementById('sp-like-btn')?.addEventListener('click', () => {
      const heartBtn = document.querySelector('[data-testid="add-button"]');
      if (heartBtn) heartBtn.click();
    });

    const rail = document.getElementById('sp-rail');
    if (rail) {
      rail.addEventListener('click', (e) => {
        const rect = rail.getBoundingClientRect();
        const media = getMedia();
        if (media && media.duration) {
          media.currentTime = media.duration * ((e.clientX - rect.left) / rect.width);
        }
      });
    }

    // Navigation redirects matching Spotify mobile paths
    document.getElementById('sp-nav-home')?.addEventListener('click', () => routeTo('/'));
    document.getElementById('sp-nav-search')?.addEventListener('click', () => routeTo('/search'));
    document.getElementById('sp-nav-library')?.addEventListener('click', () => routeTo('/collection/playlists'));
    document.getElementById('sp-nav-premium')?.addEventListener('click', () => routeTo('/premium'));
  }

  const mountInterval = setInterval(() => {
    mountMobileInterface();
    if (document.getElementById('spotify-mobile-container')) {
      clearInterval(mountInterval);
    }
  }, 300);
})();