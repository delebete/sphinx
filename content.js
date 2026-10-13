// --- 1. MEDIA ELEMENT DISCOVERY & SPEED CONTROL ---
let activeMedia = null;

function findMediaElement() {
  const media = document.querySelector('audio, video');
  if (media && media !== activeMedia) {
    activeMedia = media;
  }
  return activeMedia;
}

// Detect if current audio is an Ad vs a Track
function isAdPlaying() {
  // Check MediaSession metadata or DOM attributes Spotify uses for ads
  if (navigator.mediaSession && navigator.mediaSession.metadata) {
    const title = navigator.mediaSession.metadata.title || '';
    const artist = navigator.mediaSession.metadata.artist || '';
    if (title.toLowerCase().includes('advertisement') || artist.toLowerCase().includes('spotify')) {
      return true;
    }
  }
  // Fallback: Spotify's now-playing bar link check
  const nowPlayingLink = document.querySelector('[data-testid="context-item-link"]');
  const trackLink = document.querySelector('[data-testid="nowplaying-track-link"]');
  // Ads lack typical track/album links
  if (!nowPlayingLink && !trackLink) return true;

  return false;
}

function updatePlaybackState() {
  const media = findMediaElement();
  if (!media) return;

  const ad = isAdPlaying();
  const targetSpeed = ad ? 16.0 : 1.0;

  if (media.playbackRate !== targetSpeed) {
    media.playbackRate = targetSpeed;
    media.defaultPlaybackRate = targetSpeed;
  }

  // Update HUD readouts
  const badge = document.getElementById('hud-mode-badge');
  const trackTitle = document.getElementById('hud-track-title');
  const progressBar = document.getElementById('hud-progress-fill');

  if (badge) {
    badge.innerText = ad ? '16x FAST-FORWARD (AD)' : '1x SONG';
    badge.className = ad ? 'badge-ad' : 'badge-song';
  }

  if (trackTitle && navigator.mediaSession && navigator.mediaSession.metadata) {
    trackTitle.innerText = `${navigator.mediaSession.metadata.title} - ${navigator.mediaSession.metadata.artist}`;
  }

  if (progressBar && media.duration) {
    const pct = (media.currentTime / media.duration) * 100;
    progressBar.style.width = `${pct}%`;
  }
}

// Check playback state continuously
setInterval(updatePlaybackState, 250);

// --- 2. CONTROLLER HOOKS (PROXYING TO SPOTIFY DOM) ---
function clickSpotifyControl(testId) {
  const btn = document.querySelector(`[data-testid="${testId}"]`);
  if (btn) btn.click();
}

function togglePlay() {
  const playBtn = document.querySelector('[data-testid="control-button-playpause"]');
  if (playBtn) playBtn.click();
}

function seekRelative(ratio) {
  const media = findMediaElement();
  if (media && media.duration) {
    media.currentTime = media.duration * ratio;
  }
}

// --- 3. CUSTOM HUD OVERLAY ---
function injectCustomUI() {
  if (document.getElementById('custom-spotify-hud')) return;

  const hud = document.createElement('div');
  hud.id = 'custom-spotify-hud';
  hud.innerHTML = `
    <div class="hud-top">
      <span id="hud-track-title">Loading track...</span>
      <span id="hud-mode-badge" class="badge-song">1x SONG</span>
    </div>
    
    <div class="hud-scrubber" id="hud-scrubber">
      <div id="hud-progress-fill"></div>
    </div>

    <div class="hud-controls">
      <button id="hud-shuffle" title="Shuffle">🔀</button>
      <button id="hud-prev" title="Previous">⏮️</button>
      <button id="hud-play" class="hud-play-btn" title="Play/Pause">⏯️</button>
      <button id="hud-next" title="Next">⏭️</button>
      <button id="hud-repeat" title="Repeat">🔁</button>
    </div>
  `;

  document.body.appendChild(hud);

  // Wire buttons to Spotify's internal test IDs
  document.getElementById('hud-play').addEventListener('click', togglePlay);
  document.getElementById('hud-next').addEventListener('click', () => clickSpotifyControl('control-button-skip-forward'));
  document.getElementById('hud-prev').addEventListener('click', () => clickSpotifyControl('control-button-skip-back'));
  document.getElementById('hud-shuffle').addEventListener('click', () => clickSpotifyControl('control-button-shuffle'));
  document.getElementById('hud-repeat').addEventListener('click', () => clickSpotifyControl('control-button-repeat'));

  // Scrubber dragging/tapping
  const scrubber = document.getElementById('hud-scrubber');
  scrubber.addEventListener('click', (e) => {
    const rect = scrubber.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seekRelative(ratio);
  });
}

// Delay injection until DOM settles
window.addEventListener('load', injectCustomUI);
setTimeout(injectCustomUI, 2000);