const imageInput = document.getElementById('imageInput');
const profilePreview = document.getElementById('profilePreview');

imageInput.addEventListener('change', function () {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            profilePreview.src = e.target.result;
        }
        reader.readAsDataURL(file)
    }
});

const signupForm = document.getElementById('signupForm');
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault(); //prevent refresh
    console.log("1. Registration process start");

    const password = document.getElementById('password').value;
    if (!validatePassword(password)) {
        alert("Minimum 8 characters with a mix of letters and numbers!!");
        return;
    }
    //create formData
    const formData = new FormData();

    //append('tag','realdata')
    formData.append('email', document.getElementById('email').value);
    formData.append('password', password);
    formData.append('username', document.getElementById('username').value);
    formData.append('cyworld_name', document.getElementById('cyworld_name').value);

    const imageInput = document.getElementById('imageInput');
    if (imageInput.files.length > 0) {
        formData.append('profileImage', imageInput.files[0]);
    }

    try {
        console.log("2. Request to server");
        const response = await fetch('http://localhost:3000/api/signup', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        console.log("3. Server response arrive", result);

        if (result.success) {
            alert("Welcome! Registration complete!");
            window.location.href = "login.html";
        } else {
            alert("Registration fail : " + result.message);
        }

    } catch (err) {
        console.error("Network Error:", err);
        alert("Can not connent to server");
    }
});

function validatePassword(password) {
    // 8자 이상이며, 숫자와 영문이 최소 하나씩 포함되어 있는지 확인
    const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return regex.test(password);
}