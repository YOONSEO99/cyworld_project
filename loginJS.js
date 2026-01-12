const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        console.log("Request to server");
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' // 나 JSON 보낸다고 서버에 알려주기
            },
            body: JSON.stringify({ email, password }) // 객체를 문자열로 변환
        });

        const result = await response.json();
        console.log("Server response arrive", result);

        if (result.success) {
            //save Token
            localStorage.setItem('token', result.token);

            alert("Welcome to your Cyworld!!");
            window.location.href = "index.html";
        } else {
            alert("Login fail : " + result.message);
        }

    } catch (err) {
        console.log("Network Error : ", err);
        alert("Can not connect to Server");
    }

});