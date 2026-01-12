let myID = null;
let postID = null;
let visitorID = null;
const boardData = [];
const visitorData = [];

function renderBoard() {
    // 1. 타겟 가져오기 (querySelector를 써보세요!)
    const homeBoardList = document.querySelector('#home-board-list');
    const fullBoardList = document.querySelector('#full-board-list');

    if (homeBoardList) homeBoardList.innerHTML = '';
    if (fullBoardList) fullBoardList.innerHTML = '';


    let boardHtmlCollector = '';

    // 2. 데이터 반복문 돌리기
    for (let i = 0; i < boardData.length; i++) {
        // 현재 순서의 데이터 가져오기
        const post = boardData[i];

        // 3. HTML 덩어리 만들기 (템플릿 리터럴 ` ` 을 쓰면 편해요!)
        boardHtmlCollector += `
    <div class="board-row">
        <span class="board-col-id">${post.id}</span>
        <span class="board-col-title" onclick="loadSinglePost(${post.id})">${post.title}</span>
        <span class="board-col-writer">${post.username || '익명'}</span> 
        <span class="board-col-date">${new Date(post.created_at).toLocaleDateString()}</span>
    </div>
`;
    }

    // 4. 화면에 추가하기 (기존 내용 뒤에 계속 붙여야 해요!)
    if (homeBoardList) homeBoardList.innerHTML = boardHtmlCollector;
    if (fullBoardList) fullBoardList.innerHTML = boardHtmlCollector;
}

function renderSingleBoard(post) {
    const fullBoardList = document.querySelector('#full-board-list');
    const singleBoard = document.querySelector('#single-board');
    const header = document.querySelector('#board-view .board-row.header');

    //verification
    const isOwner = (myID === post.writer_id);

    fullBoardList.style.display = 'none';
    if (header) header.style.display = 'none';
    singleBoard.style.display = 'block';

    singleBoard.innerHTML = `
        <div class="board-detail-container">
            <h3 class="post-title">${post.title}</h3>
            <p class="post-info">No. ${post.id} | Date: ${new Date(post.created_at).toLocaleDateString()}</p>
            <div class="post-content">${post.content}</div>
            <div class="detail-buttons">
                <button class="back-btn" onclick="backToBoardList()">Back</button>
                ${isOwner ? `
                    <button class="edit-post-btn" onclick="openEditModal(${post.id})">Edit</button>
                    <button class="delete-post-btn" onclick="handleDeletePost(${post.id})">Delete</button>
                    `: ''}
                </div>
        </div>
    `;
}

function backToBoardList() {
    document.querySelector('#full-board-list').style.display = 'block';
    document.querySelector('#board-view .board-row.header').style.display = 'flex';
    document.querySelector('#single-board').style.display = 'none';
}

function renderVisitor() {
    // 1. 타겟 가져오기 (querySelector를 써보세요!)
    const homeVisitorList = document.querySelector('#home-visitor-list');
    const fullVisitorList = document.querySelector('#full-visitor-list');

    if (homeVisitorList) homeVisitorList.innerHTML = '';
    if (fullVisitorList) fullVisitorList.innerHTML = '';

    let visitorHtmlCollector = '';

    // 2. 데이터 반복문 돌리기
    for (let i = 0; i < visitorData.length; i++) {
        // 현재 순서의 데이터 가져오기
        const visitor = visitorData[i];
        console.log("writer ID:", visitor.writer_id, "my ID:", myID);
        // 3. HTML 덩어리 만들기 (템플릿 리터럴 ` ` 을 쓰면 편해요!)
        visitorHtmlCollector += `
            <div class="visitor-row">
                <span class="visitor-col-writer">${visitor.username}</span>
                <span class="visitor-col-content">${visitor.content}</span>
                <span class="visitor-col-date">${new Date(visitor.created_at).toLocaleDateString()}</span>

                <span class="visitor-col-action">
                    ${Number(visitor.writer_id) === Number(myID) ? `
                        <button class="del-btn" onclick="handleDeleteVisitor(${visitor.id})">Delete</button>
                        ` : ''}
                </span>
            </div>
        `;
    }

    // 4. 화면에 추가하기 (기존 내용 뒤에 계속 붙여야 해요!)
    if (homeVisitorList) homeVisitorList.innerHTML = visitorHtmlCollector;
    if (fullVisitorList) fullVisitorList.innerHTML = visitorHtmlCollector;
}

function switchTab(tabName) {
    const homeView = document.querySelector('#home-view');
    const boardView = document.querySelector('#board-view');
    const visitorView = document.querySelector('#visitor-view');
    const profileView = document.querySelector('#profile-view');

    //일단 다 끄기
    homeView.style.display = 'none';
    visitorView.style.display = 'none';
    boardView.style.display = 'none';
    profileView.style.display = 'none';

    //선택된 것만 ㅋ기
    if (tabName === 'home') {
        homeView.style.display = 'flex';
        homeView.style.flexDirection = 'column';
    } else if (tabName === 'board') {
        boardView.style.display = 'flex';
        boardView.style.flexDirection = 'column';
    } else if (tabName === 'visitor') {
        visitorView.style.display = 'flex';
        visitorView.style.flexDirection = 'column';
    } else if (tabName === 'profile') {
        profileView.style.display = 'flex';
        profileView.style.flexDirection = 'column';
    }
}

