import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js";

// Firebase 설정값
const firebaseConfig = {
    apiKey: "AIzaSyBMhqNc-TwZYMO2Vp_M-TqtVIg60hwAk50",
    authDomain: "apffhs-e881c.firebaseapp.com",
    projectId: "apffhs-e881c",
    storageBucket: "apffhs-e881c.firebasestorage.app",
    messagingSenderId: "16383599274",
    appId: "1:16383599274:web:20ecee5e9d9cfe46a326d3",
    measurementId: "G-2CGFKM1NW3"
};

// 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

const audio = document.getElementById('audioPlayer');
const playBtn = document.getElementById('playBtn');
const playlistContainer = document.getElementById('playlistContainer');
const nowPlayingText = document.getElementById('nowPlayingText');

let playlistData = [];
let currentIndex = 0;

// HTML 내에서 onclick으로 부를 수 있도록 window 전역 객체에 함수 등록 (모듈 방식 필수 작업)
window.switchTab = function(tabId, btn) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.main-tab-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    btn.classList.add('active');
};

// 실시간 동기화 (Firestore)
const q = query(collection(db, "playlist"), orderBy("createdAt", "desc"));
onSnapshot(q, (snapshot) => {
    playlistData = [];
    snapshot.forEach((doc) => {
        playlistData.push({ id: doc.id, ...doc.data() });
    });
    renderPlaylist();
    if (playlistData.length > 0 && !audio.src) {
        loadTrack(currentIndex);
    }
});

// 플레이리스트 렌더링
function renderPlaylist() {
    playlistContainer.innerHTML = '';
    
    playlistData.forEach((track, index) => {
        const li = document.createElement('li');
        li.onclick = () => {
            currentIndex = index;
            loadTrack(currentIndex);
            audio.play();
            playBtn.innerText = "⏸";
        };
        li.innerHTML = `
            <div class="album-art">♪</div>
            <div class="track-info">
                <div class="track-title">${track.title}</div>
                <div class="track-artist">${track.artist}</div>
            </div>
        `;
        playlistContainer.appendChild(li);
    });
}

// 곡 로드 및 백그라운드 제어 (Media Session API)
function loadTrack(index) {
    if (playlistData.length === 0) return;
    const track = playlistData[index];
    audio.src = track.src;
    nowPlayingText.innerText = `${track.title}`;
    
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.title,
            artist: track.artist,
            album: '내 손안의 멜론'
        });

        navigator.mediaSession.setActionHandler('play', () => window.togglePlay());
        navigator.mediaSession.setActionHandler('pause', () => window.togglePlay());
        navigator.mediaSession.setActionHandler('previoustrack', () => window.prevTrack());
        navigator.mediaSession.setActionHandler('nexttrack', () => window.nextTrack());
    }
}

// 파일 업로드 및 클라우드 동기화 추가
window.addNewTrack = async function() {
    const fileInput = document.getElementById('inputFile');
    if (fileInput.files.length === 0) {
        alert("음악 파일을 선택해주세요!");
        return;
    }

    const file = fileInput.files[0];
    const fileName = file.name;
    const title = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.innerText = "업로드 중... (잠시만요)";
    submitBtn.disabled = true;

    try {
        // 1. Storage에 파일 업로드
        const storageRef = ref(storage, 'songs/' + Date.now() + '_' + fileName);
        const snapshot = await uploadBytes(storageRef, file);
        
        // 2. 다운로드 URL 획득
        const downloadURL = await getDownloadURL(snapshot.ref);

        // 3. Firestore에 데이터 저장
        await addDoc(collection(db, "playlist"), {
            title: title,
            artist: "내 기기",
            src: downloadURL,
            createdAt: serverTimestamp()
        });

        alert(`"${title}" 곡이 클라우드에 성공적으로 업로드되었습니다!`);
        fileInput.value = '';
        window.switchTab('playerTab', document.querySelectorAll('.main-tab-btn')[0]);

    } catch (error) {
        console.error("업로드 실패:", error);
        alert("업로드 중 오류가 발생했습니다.");
    } finally {
        submitBtn.innerText = "플레이리스트에 추가하기";
        submitBtn.disabled = false;
    }
};

// 재생 제어
window.togglePlay = function() {
    if (playlistData.length === 0) return;
    
    if (audio.paused) {
        if (!audio.src) loadTrack(currentIndex);
        audio.play().then(() => {
            playBtn.innerText = "⏸";
        }).catch(err => console.log("재생 에러:", err));
    } else {
        audio.pause();
        playBtn.innerText = "▶";
    }
};

window.nextTrack = function() {
    if (playlistData.length === 0) return;
    currentIndex = (currentIndex + 1) % playlistData.length;
    loadTrack(currentIndex);
    audio.play();
    playBtn.innerText = "⏸";
};

window.prevTrack = function() {
    if (playlistData.length === 0) return;
    currentIndex = (currentIndex - 1 + playlistData.length) % playlistData.length;
    loadTrack(currentIndex);
    audio.play();
    playBtn.innerText = "⏸";
};

audio.addEventListener('ended', window.nextTrack);
