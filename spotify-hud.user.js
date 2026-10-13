// ==UserScript==
// @name         Spotify 16x Auto-FastForward & Pure Mobile Shell
// @namespace    http://tampermonkey.net/
// @version      2.0
// @match        https://open.spotify.com/*
// @run-at       document_idle
// ==/UserScript==

(function() {
  'use strict';

  // --- 1. FULLSCREEN MOBILE SHELL STYLING ---
  const shellStyles = `
    /* Neutralize desktop scroll and overflow */
    html, body {
      overflow: hidden !important;
      position: fixed !important;
      width: 100vw !important;
      height: 100vh !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    /* THE FULL-SCREEN MOBILE OVERLAY APP */
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
    }

    /* Mobile Header */
    .sp-shell-header {
      padding: 16px 16px 10px 16px !important;
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
    }
    .sp-shell-header h1 {
      font-size: 22px !important;
      font-weight: 700 !important;
      margin: 0 !important;
    }
    .sp-pill-ad {
      font-size: 11px !important;
      font-weight: 800 !important;
      padding: 3px 8px !important;
      border-radius: 12px !important;
      background: #e91429 !important;
      color: #fff !important;
      animation: shell-blink 0.8s infinite alternate !important;
    }
    .sp-pill-song {
      font-size: 11px !important;
      font-weight: 700 !important;
      padding: 3px 8px !important;
      border-radius: 12px !important;
      background: #1db954 !important;
      color: #000 !important;
    }
    @keyframes shell-blink {
      from { opacity: 0.5; }
      to { opacity: 1; }
    }

    /* Scrollable Mobile Body */
    .sp-shell-body {
      flex: 1 !important;
      overflow-y: auto !important;
      padding: 8px 16px 140px 16px !important;
      -webkit-overflow-scrolling: touch !important;
    }

    /* Track Spotlight Card (Mobile Hero Player) */
    .sp-hero-card {
      background: linear-gradient(180deg, #333333 0%, #1a1a1a 100%) !important;
      border-radius: 12px !important;
      padding: 16px !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important;
      margin-bottom: 20px !important;
    }
    .sp-hero-img {
      width: 65vw !important;
      max-width: 240px !important;
      aspect-ratio: 1 / 1 !important;
      border-radius: 8px !important;
      object-fit: cover !important;
      box-shadow: 0 8px 24px rgba(0,0,0,0.6) !important;
      margin-bottom: 16px !important;
      background: #282828 !important;
    }
    .sp-hero-info {
      width: 100% !important;
      text-align: left !important;
    }
    .sp-hero-title {
      font-size: 18px !important;
      font-weight: 700 !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      display: block !important;
    }
    .sp-hero-artist {
      font-size: 14px !important;
      color: #b3b3b3 !important;
      margin-top: 4px !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      display: block !important;
    }

    /* Interactive Scrubber */
    .sp-scrubber-box {
      width: 100% !important;
      margin: 12px 0 6px 0 !important;
      padding: 8px 0 !important;
      cursor: pointer !important;
    }
    .sp-scrubber-rail {
      width: 100% !important;
      height: 4px !important;
      background: #4d4d4d !important;
      border-radius: 2px !important;
      position: relative !important;
    }
    .sp-scrubber-fill {
      width: 0% !important;
      height: 100% !important;
      background: #1db954 !important;
      border-radius: 2px !important;
    }

    /* Floating Bottom Mobile Player & Nav */
    .sp-bottom-dock {
      position: absolute !important;
      bottom: 0 !important;
      left: 0 !important;
      right: 0 !important;
      background: linear-gradient(180deg, transparent 0%, #000000 30%) !important;
      display: flex !important;
      flex-direction: column !important;
      padding-bottom: env(safe-area-inset-bottom, 8px) !important;
    }

    /* Mobile Controls Row */
    .sp-dock-controls {
      display: flex !important;
      justify-content: space-evenly !important;
      align-items: center !important;
      padding: 10px 0 !important;
    }
    .sp-dock-controls button {
      background: transparent !important;
      border: none !important;
      color: #fff !important;
      cursor: pointer !important;
      padding: 8px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
    .sp-dock-controls button svg {
      width: 26px !important;
      height: 26px !important;
      fill: currentColor !important;
    }
    .sp-play-circle {
      background: #1db954 !important;
      color: #000 !important;
      width: 56px !important;
      height: 56px !important;
      border-radius: 50% !important;
    }
    .sp-play-circle svg {
      width: 24px !important;
      height: 24px !important;
      fill: #000 !important;
    }

    /* Bottom Navigation Tabs */
    .sp-dock-tabs {
      height: 52px !important;
      background: #000000 !important;
      display: flex !important;
      justify-content: space-around !important;
      align-items: center !important;
      border-top: 1px solid #222 !important;
    }
    .sp-tab {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      background: none !important;
      border: none !important;
      color: #b3b3b3 !important;
      font-size: 10px !important;
      gap: 3px !important;
      cursor: pointer !important;
      flex: 1 !important;
    }
    .sp-tab svg {
      width: 22px !important;
      height: 22px !important;
      fill: currentColor !important;
    }
    .sp-tab.active {
      color: #ffffff !important;
    }
  `;

  const sheet = document.createElement('style');
  sheet.textContent = shellStyles;
  document.head.appendChild(sheet);

  // --- 2. FAST-FORWARD ENGINE (16x on Ads, 1x on Songs) ---
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

    // Update Shell Elements
    const badge = document.getElementById('sp-shell-badge');
    const title = document.getElementById('sp-shell-title');
    const artist = document.getElementById('sp-shell-artist');
    const art = document.getElementById('sp-shell-art');
    const progress = document.getElementById('sp-shell-fill');
    const playSvg = document.getElementById('sp-shell-playsvg');

    if (badge) {
      badge.innerText = ad ? '16x AD ACCELERATED' : '1x SONG';
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

    // Play/Pause icon toggle
    if (playSvg) {
      if (media.paused) {
        playSvg.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
      } else {
        playSvg.innerHTML = '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>';
      }
    }

    // Scrubber
    if (progress && media.duration) {
      progress.style.width = `${(media.currentTime / media.duration) * 100}%`;
    }
  }

  setInterval(syncState, 200);

  // --- 3. PROXY TO DESKTOP CONTROLS ---
  function clickDesktop(testId) {
    const el = document.querySelector(`[data-testid="${testId}"]`);
    if (el) el.click();
  }

  // --- 4. INJECT FULLSCREEN MOBILE SHELL ---
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
            <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          </button>
          <button id="sp-btn-play" class="sp-play-circle" title="Play/Pause">
            <svg id="sp-shell-playsvg" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          </button>
          <button id="sp-btn-next" title="Next">
            <svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
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