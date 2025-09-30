// DOM Elements
const audio = document.getElementById("audio-player");
const playBtn = document.getElementById("playPauseBtn");
const waveform = document.getElementById("bottomWaveform");
const timeDisplay = document.getElementById("timeDisplay");
const playerThumb = document.getElementById("player-thumb");
const musicItems = Array.from(document.getElementById("musicList").children);
const playerTitle = document.getElementById("player-song-title");
const playerArtist = document.getElementById("player-artist");
const thumb = document.getElementById('player-thumb');
const musicPlayer = document.querySelector('.music-player');
const nextBtn = document.getElementById("nextBtn");
const prevBtn = document.getElementById("prevBtn");
const searchInput = document.getElementById("searchInput");
const lyricsLinesContainer = document.getElementById("lyricsLines");
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");



let barCount = 90;
let bars = [];
let currentSongIndex = 0;
let isDragging = false;



menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("show");
});


function generateWaveform() {
    waveform.innerHTML = "";
    bars = [];
    for (let i = 0; i < barCount; i++) {
        const bar = document.createElement("div");
        bar.className = "bottom-bar";
        bar.style.height = `${10 + Math.random() * 30}px`;
        waveform.appendChild(bar);
        bars.push(bar);
    }
}
generateWaveform();

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function updateWaveformProgress() {
    const progress = audio.currentTime / (audio.duration || 1);
    const activeBars = Math.floor(progress * barCount);

    bars.forEach((bar, index) => {
        bar.classList.toggle("active", index < activeBars);
    });

    timeDisplay.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration || 0)}`;
    updateLyrics(audio.currentTime);
}
audio.addEventListener("timeupdate", updateWaveformProgress);

playBtn.addEventListener("click", () => {
    if (audio.paused) {
        audio.play();
        playBtn.src = "pause.png";
    } else {
        audio.pause();
        playBtn.src = "play-button-arrowhead.png";
    }
});

searchInput.addEventListener("input", () => {
    const searchTerm = searchInput.value.toLowerCase();

    musicItems.forEach(item => {
        const title = item.querySelector(".title")?.textContent.toLowerCase() || "";
        const artist = item.querySelector(".artist")?.textContent.toLowerCase() || "";
        const matches = title.includes(searchTerm) || artist.includes(searchTerm);
        item.style.display = matches ? "flex" : "none";
    });
});

waveform.addEventListener("click", seekAudio);
waveform.addEventListener("mousedown", (e) => { isDragging = true; seekAudio(e); });
window.addEventListener("mousemove", (e) => { if (isDragging) seekAudio(e); });
window.addEventListener("mouseup", () => { isDragging = false; });

function seekAudio(e) {
    const rect = waveform.getBoundingClientRect();
    const pointerX = e.clientX - rect.left;
    const barWidth = bars[0]?.offsetWidth || 0;
    const gap = parseFloat(getComputedStyle(waveform).gap || 0);
    const totalWidth = (barWidth * barCount) + (gap * (barCount - 1));
    const leftPadding = (rect.width - totalWidth) / 2;
    const adjustedX = pointerX - leftPadding;

    const percent = Math.min(1, Math.max(0, adjustedX / totalWidth));
    audio.currentTime = percent * (audio.duration || 0);

    bars.forEach((bar, index) => {
        bar.classList.toggle("active", index < Math.floor(percent * barCount));
    });
}

thumb.addEventListener('click', () => {
    thumb.classList.toggle('expanded');
    musicPlayer.classList.toggle('expanded');
    lyricsLinesContainer.style.display = musicPlayer.classList.contains("expanded") ? "block" : "none";
});

function playSongAtIndex(index) {
    if (index < 0 || index >= musicItems.length) return;
    currentSongIndex = index;
    const item = musicItems[index];
    const src = item.dataset.src;
    const img = item.dataset.img;

    playerThumb.src = img;
    audio.src = src;
    audio.play();
    playBtn.src = "pause.png";

    const info = item.querySelector('.info');
    playerTitle.textContent = info.querySelector('.title')?.textContent || "Unknown Title";
    playerArtist.textContent = info.querySelector('.artist')?.textContent || "Unknown Artist";

    renderLyrics(index);
    updateWaveformProgress();
}

function renderLyrics(index) {
    lyricsLinesContainer.innerHTML = "";
    const lines = syncedLyrics[index] || [];
    lines.forEach((line, idx) => {
        const div = document.createElement("div");
        div.className = "lyrics-line";
        div.dataset.time = line.time;
        div.textContent = line.text;
        lyricsLinesContainer.appendChild(div);
    });
}


function smoothScrollTo(container, targetTop, duration = 400) {
    const startTop = container.scrollTop;
    const change = targetTop - startTop;
    const startTime = performance.now();

    function animateScroll(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = easeInOutQuad(progress);
        container.scrollTop = startTop + change * ease;

        if (progress < 1) {
            requestAnimationFrame(animateScroll);
        }
    }

    function easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    requestAnimationFrame(animateScroll);
}

let previousActiveIndex = -1;

function updateLyrics(currentTime) {
    const lines = lyricsLinesContainer.querySelectorAll(".lyrics-line");
    let activeIdx = -1;

    lines.forEach((line, idx) => {
        const lineTime = parseFloat(line.dataset.time);
        if (currentTime >= lineTime) {
            activeIdx = idx;
        }
    });

    // Skip scroll/DOM updates if active line hasn't changed
    if (activeIdx === previousActiveIndex) return;

    previousActiveIndex = activeIdx;

    lines.forEach((line, idx) => {
        line.classList.toggle("active", idx === activeIdx);
    });

    if (activeIdx !== -1) {
        const activeLine = lines[activeIdx];
        smoothScrollTo(lyricsLinesContainer, activeLine.offsetTop);
    }
}









musicItems.forEach((item, index) => {
    const src = item.dataset.src;
    const metaDiv = item.querySelector(".song-meta");

    const tempAudio = new Audio();
    tempAudio.src = src;
    tempAudio.addEventListener("loadedmetadata", () => {
        metaDiv.textContent = formatTime(tempAudio.duration);
    });

    item.addEventListener("click", () => playSongAtIndex(index));
});

nextBtn.addEventListener("click", () => {
    let nextIndex = currentSongIndex + 1;
    if (nextIndex >= musicItems.length) nextIndex = 0;
    playSongAtIndex(nextIndex);
});

prevBtn.addEventListener("click", () => {
    let prevIndex = currentSongIndex - 1;
    if (prevIndex < 0) prevIndex = musicItems.length - 1;
    playSongAtIndex(prevIndex);
});