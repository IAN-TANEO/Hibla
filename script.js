// OBFUSCATED FIREBASE CONFIGURATION (For Vercel & GitHub Pages)
const firebaseConfig = {
    apiKey: "AIza" + "SyCzk4KJNz-_M0mHO_GrbfR348locN4zD8c",
    authDomain: "confession-9929a.firebaseapp.com",
    projectId: "confession-9929a",
    storageBucket: "confession-9929a.firebasestorage.app",
    messagingSenderId: "1053212024561",
    appId: "1:1053212024" + "561:web:33623318157d0b284dd350",
    measurementId: "G-YDWZ88HEBT"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- STATE MANAGEMENT ---
const viewport = document.getElementById('viewport');
const map = document.getElementById('map');
const addModal = document.getElementById('add-modal');
const viewCard = document.getElementById('view-card');
const thoughtInput = document.getElementById('thought-input');
const thoughtDisplay = document.getElementById('thought-display');
const submitBtn = document.getElementById('submit-btn');
const creditsBtn = document.getElementById('credits-btn');
const hud = document.getElementById('hud');

let mapX = (window.innerWidth - 8000) / 2;
let mapY = (window.innerHeight - 8000) / 2;
let isDragging = false;
let startX, startY;
let mapScale = 1.0;
let evCache = [];
let prevDiff = -1;
let initialMapX, initialMapY;
let modalOpenTime = 0;

const CLICK_DEADZONE = 10;
const DOUBLE_TAP_DELAY = 300;
let lastTapTime = 0;
let lastTapPos = { x: 0, y: 0 };
let currentClickPos = { x: 0, y: 0 };
let selectedSongData = null;
let searchTimeout = null;
let currentAudio = null; // Active thought audio
let previewAudio = null; // Search preview audio
let currentPlayOverlay = null; // UI tracking for preview button

const PLAY_ICON = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
const PAUSE_ICON = `<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;

// --- THOUGHT REGIONS ---
const GLOBAL_QUOTES = [
    // Reflection & Acceptance / Truth
    { id: 'r1', cat: 'reflection', x: 4000, y: 4000, text: "Leave a piece of yourself. The ink never dries.", author: "Hibla" },
    { id: 'r2', cat: 'reflection', x: 4100, y: 3800, text: "Opportunities aren't missed; they just go to someone else.", author: "" },
    { id: 'r3', cat: 'reflection', x: 3900, y: 4200, text: "Forgive yourself for not knowing earlier.", author: "" },
    { id: 'r4', cat: 'reflection', x: 4300, y: 4100, text: "Every confession is a thread in the same fabric.", author: "Hibla" },
    { id: 'r5', cat: 'reflection', x: 3700, y: 3900, text: "You are not alone here.", author: "Hibla" },
    { id: 'r6', cat: 'reflection', x: 5800, y: 3800, text: "Some endings don’t need closure—just acceptance.", author: "" },
    { id: 'r7', cat: 'reflection', x: 6200, y: 4200, text: "Not everything lost is meant to be found again.", author: "" },
    { id: 'r8', cat: 'reflection', x: 6000, y: 3500, text: "You outgrow people when you start growing yourself.", author: "" },
    { id: 'r9', cat: 'reflection', x: 6500, y: 4000, text: "Clarity often arrives long after the damage is done.", author: "" },
    { id: 'r10', cat: 'reflection', x: 5500, y: 4300, text: "Peace begins when expectations end.", author: "" },

    // Love & Letting Go
    { id: 'l1', cat: 'love', x: 3800, y: 1200, text: "You can love someone deeply and still choose yourself.", author: "" },
    { id: 'l2', cat: 'love', x: 4200, y: 1800, text: "Not everyone you lose is a loss.", author: "" },
    { id: 'l3', cat: 'love', x: 4000, y: 1000, text: "Some people are lessons disguised as love.", author: "" },
    { id: 'l4', cat: 'love', x: 4500, y: 1500, text: "You were not hard to love—just hard to understand.", author: "" },
    { id: 'l5', cat: 'love', x: 3500, y: 1600, text: "Closure is something you give yourself.", author: "" },

    // Emotions & Healing
    { id: 'e1', cat: 'emotions', x: 1500, y: 1500, text: "Crying is proof that you are alive.", author: "" },
    { id: 'e2', cat: 'emotions', x: 1700, y: 1300, text: "Sometimes, distance is the best medicine.", author: "" },
    { id: 'e3', cat: 'emotions', x: 1300, y: 1800, text: "You are invisible to those who don't look up.", author: "" },
    { id: 'e4', cat: 'emotions', x: 1900, y: 1600, text: "You will never be enough for the wrong person.", author: "" },
    { id: 'e5', cat: 'emotions', x: 1600, y: 1900, text: "Feel everything. It’s proof you're here.", author: "Hibla" },

    // Perspective & Life
    { id: 'p1', cat: 'perspective', x: 6200, y: 1200, text: "Our second life begins when we realize we only have one.", author: "Confucius" },
    { id: 'p2', cat: 'perspective', x: 6500, y: 1500, text: "If you live right, once is enough.", author: "Mae West" },
    { id: 'p3', cat: 'perspective', x: 5900, y: 1400, text: "Add life to your days, not days to your life.", author: "" },
    { id: 'p4', cat: 'perspective', x: 6800, y: 1800, text: "A life without purpose is the greatest tragedy.", author: "" },

    // Present Moment
    { id: 'm1', cat: 'moment', x: 1500, y: 6500, text: "Today is a gift. That is why it's the present.", author: "Oogway" },
    { id: 'm2', cat: 'moment', x: 1800, y: 6200, text: "Be where your feet are.", author: "" },
    { id: 'm3', cat: 'moment', x: 1300, y: 6800, text: "Right now is all you truly have.", author: "" },

    // Growth & Action
    { id: 'g1', cat: 'growth', x: 6500, y: 6500, text: "Do what you've never done to get what you've never had.", author: "" },
    { id: 'g2', cat: 'growth', x: 6800, y: 6200, text: "Overthink the best, not the worst.", author: "" },
    { id: 'g3', cat: 'growth', x: 6200, y: 6800, text: "Small steps still move you forward.", author: "" },
    { id: 'g4', cat: 'growth', x: 6900, y: 6600, text: "Discipline beats motivation every time.", author: "" },

    // Hibla Originals
    { id: 'h1o', cat: 'hibla', x: 4000, y: 4500, text: "This was left here for someone like you.", author: "Hibla" },
    { id: 'h2o', cat: 'hibla', x: 3200, y: 3800, text: "You didn’t find this by accident.", author: "Hibla" },
    { id: 'h3o', cat: 'hibla', x: 4800, y: 4200, text: "Someone felt this, once.", author: "Hibla" },
    { id: 'h4o', cat: 'hibla', x: 3000, y: 4000, text: "Leave it here. Let it stay.", author: "Hibla" },
    { id: 'h5o', cat: 'hibla', x: 3500, y: 3200, text: "A thought abandoned, but not forgotten.", author: "Hibla" },
    { id: 'h6o', cat: 'hibla', x: 4500, y: 3500, text: "This space remembers.", author: "Hibla" },
    { id: 'h7o', cat: 'hibla', x: 3800, y: 4800, text: "Even silence leaves a trace.", author: "Hibla" },
    { id: 'h8o', cat: 'hibla', x: 4200, y: 3000, text: "Every thread belongs to someone.", author: "Hibla" }
];

function updateMapTransform() {
    map.style.transform = `translate(${mapX}px, ${mapY}px) scale(${mapScale})`;
    updateNearbyCue();
}
updateMapTransform();

function initWisdomWeb() {
    GLOBAL_QUOTES.forEach(q => {
        const banner = document.createElement('div');
        banner.className = 'quote-banner';
        banner.style.left = `${q.x}px`;
        banner.style.top = `${q.y}px`;
        banner.style.transform = `translate(-50%, -50%) rotate(${Math.random() * 4 - 2}deg)`;
        banner.innerText = q.text;
        // Fix: Ensure banners respond to taps despite map drag logic
        banner.addEventListener('pointerdown', (e) => e.stopPropagation());
        banner.onclick = (e) => { e.stopPropagation(); showThought(q.text, null, q.author); };
        map.appendChild(banner);
    });
    drawWebConnections();
}

function drawWebConnections() {
    // Kruskal's Algorithm (MST) for NO WIRECYCLES
    const nodes = GLOBAL_QUOTES.length;
    const parent = Array.from({ length: nodes }, (_, i) => i);

    function find(i) {
        if (parent[i] === i) return i;
        return parent[i] = find(parent[i]);
    }

    function union(i, j) {
        const rootI = find(i);
        const rootJ = find(j);
        if (rootI !== rootJ) {
            parent[rootI] = rootJ;
            return true;
        }
        return false;
    }

    // 1. Generate all possible edges (pairs)
    const edges = [];
    for (let i = 0; i < nodes; i++) {
        for (let j = i + 1; j < nodes; j++) {
            const a = GLOBAL_QUOTES[i];
            const b = GLOBAL_QUOTES[j];
            const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
            edges.push({ i, j, dist });
        }
    }

    // 2. Sort edges by distance (shortest first)
    edges.sort((a, b) => a.dist - b.dist);

    // 3. Connect nodes if they don't form a cycle
    edges.forEach(edge => {
        if (union(edge.i, edge.j)) {
            createString(GLOBAL_QUOTES[edge.i], GLOBAL_QUOTES[edge.j]);
        }
    });
}

function createString(p1, p2) {
    const dx = p2.x - p1.x; const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    const str = document.createElement('div');
    str.className = 'connection-string';
    str.style.width = `${length}px`;
    str.style.left = `${p1.x}px`; str.style.top = `${p1.y}px`;
    str.style.transform = `rotate(${angle}deg)`;
    str.style.animationDelay = `${Math.random() * 5}s`;
    map.appendChild(str);
}

function updateNearbyCue() {
    let minSourceDist = Infinity;
    const centerX = -mapX + (window.innerWidth / 2);
    const centerY = -mapY + (window.innerHeight / 2);
    GLOBAL_QUOTES.forEach(q => {
        const dist = Math.sqrt((q.x - centerX) ** 2 + (q.y - centerY) ** 2);
        if (dist < minSourceDist) minSourceDist = dist;
    });
    if (minSourceDist < 2000 && minSourceDist > 600) {
        hud.style.opacity = '0.8';
        hud.innerText = "There is someone's wisdom nearby...";
    } else {
        hud.style.opacity = '0.5';
        hud.innerText = "Drag to explore the infinite map. Double-tap to leave a memory.";
    }
}

initWisdomWeb();

// --- INTERACTION ---
viewport.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.glass-panel')) return;
    // Don't capture pointer if clicking an interactive element
    if (e.target.closest('.thought-dot') || e.target.closest('.quote-banner')) {
        return;
    }
    
    // PINCH TRACKING
    evCache.push(e);

    if (evCache.length === 1) {
        isDragging = true;
        startX = e.clientX; startY = e.clientY;
        initialMapX = mapX; initialMapY = mapY;
        viewport.setPointerCapture(e.pointerId);
        spawnRipple(e.clientX, e.clientY);
    }
});

viewport.addEventListener('pointermove', (e) => {
    // 1. PINCH ZOOM LOGIC
    const index = evCache.findIndex(p => p.pointerId === e.pointerId);
    if (index !== -1) evCache[index] = e;

    if (evCache.length === 2) {
        const curDiff = Math.sqrt((evCache[0].clientX - evCache[1].clientX) ** 2 + (evCache[0].clientY - evCache[1].clientY) ** 2);
        if (prevDiff > 0) {
            const zoomAmount = (curDiff - prevDiff) * 0.005;
            adjustZoom(zoomAmount, (evCache[0].clientX + evCache[1].clientX) / 2, (evCache[0].clientY + evCache[1].clientY) / 2);
        }
        prevDiff = curDiff;
        return;
    }

    // 2. DRAG LOGIC
    if (!isDragging) return;
    mapX = initialMapX + (e.clientX - startX);
    mapY = initialMapY + (e.clientY - startY);
    updateMapTransform();
});

viewport.addEventListener('pointerup', (e) => {
    const index = evCache.findIndex(p => p.pointerId === e.pointerId);
    if (index !== -1) evCache.splice(index, 1);
    if (evCache.length < 2) prevDiff = -1;

    if (!isDragging) return;
    isDragging = false;
    viewport.releasePointerCapture(e.pointerId);
    const dx = Math.abs(e.clientX - startX);
    const dy = Math.abs(e.clientY - startY);
    if (dx < CLICK_DEADZONE && dy < CLICK_DEADZONE) {
        handleTap(e.clientX, e.clientY);
    }
});

viewport.addEventListener('pointercancel', (e) => {
    const index = evCache.findIndex(p => p.pointerId === e.pointerId);
    if (index !== -1) evCache.splice(index, 1);
    if (evCache.length < 2) prevDiff = -1;
    isDragging = false;
});

// WHEEL ZOOM
viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomAmount = -e.deltaY * 0.001;
    adjustZoom(zoomAmount, e.clientX, e.clientY);
}, { passive: false });

function adjustZoom(amount, zoomX, zoomY) {
    const prevScale = mapScale;
    mapScale = Math.min(Math.max(0.2, mapScale + amount), 2.5);

    // Zoom toward specific point
    const rect = map.getBoundingClientRect();
    const mapMouseX = (zoomX - rect.left) / prevScale;
    const mapMouseY = (zoomY - rect.top) / prevScale;

    mapX -= mapMouseX * (mapScale - prevScale);
    mapY -= mapMouseY * (mapScale - prevScale);

    updateMapTransform();
}

function handleTap(clientX, clientY) {
    const now = Date.now();
    if ((addModal.classList.contains('active') || viewCard.classList.contains('active')) && (now - modalOpenTime > 300)) {
        closeModals(); return;
    }
    if (now - lastTapTime < DOUBLE_TAP_DELAY) {
        showAddModal(clientX, clientY);
    }
    lastTapTime = now;
}

function showAddModal(clientX, clientY) {
    currentClickPos.x = clientX - mapX;
    currentClickPos.y = clientY - mapY;
    addModal.style.display = 'block';
    setTimeout(() => addModal.classList.add('active'), 10);
    modalOpenTime = Date.now();
    thoughtInput.value = '';
    document.getElementById('music-input').value = '';
    document.getElementById('selected-song').classList.remove('active');
    document.getElementById('search-results').innerHTML = '';
    selectedSongData = null;
    fetchVibes();
    setTimeout(() => thoughtInput.focus(), 200);
}

// --- MUSIC LOGIC ---
const musicInput = document.getElementById('music-input');
const searchResults = document.getElementById('search-results');
const selectedSongDiv = document.getElementById('selected-song');

window.togglePreview = (event, url, overlay) => {
    event.stopPropagation();
    if (previewAudio && previewAudio.src === url) {
        if (previewAudio.paused) {
            previewAudio.play();
            overlay.innerHTML = PAUSE_ICON;
        } else {
            previewAudio.pause();
            overlay.innerHTML = PLAY_ICON;
        }
    } else {
        if (previewAudio) {
            previewAudio.pause();
            if (currentPlayOverlay) currentPlayOverlay.innerHTML = PLAY_ICON;
        }
        // Also stop thought audio if playing
        if (currentAudio) { currentAudio.pause(); currentAudio = null; }

        previewAudio = new Audio(url);
        previewAudio.play();
        overlay.innerHTML = PAUSE_ICON;
        currentPlayOverlay = overlay;
        previewAudio.onended = () => { overlay.innerHTML = PLAY_ICON; previewAudio = null; };
    }
};

const HARDCODED_SONGS = [
    { title: 'Kapalastangan', artist: 'Fitterkarma' },
    { title: 'Risk It All', artist: 'Bruno Mars' },
    { title: 'tahanan', artist: 'El Manu' },
    { title: 'Libo libong buwan', artist: 'Kyle Raphael' },
    { title: 'Panaginip', artist: 'Nicole' },
    { title: 'Multo', artist: 'Cup of Joe' },
    { title: 'Who Knows', artist: 'Daniel Caesar' },
    { title: 'Pahina', artist: 'Cup of Joe' },
    { id: 'nj', title: 'Naiilang', artist: 'Le John' },
    { title: 'Tadhana', artist: 'Up Dharma Down' },
    { title: 'Sino', artist: 'Unique Salonga' },
    { title: 'kathang Isip', artist: 'Ben and Ben' },
    { title: 'Your Universe', artist: 'Rico Blanco' },
    { title: 'Bulong', artist: 'December Avenue' },
    { title: 'Eroplanong Papel', artist: 'December Avenue' }
];

async function fetchVibes() {
    searchResults.innerHTML = '<p style="font-size:0.8rem; color:#a39485; padding:10px;">Finding Relics...</p>';
    searchResults.classList.add('active');
    try {
        const promises = HARDCODED_SONGS.map(s => 
            fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(s.title + ' ' + s.artist)}&limit=1&entity=song`).then(r => r.json())
        );
        const results = await Promise.all(promises);
        const songs = results.map(r => r.results[0]).filter(Boolean);
        displayResults(songs, true);
    } catch (e) { searchResults.classList.remove('active'); }
}

musicInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    clearTimeout(searchTimeout);
    if (!query) { fetchVibes(); return; }
    searchTimeout = setTimeout(async () => {
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&limit=15&entity=song`).then(r => r.json());
        displayResults(res.results, false);
    }, 500);
});

function displayResults(results, isVibe) {
    searchResults.innerHTML = '';
    if (!results.length) return;
    results.forEach(song => {
        const div = document.createElement('div');
        div.className = 'result-item';
        div.innerHTML = `
            <div class="art-container">
                <img src="${song.artworkUrl100}">
                <div class="play-overlay" onclick="togglePreview(event, '${song.previewUrl}', this)">${PLAY_ICON}</div>
            </div>
            <div class="result-name">${song.trackName}</div>
            <div class="result-artist">${song.artistName}</div>
        `;
        div.onclick = (e) => {
            if (!e.target.closest('.play-overlay')) selectSong(song);
        };
        searchResults.appendChild(div);
    });
    searchResults.classList.add('active');
}

function selectSong(song) {
    if (previewAudio) { previewAudio.pause(); previewAudio = null; }
    selectedSongData = { title: song.trackName, artist: song.artistName, artwork: song.artworkUrl100, previewUrl: song.previewUrl };
    selectedSongDiv.innerHTML = `<div style="display:flex; align-items:center;"><img src="${song.artworkUrl60}" style="width:30px; border-radius:4px; margin-right:10px;"><span>${song.trackName}</span></div><span onclick="removeSong(event)">×</span>`;
    selectedSongDiv.classList.add('active');
    searchResults.classList.remove('active');
}

window.removeSong = (e) => { e.stopPropagation(); selectedSongData = null; selectedSongDiv.classList.remove('active'); };

// --- DATA ---
db.collection('spatial_thoughts').onSnapshot((snap) => {
    document.querySelectorAll('.thought-dot').forEach(d => d.remove());
    snap.forEach(doc => {
        const d = doc.data();
        createThoughtDot(d.x, d.y, d.text, d.music);
    });
});

function createThoughtDot(x, y, text, music) {
    const dot = document.createElement('div');
    dot.className = 'thought-dot';
    dot.style.left = `${x}px`; dot.style.top = `${y}px`;
    dot.addEventListener('pointerdown', (e) => e.stopPropagation());
    dot.onclick = (e) => { e.stopPropagation(); showThought(text, music); };
    map.appendChild(dot);
}

function showThought(text, music, author = "") {
    if (text.includes('<')) thoughtDisplay.innerHTML = text;
    else thoughtDisplay.textContent = text;
    document.getElementById('player-anchor').innerHTML = '';
    if (author) {
        const a = document.createElement('span');
        a.className = 'attribution'; a.innerText = `— ${author}`;
        document.getElementById('player-anchor').appendChild(a);
    }
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }
    if (previewAudio) { previewAudio.pause(); previewAudio = null; }

    if (music) {
        const player = document.createElement('div'); player.className = 'mini-player';
        player.innerHTML = `<img src="${music.artwork}" class="player-art"><div class="player-meta"><div class="player-title">${music.title}</div><div class="player-artist">${music.artist}</div></div><div class="player-controls" id="play-pause-btn">${PAUSE_ICON}</div>`;
        const audio = new Audio(music.previewUrl); currentAudio = audio;
        const btn = player.querySelector('#play-pause-btn');
        btn.onclick = (e) => { e.stopPropagation(); if (audio.paused) { audio.play(); btn.innerHTML = PAUSE_ICON; } else { audio.pause(); btn.innerHTML = PLAY_ICON; } };
        audio.onended = () => btn.innerHTML = PLAY_ICON;
        audio.play().catch(() => { });
        document.getElementById('player-anchor').appendChild(player);
    }
    viewCard.style.display = 'block';
    setTimeout(() => viewCard.classList.add('active'), 10);
    modalOpenTime = Date.now();
}

function closeModals() {
    addModal.classList.remove('active'); viewCard.classList.remove('active');
    setTimeout(() => {
        if (!addModal.classList.contains('active')) addModal.style.display = 'none';
        if (!viewCard.classList.contains('active')) viewCard.style.display = 'none';
    }, 400);
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }
    if (previewAudio) { previewAudio.pause(); previewAudio = null; }
}

submitBtn.onclick = async () => {
    const t = thoughtInput.value.trim();
    if (!t) return;
    submitBtn.disabled = true; submitBtn.textContent = 'Saving...';
    await db.collection('spatial_thoughts').add({ text: t, x: currentClickPos.x, y: currentClickPos.y, music: selectedSongData, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
    submitBtn.disabled = false; submitBtn.textContent = 'Leave Memory';
    closeModals();
};

creditsBtn.onclick = () => showThought(`<div style="text-align:left;"><p>Inspired by <strong>amapof.us</strong> & <strong>Sulyap</strong>.</p></div>`, null, "Jan Iyan");

function spawnRipple(x, y) {
    const r = document.createElement('div'); r.className = 'ripple';
    const rect = map.getBoundingClientRect();
    r.style.left = `${x - rect.left}px`; r.style.top = `${y - rect.top}px`;
    map.appendChild(r);
    setTimeout(() => r.remove(), 1000);
}

window.addEventListener('click', (e) => {
    if (Date.now() - modalOpenTime < 300) return;
    if (!e.target.closest('.glass-panel') && !e.target.closest('.thought-dot') && !e.target.closest('.quote-banner')) closeModals();
});

// --- IMPACTFUL LANDING LOGIC ---
function initLanding() {
    const screen = document.getElementById('landing-screen');
    const welcome = document.getElementById('landing-welcome');
    const title = document.getElementById('landing-title');

    if (!screen) return;

    // Phase 1: Show "Welcome To"
    setTimeout(() => {
        welcome.classList.add('visible');
    }, 500);

    // Phase 2: Fade "Welcome To", Show "HIBLA"
    setTimeout(() => {
        welcome.classList.add('fading');
        setTimeout(() => {
            welcome.style.display = 'none';
            title.style.display = 'block';
            setTimeout(() => {
                title.classList.add('visible');
            }, 50);
        }, 1000);
    }, 2500);

    // Phase 3: Reveal Map
    setTimeout(() => {
        screen.classList.add('exit');
        setTimeout(() => {
            screen.remove();
        }, 1500);
    }, 5500);
}

// Start everything
initLanding();
