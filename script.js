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

// Inject CSS for animated background
const styleSheet = document.createElement("style");
styleSheet.textContent = `
    @keyframes gradientBG {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
    }
`;
document.head.appendChild(styleSheet);


let barCount = 90;
let bars = [];
let currentSongIndex = 0;
let isDragging = false;



menuToggle.addEventListener("click", () => {
    const isShowing = navLinks.classList.toggle("show");
    
    // Animate menu toggle icon
    if (isShowing) {
        menuToggle.style.transform = "rotate(90deg)";
    } else {
        menuToggle.style.transform = "rotate(0deg)";
    }
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
    // Add click animation
    playBtn.style.transform = "scale(0.9)";
    setTimeout(() => {
        playBtn.style.transform = "";
    }, 150);
    
    if (audio.paused) {
        audio.play();
        playBtn.src = "pause.png";
        playBtn.style.animation = "pulse 0.3s ease";
    } else {
        audio.pause();
        playBtn.src = "play-button-arrowhead.png";
    }
});

searchInput.addEventListener("input", () => {
    const searchTerm = searchInput.value.toLowerCase();
    const heroSection = document.querySelector(".hero-section");

    // Hide/show playlist section based on search input
    if (heroSection) {
        if (searchTerm.trim() !== "") {
            heroSection.style.display = "none";
        } else {
            heroSection.style.display = "block";
        }
    }

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

function updateDynamicBackground() {
    if (!musicPlayer.classList.contains('expanded')) return;

    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 50;
        canvas.height = 50;
        ctx.drawImage(playerThumb, 0, 0, 50, 50);
        
        const p = ctx.getImageData(25, 25, 1, 1).data;
        const r = p[0], g = p[1], b = p[2];
        const rgba = `rgba(${r},${g},${b}, 0.85)`;
        
        // Calculate luminance to determine text color
        const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        const isDark = luminance < 128;
        const endColor = isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)';

        musicPlayer.style.background = `linear-gradient(135deg, ${rgba}, ${endColor})`;
        musicPlayer.style.backgroundSize = '400% 400%';
        musicPlayer.style.animation = 'gradientBG 15s ease infinite';

        // Update CSS variables for contrast
        const textCol = isDark ? '#ffffff' : '#111111';
        const subTextCol = isDark ? '#cccccc' : '#555555';
        const barBg = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
        
        musicPlayer.style.setProperty('--text-primary', textCol);
        musicPlayer.style.setProperty('--text-secondary', subTextCol);
        musicPlayer.style.setProperty('--bottom-bar-active', textCol);
        musicPlayer.style.setProperty('--bottom-bar-bg', barBg);
        
        // Invert icons if background is dark (assuming icons are black by default)
        const filterVal = isDark ? 'invert(1)' : 'none';
        musicPlayer.querySelectorAll('.player-controls img').forEach(img => img.style.filter = filterVal);

    } catch (e) {
        musicPlayer.style.background = "";
    }
}

thumb.addEventListener('click', () => {
    const isExpanding = !musicPlayer.classList.contains('expanded');
    
    if (isExpanding) {
        // Expanding
        thumb.classList.add('expanded');
        musicPlayer.classList.add('expanded');
        updateDynamicBackground();
        lyricsLinesContainer.style.display = "block";
        
        // Prevent body scroll when expanded
        document.body.style.overflow = 'hidden';
        
        // Animate lyrics container
        setTimeout(() => {
            lyricsLinesContainer.style.opacity = '1';
            lyricsLinesContainer.style.transform = 'translateY(0)';
        }, 300);
    } else {
        // Shrinking
        lyricsLinesContainer.style.opacity = '0';
        lyricsLinesContainer.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            thumb.classList.remove('expanded');
            musicPlayer.classList.remove('expanded');
            
            // Reset dynamic styles
            musicPlayer.style.background = "";
            musicPlayer.style.animation = "";
            musicPlayer.style.removeProperty('--text-primary');
            musicPlayer.style.removeProperty('--text-secondary');
            musicPlayer.style.removeProperty('--bottom-bar-active');
            musicPlayer.style.removeProperty('--bottom-bar-bg');
            musicPlayer.querySelectorAll('.player-controls img').forEach(img => img.style.filter = "");
            
            lyricsLinesContainer.style.display = "none";
            document.body.style.overflow = '';
        }, 400);
    }
});