//이벤트 리스너 연결
document.querySelector('#tab-home').addEventListener('click', () => switchTab('home'));
document.querySelector('#tab-board').addEventListener('click', () => switchTab('board'));
document.querySelector('#tab-visitor').addEventListener('click', () => switchTab('visitor'));
document.querySelector('#tab-profile').addEventListener('click', () => switchTab('profile'));

async function loadPosts(ownerID) {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {

        const response = await fetch('http://localhost:3000/api/posts', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (result.success) {
            boardData.length = 0;
            boardData.push(...result.posts);
            renderBoard();
        }

    } catch (err) {
        console.error("Failed to loading posts: ", err);
    }
}

async function loadSinglePost(id) {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {

        const response = await fetch(`http://localhost:3000/api/posts/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (result.success) {
            renderSingleBoard(result.post);
        }

    } catch (err) {
        console.error("Failed to loading single post: ", err);
    }
}

async function handleDeletePost(id) {
    if (!confirm("Are you sure you want to delete this post?")) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`http://localhost:3000/api/posts/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (result.success) {
            alert("post delete successfully!");
            backToBoardList();
            loadPosts(); //refresh
        }

    } catch (err) {
        console.error("Failed to delete post : ", err);
    }

}

async function loadVisitor(ownerID) {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {

        const response = await fetch(`http://localhost:3000/api/${ownerID}/visitor`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();
        console.log(result.ilchon_pyeong[0]);
        console.log("visitor server response : ", result);
        if (result.success) {
            //to prevent duplication
            visitorData.length = 0;
            visitorData.push(...result.ilchon_pyeong);
            renderVisitor();
        }

    } catch (err) {
        console.error("Failed to loading visitor: ", err);
    }
}

async function loadMyInfo() {
    const token = localStorage.getItem('token');

    if (!token) {
        alert("Need to login");
        window.location.href = "login.html";
        return;
    }
    try {

        const response = await fetch('http://localhost:3000/api/user/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (result.success) {
            const user = result.user;
            if (myID === null) {
                myID = user.id;
                console.log("Save my login id", myID);
            }

            const owner_id = user.id;
            console.log("cyworld owner_id", owner_id);

            // 1. 텍스트 정보들을 먼저 업데이트 하세요 (버튼, 도토리, 메시지)
            // sidebar
            document.querySelector('#cyworld_name button').innerText = user.cyworld_name;
            document.querySelector('#dotori').innerHTML = `
            <img src="images/dotori.png" style="width: 20px; vertical-align:middle">
            Dotori x ${user.dotori_count || 0}
        `;

            document.querySelector('#message').childNodes[0].textContent = `Welcome to ${user.username}'s minihompy🖤 `;

            // profile-detail
            document.querySelector('#profile-dotori').innerHTML = `
            <img src="images/dotori.png" style="width: 20px; vertical-align:middle">
            Dotori x ${user.dotori_count || 0}
        `;

            document.querySelector('#profile-name').textContent = `${user.cyworld_name}(${user.username})`
            document.querySelector('#profile-message').textContent = `Welcome to ${user.username}'s minihompy🤍 `;

            //sidebar profile image
            const profileBox = document.querySelector('#profile_image');
            //profile-detail profile image
            const profileDetailBox = document.querySelector('#profile-detail-image');

            //profile-image
            let rawUrl = user.profile_image_url;
            let finalImgUrl = '';

            if (rawUrl) {
                // 1. 이미 http로 시작하는지 확인
                if (rawUrl.startsWith('http')) {
                    finalImgUrl = rawUrl;
                }
                // 2. DB값이 /images/... 처럼 슬래시로 시작하는 경우
                else if (rawUrl.startsWith('/')) {
                    finalImgUrl = `http://localhost:3000${rawUrl}`;
                }
                // 3. 슬래시 없이 시작하는 경우
                else {
                    finalImgUrl = `http://localhost:3000/${rawUrl}`;
                }
            } else {
                finalImgUrl = 'images/default_profile.png';
            }

            console.log("Final address:", finalImgUrl);

            // 박스 안을 싹 비우고 새 이미지 태그를 꽂아넣습니다.
            profileBox.innerHTML = `<img src="${finalImgUrl}" style="width: 100%; height: 300px; display: block !important;">`;
            profileDetailBox.innerHTML = `<img src="${finalImgUrl}" style="width: 100%; height: 300px; display: block !important;">`;

            const settingBtn = document.querySelector('#profile-setting-btn');
            //logout
            const logoutBtn = document.querySelector('#logout_btn');
            if (myID === owner_id) {
                settingBtn.style.display = 'block';
                logoutBtn.style.display = 'block';
            } else {
                settingBtn.style.display = 'none';
                logoutBtn.style.display = 'none';
            }
            loadVisitor(myID);
        }

    } catch (err) {
        console.error("Failed to loading info ", err);
    }
}

let editPostID = null;

//edit post
function openEditModal(id) {
    editPostID = id;
    const editPost = document.querySelector('#edit-post-modal')
    const oldTitle = document.querySelector('.post-title').textContent;
    const oldContent = document.querySelector('.post-content').textContent;

    document.querySelector("#new-title").value = oldTitle;
    document.querySelector('#new-content').value = oldContent;
    document.querySelector('#post-modal-title').innerText = "Edit Post";

    //show modal
    editPost.style.display = 'flex';
}

document.querySelector('#new-post-btn').addEventListener('click', async () => {
    editPostID = null;
    document.querySelector("#new-title").value = "";
    document.querySelector('#new-content').value = "";
    document.querySelector('#post-modal-title').innerText = "Write New Post";

    document.querySelector('#edit-post-modal').style.display = 'flex';
});

document.querySelector('#cancel-post-btn').addEventListener('click', async () => {
    document.querySelector('#edit-post-modal').style.display = 'none';
});

document.querySelector('#save-post-btn').addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    const title = document.querySelector("#new-title").value;
    const content = document.querySelector("#new-content").value;
    let response;
    if (!token) return;
    try {
        if (editPostID) {
            response = await fetch(`http://localhost:3000/api/posts/${editPostID}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, content })
            });

        } else if (!editPostID) {
            response = await fetch('http://localhost:3000/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, content })
            });
        }

        const result = await response.json();

        if (result.success) {
            alert(editPostID ? "Updated!" : "Posted!");
            //close to modal
            document.querySelector('#edit-post-modal').style.display = 'none';
            backToBoardList();
            boardData.length = 0;
            loadPosts() //refresh
        }

    } catch (err) {
        console.error("Update Error : ", err);
        alert("Error creating");
    }
});

//profile-setting
const editModal = document.querySelector('#edit-profile-modal');
document.querySelector('#profile-setting-btn').addEventListener('click', async () => {

    const oldFullName = document.querySelector('#profile-name').textContent; //Cyname(username)

    //[cyname, username)]
    const oldCyname = oldFullName.split('(')[0];
    const oldUsername = oldFullName.split('(')[1]?.replace(')', '');

    document.querySelector('#new-cyname').value = oldCyname;
    document.querySelector('#new-username').value = oldUsername;
    //show modal
    editModal.style.display = 'flex';
});
document.querySelector('#cancel-profile-btn').addEventListener('click', async () => {
    editModal.style.display = 'none';
});

document.querySelector('#save-profile-btn').addEventListener('click', async () => {

    const newPassword = document.getElementById('new-password').value;
    if (newPassword&&!validatePassword(newPassword)) {
        alert("Minimum 8 characters with a mix of letters and numbers!!");
        return;
    }
    const formData = new FormData();
    formData.append('cyworld_name', document.querySelector('#new-cyname').value);
    formData.append('username', document.querySelector('#new-username').value);
    formData.append('password', newPassword);

    const file = document.querySelector('#new-profile-img').files[0];

    if (file) {
        formData.append('profile_image_url', file);
    }

    const token = localStorage.getItem('token');
    try {
        const response = await fetch('http://localhost:3000/api/user/me', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData

        });

        const result = await response.json();

        if (result.success) {
            alert("Profile update successfully!");
            window.location.reload();
        } else {
            alert("Failed to update!");
        }

    } catch (err) {
        console.error("Update Error : ", err);
        alert("Error creating");
    }

});

//save visitor
document.querySelector('#save-visitor-btn').addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    const content = document.querySelector('#visitor-input').value;

    if (!content.trim()) return alert('Please input content');
    if (!token) return;

    try {
        const response = await fetch(`http://localhost:3000/api/${myID}/visitor`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content })
        });

        const result = await response.json();
        if (result.success) {
            document.querySelector('#visitor-input').value = '';
            loadVisitor(myID);
        }

    } catch (err) {
        console.error("Create Error", err);
        alert("Error creating");
    }
});

async function handleDeleteVisitor(id) {
    if (!confirm("Are you sure you want to delete this?")) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`http://localhost:3000/api/${myID}/visitor/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (result.success) {
            alert("Ilchon_pyeong delete successfully!");
            loadVisitor(myID);
        }

    } catch (err) {
        console.error("Failed to delete Ilchon_pyeong : ", err);
    }
}

//logout
const logoutBtn = document.querySelector('#logout_btn');

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        // remove token at local storage
        localStorage.removeItem('token');

        alert("See you later!");
        window.location.href = "login.html";
    });
}

function validatePassword(password) {
    // 8자 이상이며, 숫자와 영문이 최소 하나씩 포함되어 있는지 확인
    const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return regex.test(password);
}

loadMyInfo();
loadPosts();
