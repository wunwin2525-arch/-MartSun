// 본인의 파이어베이스 설정값
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

// 페이지가 로드되면 목록 불러오기 실행
window.onload = function() {
    loadPlaylist();
};

// 1. 파이어베이스 Firestore에 유튜브 iframe 코드 추가
function addEmbedSong() {
    const textarea = document.getElementById('embedCodeInput');
    const embedCode = textarea.value.trim();

    // 간단한 iframe 태그 검증
    if (!embedCode.includes("<iframe") || !embedCode.includes("src=")) {
        alert("올바른 유튜브 퍼가기(iframe) 코드가 아닙니다! 코드를 다시 확인해주세요.");
        return;
    }

    db.collection("songs").add({
        embedHtml: embedCode,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        alert("플레이리스트에 추가되었습니다!");
        textarea.value = ""; // 입력창 초기화
        loadPlaylist();     // 목록 새로고침
    })
    .catch((error) => {
        console.error("추가 실패: ", error);
        alert("추가 중 오류가 발생했습니다.");
    });
}

// 2. 파이어베이스에서 목록을 가져와 화면에 렌더링
function loadPlaylist() {
    const songListDiv = document.getElementById('songList');
    if (!songListDiv) return;
    songListDiv.innerHTML = "";

    db.collection("songs").orderBy("createdAt", "desc").get()
    .then((querySnapshot) => {
        if (querySnapshot.empty) {
            songListDiv.innerHTML = "<p style='color: #777;'>등록된 곡이 없습니다.</p>";
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const embedHtml = data.embedHtml;

            const item = document.createElement('div');
            item.className = 'song-item';
            item.innerHTML = `
                <span>🎵 등록된 음악 곡</span>
                <div>
                    <button class="play-btn" onclick='playSong(${JSON.stringify(embedHtml)})'>재생</button>
                    <button onclick="deleteSong('${doc.id}')">삭제</button>
                </div>
            `;
            songListDiv.appendChild(item);
        });
    })
    .catch((error) => {
        console.error("목록 불러오기 실패:", error);
    });
}

// 3. 곡 재생 함수 (상단 플레이어 영역에 iframe 코드를 그대로 주입)
function playSong(embedHtml) {
    const activePlayer = document.getElementById('activePlayer');
    activePlayer.innerHTML = embedHtml;
}

// 4. 곡 삭제 함수
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