function playSongAtIndex(index) {
    if (index < 0 || index >= musicItems.length) return;
    currentSongIndex = index;
    const item = musicItems[index];
    const src = item.dataset.src;
    const img = item.dataset.img;

    // Animate thumbnail change
    playerThumb.style.opacity = "0";
    playerThumb.style.transform = "scale(0.9)";
    
    setTimeout(() => {
        playerThumb.onload = () => {
            if (musicPlayer.classList.contains('expanded')) {
                updateDynamicBackground();
            }
        };
        playerThumb.src = img;
        playerThumb.style.opacity = "1";
        playerThumb.style.transform = "scale(1)";
        playerThumb.style.transition = "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";
    }, 150);
    
    audio.src = src;
    audio.play();
    playBtn.src = "pause.png";

    const info = item.querySelector('.info');
    playerTitle.textContent = info.querySelector('.title')?.textContent || "Unknown Title";
    playerArtist.textContent = info.querySelector('.artist')?.textContent || "Unknown Artist";
    
    // Animate text change
    playerTitle.style.opacity = "0";
    playerArtist.style.opacity = "0";
    setTimeout(() => {
        playerTitle.style.opacity = "1";
        playerArtist.style.opacity = "1";
        playerTitle.style.transition = "opacity 0.3s ease";
        playerArtist.style.transition = "opacity 0.3s ease";
    }, 100);

    renderLyrics(index);
    updateWaveformProgress();
    
    // Highlight active song
    musicItems.forEach((song, idx) => {
        if (idx === index) {
            song.style.background = "var(--bg-secondary)";
            song.style.fontWeight = "500";
        } else {
            song.style.background = "";
            song.style.fontWeight = "";
        }
    });
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

    item.addEventListener("click", () => {
        // Add click animation
        item.style.transform = "scale(0.98)";
        setTimeout(() => {
            item.style.transform = "";
        }, 200);
        playSongAtIndex(index);
    });
    
    // Add hover effect for better UX
    item.addEventListener("mouseenter", () => {
        item.style.transition = "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)";
    });
});

nextBtn.addEventListener("click", () => {
    // Add click animation
    nextBtn.style.transform = "translateX(5px) scale(0.9)";
    setTimeout(() => {
        nextBtn.style.transform = "";
    }, 200);
    
    let nextIndex = currentSongIndex + 1;
    if (nextIndex >= musicItems.length) nextIndex = 0;
    playSongAtIndex(nextIndex);
});

prevBtn.addEventListener("click", () => {
    // Add click animation
    prevBtn.style.transform = "translateX(-5px) scale(0.9)";
    setTimeout(() => {
        prevBtn.style.transform = "";
    }, 200);
    
    let prevIndex = currentSongIndex - 1;
    if (prevIndex < 0) prevIndex = musicItems.length - 1;
    playSongAtIndex(prevIndex);
});

// Playlist scroll functionality
const playlistsScroll = document.getElementById("playlistsScroll");
const scrollLeftBtn = document.getElementById("scrollLeftBtn");
const scrollRightBtn = document.getElementById("scrollRightBtn");

if (playlistsScroll && scrollLeftBtn && scrollRightBtn) {
    const scrollAmount = 200;

    scrollLeftBtn.addEventListener("click", () => {
        playlistsScroll.scrollBy({
            left: -scrollAmount,
            behavior: "smooth"
        });
    });

    scrollRightBtn.addEventListener("click", () => {
        playlistsScroll.scrollBy({
            left: scrollAmount,
            behavior: "smooth"
        });
    });

    // Update button visibility based on scroll position
    function updateScrollButtons() {
        const { scrollLeft, scrollWidth, clientWidth } = playlistsScroll;
        
        // Show/hide left button
        if (scrollLeft === 0) {
            scrollLeftBtn.style.opacity = "0.5";
            scrollLeftBtn.style.pointerEvents = "none";
        } else {
            scrollLeftBtn.style.opacity = "1";
            scrollLeftBtn.style.pointerEvents = "auto";
        }

        // Show/hide right button
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
            scrollRightBtn.style.opacity = "0.5";
            scrollRightBtn.style.pointerEvents = "none";
        } else {
            scrollRightBtn.style.opacity = "1";
            scrollRightBtn.style.pointerEvents = "auto";
        }
    }

    // Initial check
    updateScrollButtons();

    // Update on scroll
    playlistsScroll.addEventListener("scroll", updateScrollButtons);

    // Update on window resize
    window.addEventListener("resize", updateScrollButtons);
}

// Theme Toggle Logic
const themeBtn = document.createElement('button');
themeBtn.className = 'theme-toggle';
themeBtn.setAttribute('aria-label', 'Toggle Dark Mode');
document.body.appendChild(themeBtn);

const moonIcon = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
const sunIcon = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';

function updateTheme(isDark) {
    if (isDark) {
        document.body.classList.add('dark-mode');
        themeBtn.innerHTML = sunIcon;
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.remove('dark-mode');
        themeBtn.innerHTML = moonIcon;
        localStorage.setItem('theme', 'light');
    }
}

// Initialize Theme
const savedTheme = localStorage.getItem('theme') === 'dark';
updateTheme(savedTheme);

themeBtn.addEventListener('click', () => {
    const isDark = !document.body.classList.contains('dark-mode');
    updateTheme(isDark);
});
