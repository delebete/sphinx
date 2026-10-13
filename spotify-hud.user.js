// ==UserScript==
// @name         Spotify 16x Auto-FastForward & Mobile HUD
// @namespace    http://tampermonkey.net/
// @version      1.1
// @match        https://open.spotify.com/*
// @run-at       document_idle
// ==/UserScript==

(function() {
  'use strict';

  // --- 1. FORCE MOBILE LAYOUT WHILE IN DESKTOP MODE ---
  const mobileStyles = `
    /* Hide clunky desktop sidebars, friends feed, and top promotions */
    [data-testid="left-sidebar"],
    .Root__left-sidebar,
    .Root__right-sidebar,
    [aria-label="Friend Activity"],
    header[data-testid="topbar"] {
      display: none !important;
    }

    /* Force the main container to stretch full-width like a native mobile app */
    .Root__main-view,
    .main-view-container,
    main {
      width: 100vw !important;
      max-width: 100vw !important;
      margin: 0 !important;
      padding: 0 8px 140px 8px !important; /* Space for the bottom HUD */
      overflow-x: hidden !important;
    }

    /* Collapse wide desktop grid cards into 2 mobile touch-friendly columns */
    [data-testid="grid-container"] {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 12px !important;
    }

    /* Hide Spotify's native desktop bottom player bar to avoid overlap */
    footer[data-testid="now-playing-bar"],
    .Root__now-playing-bar {
      display: none !important;
    }

    /* --- 2. CUSTOM MOBILE OVERLAY HUD --- */
    #custom-spotify-hud {
      position: fixed !important;
      bottom: 0 !important;
      left: 0 !important;
      right: 0 !important;
      width: 100vw !important;
      background: rgba(18, 18, 18, 0.98) !important;
      backdrop-filter: blur(16px) !important;
      border-top: 1px solid #282828 !important;
      padding: 10px 16px 24px !important;
      z-index: 2147483647 !important;
      box-sizing: border-box !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      color: #ffffff !important;
      display: block !important;
      touch-action: manipulation !important;
    }

    .hud-top {
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      margin-bottom: 6px !important;
      font-size: 13px !important;
    }

    #hud-track-title {
      max-width: 68% !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      font-weight: 600 !important;
    }

    .badge-song {
      background: #1db954 !important;
      color: #000000 !important;
      padding: 2px 8px !important;
      border-radius: 10px !important;
      font-weight: 700 !important;
      font-size: 10px !important;
    }

    .badge-ad {
      background: #e91429 !important;
      color: #ffffff !important;
      padding: 2px 8px !important;
      border-radius: 10px !important;
      font-weight: 700 !important;
      font-size: 10px !important;
      animation: hud-pulse 1s infinite alternate !important;
    }

    @keyframes hud-pulse {
      from { opacity: 0.6; }
      to { opacity: 1; }
    }

    .hud-scrubber {
      width: 100% !important;
      height: 8px !important;
      background: #3e3e3e !important;
      border-radius: 4px !important;
      cursor: pointer !important;
      margin-bottom: 8px !important;
      position: relative !important;
    }

    #hud-progress-fill {
      width: 0% !important;
      height: 100% !important;
      background: #1db954 !important;
      border-radius: 4px !important;
      transition: width 0.1s linear !important;
    }

    .hud-controls {
      display: flex !important;
      justify-content: space-around !important;
      align-items: center !important;
      padding-top: 4px !important;
    }

    .hud-controls button {
      background: none !important;
      border: none !important;
      color: #ffffff !important;
      font-size: 24px !important;
      cursor: pointer !important;
      padding: 8px !important;
      border-radius: 50% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }

    .hud-play-btn {
      background: #1db954 !important;
      color: #000000 !important;
      width: 48px !important;
      height: 48px !important;
      font-size: 20px !important;
    }
  `;

  const styleSheet = document.createElement('style');
  styleSheet.textContent = mobileStyles;
  document.head.appendChild(styleSheet);

  // --- 2. FAST-FORWARD ENGINE (16x on Ads, 1x on Songs) ---
  let activeMedia = null;
  function getMedia() {
    const el = document.querySelector('audio, video');
    if (el && el !== activeMedia) activeMedia = el;
    return activeMedia;
  }

  function isAd() {
    if (navigator.mediaSession?.metadata) {
      const title = navigator.mediaSession.metadata.title?.toLowerCase() || '';
      const artist = navigator.mediaSession.metadata.artist?.toLowerCase() || '';
      if (title.includes('advertisement') || artist.includes('spotify')) return true;
    }
    const hasTrackLink = document.querySelector('[data-testid="context-item-link"], [data-testid="nowplaying-track-link"]');
    return !hasTrackLink;
  }

  function tick() {
    const media = getMedia();
    if (!media) return;

    const adPlaying = isAd();
    const speed = adPlaying ? 16.0 : 1.0;

    if (media.playbackRate !== speed) {
      media.playbackRate = speed;
      media.defaultPlaybackRate = speed;
    }

    const badge = document.getElementById('hud-mode-badge');
    const title = document.getElementById('hud-track-title');
    const bar = document.getElementById('hud-progress-fill');

    if (badge) {
      badge.innerText = adPlaying ? '16x FF (AD)' : '1x SONG';
      badge.className = adPlaying ? 'badge-ad' : 'badge-song';
    }
    if (title && navigator.mediaSession?.metadata) {
      title.innerText = `${navigator.mediaSession.metadata.title} - ${navigator.mediaSession.metadata.artist}`;
    }
    if (bar && media.duration) {
      bar.style.width = `${(media.currentTime / media.duration) * 100}%`;
    }
  }
  setInterval(tick, 250);

  // --- 3. MOUNT MOBILE HUD & CONTROL HOOKS ---
  function trigger(testId) {
    const btn = document.querySelector(`[data-testid="${testId}"]`);
    if (btn) btn.click();
  }

  function mountHUD() {
    if (document.getElementById('custom-spotify-hud')) return;

    const target = document.body || document.documentElement;
    if (!target) return;

    const hud = document.createElement('div');
    hud.id = 'custom-spotify-hud';
    hud.innerHTML = `
      <div class="hud-top">
        <span id="hud-track-title">Connecting...</span>
        <span id="hud-mode-badge" class="badge-song">1x SONG</span>
      </div>
      <div class="hud-scrubber" id="hud-scrubber">
        <div id="hud-progress-fill"></div>
      </div>
      <div class="hud-controls">
        <button id="hud-shuffle" type="button">🔀</button>
        <button id="hud-prev" type="button">⏮️</button>
        <button id="hud-play" class="hud-play-btn" type="button">⏯️</button>
        <button id="hud-next" type="button">⏭️</button>
        <button id="hud-repeat" type="button">🔁</button>
      </div>
    `;
    target.appendChild(hud);

    document.getElementById('hud-play')?.addEventListener('click', () => trigger('control-button-playpause'));
    document.getElementById('hud-next')?.addEventListener('click', () => trigger('control-button-skip-forward'));
    document.getElementById('hud-prev')?.addEventListener('click', () => trigger('control-button-skip-back'));
    document.getElementById('hud-shuffle')?.addEventListener('click', () => trigger('control-button-shuffle'));
    document.getElementById('hud-repeat')?.addEventListener('click', () => trigger('control-button-repeat'));

    const scrubber = document.getElementById('hud-scrubber');
    if (scrubber) {
      scrubber.addEventListener('click', (e) => {
        const rect = scrubber.getBoundingClientRect();
        const media = getMedia();
        if (media && media.duration) {
          media.currentTime = media.duration * ((e.clientX - rect.left) / rect.width);
        }
      });
    }
  }

  const mountInterval = setInterval(() => {
    mountHUD();
    if (document.getElementById('custom-spotify-hud')) {
      clearInterval(mountInterval);
    }
  }, 400);
})();