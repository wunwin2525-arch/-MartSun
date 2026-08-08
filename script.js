// 제공해주신 파이어베이스 설정값 적용 완료
const firebaseConfig = {
    apiKey: "AIzaSyBMhqNc-TwZYMO2Vp_M-TqtVIg60hwAk50",
    authDomain: "apffhs-e881c.firebaseapp.com",
    projectId: "apffhs-e881c",
    storageBucket: "apffhs-e881c.firebasestorage.app",
    messagingSenderId: "16383599274",
    appId: "1:16383599274:web:20ecee5e9d9cfe46a326d3",
    measurementId: "G-2CGFKM1NW3"
};

// 파이어베이스 초기화
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let player;
let currentVideoId = null;

// 유튜브 IFrame API가 준비되면 호출됨
function onYouTubeIframeAPIReady() {
    player = new YT.Player('youtube-player', {
        height: '0',
        width: '0',
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    console.log("유튜브 플레이어 준비 완료");
    loadPlaylist(); // 플레이어 준비 후 목록 불러오기
}

function onPlayerStateChange(event) {
    // 재생 상태 변경 시 처리할 내용 (필요한 경우 작성)
}

// 1. 유튜브 URL에서 비디오 ID 추출 함수
function getYoutubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// 2. 파이어베이스 Firestore에 유튜브 링크 추가
function addYouTubeSong() {
    const urlInput = document.getElementById('youtubeUrl');
    const url = urlInput.value.trim();
    const videoId = getYoutubeId(url);

    if (!videoId) {
        alert("올바른 유튜브 링크가 아닙니다!");
        return;
    }

    db.collection("songs").add({
        url: videoId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        alert("플레이리스트에 추가되었습니다!");
        urlInput.value = ""; // 입력창 초기화
        loadPlaylist();     // 목록 새로고침
    })
    .catch((error) => {
        console.error("추가 실패: ", error);
        alert("추가 중 오류가 발생했습니다.");
    });
}

// 3. 파이어베이스에서 목록을 가져와 화면에 렌더링
function loadPlaylist() {
    const songListDiv = document.getElementById('songList');
    if (!songListDiv) return;
    songListDiv.innerHTML = "";

    db.collection("songs").orderBy("createdAt", "desc").get()
    .then((querySnapshot) => {
        if (querySnapshot.empty) {
            songListDiv.innerHTML = "<p>등록된 곡이 없습니다.</p>";
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const videoId = data.url;

            const item = document.createElement('div');
            item.className = 'song-item';
            item.innerHTML = `
                <span>🎵 유튜브 곡 (${videoId})</span>
                <div>
                    <button onclick="playSong('${videoId}')">재생</button>
                    <button onclick="deleteSong('${doc.id}')">삭제</button>
                </div>
            `;
            songListDiv.appendChild(item);
        });
    });
}

// 4. 곡 재생 함수
function playSong(videoId) {
    if (player && player.loadVideoById) {
        player.loadVideoById(videoId);
        currentVideoId = videoId;
        console.log("재생 시작:", videoId);
    }
}

// 5. 곡 삭제 함수
function deleteSong(docId) {
    if (confirm("정말 삭제하시겠습니까?")) {
        db.collection("songs").doc(docId).delete()
        .then(() => {
            loadPlaylist();
        })
        .catch((error) => {
            console.error("삭제 실패: ", error);
        });
    }
}
