require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');

const app = express();
const saltRound = 10; // 👈 [핵심] 이걸 app 선언 바로 밑으로 올려주세요!

app.use(cors());
app.use(express.json());
app.use('/images', express.static('images'));
app.use('/uploads', express.static('uploads'));

const PORT = process.env.SERVER_PORT || 3000;
// ... (이하 dbConfig, pool 설정 계속)
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
};

const pool = new Pool(dbConfig);

async function testDbConnection() {
    //const client = new Client(dbConfig);
    try {
        //await client.connect();
        const client = await pool.connect();
        console.log('✅ PostgreSQL connection successful to cyworld database.');
        client.release();
        //await client.end();
    } catch (err) {
        console.error('❌ PostgreSQL connection error:', err.message);
        process.exit(1);
    }
}

async function startServer() {
    await testDbConnection();
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}

//Authorization
//Middleware
const authenticateToken = (req, res, next) => {
    //1. 헤더에서 Authorization 값 가져오기
    const authHeader = req.headers['authorization'];
    //Bearer <token> 형식에서 토큰만 추출
    const token = authHeader && authHeader.split(' ')[1];

    //2. 토큰이 없으면 401 에러
    if (!token) {
        return res.status(401).json({ success: false, message: "No token provided" });
    }

    //3. 토큰 검증하기
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            //토큰이 가짜거나 만료된 경우 403
            return res.status(403).json({ success: false, message: "Invalid or expired token" });
        }

        //4. 검증 성공 시 사용자 정보를 req 객체에 담기
        req.user = user;

        //5. 다음 단계로 이동
        next();
    });
};

// 1. storage setting
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); //save images at uploads folder
    },
    filename: (req, file, cb) => {
        //to prevent name duplication; 'now date - original name'
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// upload middleware
const upload = multer({ storage: storage });

//user registeration
//router handler
app.post('/api/signup', upload.single('profileImage'), async (req, res) => {
    //const client = new Client(dbConfig);
    try {

        const { email, password, username, cyworld_name } = req.body;
        const profileImageUrl = req.file
            ? `/uploads/${req.file.filename}`
            : `/images/default_profile.png`;
        //await client.connect();

        //Hashing the password
        const hashedPassword = await bcrypt.hash(password, saltRound);

        const query = `
            INSERT INTO users (email, password, username, cyworld_name, profile_image_url)
            VALUES ($1, $2, $3, $4, $5) RETURNING id;
        `;

        //Save 'hashedPassword' instead of 'password'
        const values = [email, hashedPassword, username, cyworld_name, profileImageUrl];
        const result = await pool.query(query, values);

        res.status(201).json({
            success: true,
            message: "User registered successfully!",
            userId: result.rows[0].id
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Signup failed." });
    }
});

//Login
//router handler
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    //const client = new Client(dbConfig); //DB 클라이언트 생성

    try {
        //await client.connect();

        //1. DB에서 이메일로 사용자 조회
        const result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
        const user = result.rows[0];
        //2. 사용자가 없는 경우
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        //3. 비밀번호 확인 - await 사용
        const isMatch = await bcrypt.compare(password, user.password);
        //4 비번이 틀린 경우
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invaild password" });
        }
        //5. 비번이 맞으면 JWT 발급
        // .env에 JWT_SECRET 있어야함
        const token = jwt.sign(
            { id: user.id, email: user.email }, //담고 싶은 정보(Payload)
            process.env.JWT_SECRET,  //비밀 키 (Signature)
            { expiresIn: '1h' } //유효기간(1시간)
        );

        res.status(200).json({ success: true, token });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

//load user
//router handler
app.get('/api/user/me', authenticateToken, async (req, res) => {
    const user_id = req.user.id;

    try {

        const result = await pool.query(`SELECT id, username, cyworld_name, dotori_count, 
            profile_image_url FROM users WHERE id=$1`, [user_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({
            success: true,
            message: "Info Loading successfully!",
            user: result.rows[0]
        })

    } catch (err) {
        console.log("Error creating loading info: ", err);
        res.status(500).json({ success: false, message: "Database error." });
    }
});

//update info
//router handler
//app.put > update
app.put('/api/user/me', authenticateToken, upload.single('profile_image_url'), async (req, res) => {
    const user_id = req.user.id;
    const { username, password, cyworld_name } = req.body;

    try {
        let passwordToSave;
        const userRes = await pool.query('SELECT password, profile_image_url From users WHERE id=$1', [user_id]);
        const oldData = userRes.rows[0];

        const profile_image_url = req.file
            ? `/uploads/${req.file.filename}`
            : oldData.profile_image_url;

        if (password && password.trim() !== "") {
            //Hashing the password
            passwordToSave = await bcrypt.hash(password, saltRound);
        } else {
            passwordToSave = userRes.rows[0].password;
        }

        const query = `UPDATE users SET username=$2, password=$3, cyworld_name=$4, profile_image_url=$5 WHERE id=$1`;
        const values = [user_id, username, passwordToSave, cyworld_name, profile_image_url];
        const result = await pool.query(query, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({ success: true, message: "User updated successfully!" });
    } catch (err) {
        console.log("Error creating post update : ", err);
        res.status(500).json({ success: false, message: "Database error." });
    }
});

//posts 
//router handler
//app.post > create
app.post('/api/posts', authenticateToken, async (req, res) => {
    //1. writer_id는 req.user에서 가져옴(보안 핵심)
    const writer_id = req.user.id;
    const { title, content } = req.body; //body에서는 제목과 내용만 받음
    //const client = new Client(dbConfig);

    try {
        //await client.connect();

        if (!title || title.trim().length === 0 || !content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Title and Content are required and cannot be empty strings."
            });
        }

        const query = `
            INSERT INTO posts (writer_id, title, content)
            VALUES ($1,$2,$3) RETURNING id;
        `;

        const values = [writer_id, title, content];
        const result = await pool.query(query, values);

        res.status(201).json({
            success: true,
            message: "Posts registered successfully!",
            postId: result.rows[0].id
        });
    } catch (err) {
        console.log("Error creating posts: ", err);
        res.status(500).json({ success: false, message: "Database error." });
    }
});

//read posts
//router handler
app.get('/api/posts', authenticateToken, async (req, res) => {
    // const client = new Client(dbConfig);
    try {
        //await client.connect();

        const result = await pool.query(
            `SELECT p.*, u.username 
            FROM posts p
            JOIN users u ON p.writer_id = u.id 
            ORDER BY created_at DESC;
            `);

        res.status(200).json({
            success: true,
            message: "Posts retrieved successfully!",
            posts: result.rows
        });

    } catch (err) {
        console.log("Error creating posts read: ", err);
        res.status(500).json({ success: false, message: "Database error." });
    }
});

//read single post
//router handler
//app.get > read
app.get('/api/posts/:id', authenticateToken, async (req, res) => {
    const { id } = req.params; //URL에서 id 추출
    //const client = new Client(dbConfig);

    try {
        //await client.connect();

        const result = await pool.query(`SELECT * FROM posts WHERE id=$1`, [id]);

        //null data
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Single post retrieved successfully!",
            post: result.rows[0] //단일 게시글 조회이므로 객체 하나만 반환하는것이 좋음
        });

    } catch (err) {
        console.log("Error creating single post read: ", err);
        res.status(500).json({ success: false, message: "Database error." });
    }
});

//update posts
//router handler
//app.put > update
app.put('/api/posts/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;

    //const client = new Client(dbConfig);
    try {
        //await client.connect();

        //Ownership verification
        const ownerCheck = await pool.query(`SELECT writer_id FROM posts WHERE id=$1`, [id]);
        //Verification
        if (ownerCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Post not found" });
        }
        const PostWriterID = ownerCheck.rows[0].writer_id;
        if (PostWriterID === req.user.id) {

            if (!title || title.trim().length === 0 || !content || content.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Title and Content are required and cannot be empty strings."
                });
            }
            const query = `UPDATE posts SET title=$2, content=$3 WHERE id=$1`;
            const values = [id, title, content];
            await pool.query(query, values);

            return res.status(200).json({ success: true, message: "Post updated successfully!" });
        }

        res.status(403).json({ success: false, message: "No right to update!" });

    } catch (err) {
        console.log("Error creating post update : ", err);
        res.status(500).json({ success: false, message: "Database error." });
    }
});

//delete posts
//router handler
//app.delete > delete
app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    //const client = new Client(dbConfig);
    try {
        //await client.connect();

        //Ownership verification 
        const ownerCheck = await pool.query(`SELECT writer_id FROM posts WHERE id=$1`, [id]);
        //Verification
        if (ownerCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Post not found" });
        }
        const postWriterID = ownerCheck.rows[0].writer_id;
        if (postWriterID === req.user.id) {
            await pool.query(`DELETE FROM posts WHERE id=$1`, [id]);
            return res.status(200).json({ success: true, message: "Post deleted successfully!" });
        }

        res.status(403).json({ success: false, message: "No right to delete!" })

    } catch (err) {
        console.log("Error creating post delete : ", err);
        res.status(500).json({ success: false, message: "Database error." });
    }
});

// read ilchon_pyeong
//router handler
app.get('/api/:owner_id/visitor', authenticateToken, async (req, res) => {
    try {
        const owner_id = req.params.owner_id;
        const result = await pool.query(
            `
            SELECT i.id, i.content, i.created_at, i.writer_id, u.username          
            FROM ilchon_pyeong i INNER JOIN users u ON i.writer_id = u.id
            WHERE i.owner_id=$1 ORDER BY i.created_at DESC
            `
            , [owner_id]);

        res.status(200).json({
            success: true,
            message: "ilchon_pyeong retrieved successfully!",
            ilchon_pyeong: result.rows
        });

    } catch (err) {
        console.log("Error creating ilchon_pyeong read : ", err);
        res.status(500).json({ success: false, message: "Database error." });
    }
});

//create ilchon_pyeong
//router handler
app.post('/api/:owner_id/visitor', authenticateToken, async (req, res) => {

    const owner_id = req.params.owner_id;
    const writer_id = req.user.id;
    const { content } = req.body;

    try {

        if (!content || content.trim().length === 0) {

            return res.status(400).json({
                success: false,
                message: "Content are required and cannot be empty strings"
            });
        }

        const query = `
            INSERT INTO ilchon_pyeong (owner_id, writer_id, content) 
            VALUES ($1,$2,$3) RETURNING id;
        `;
        const values = [owner_id, writer_id, content];
        const result = await pool.query(query, values);

        res.status(201).json({
            success: true,
            message: "Ilchon_pyeong registered successfully!",
            ilchon_pyeongID: result.rows[0].id
        });

    } catch (err) {
        console.log("Error creating ilchon_pyeong create : ", err);
        res.status(500).json({ success: false, message: "Database error." });
    }
});

//delete ilchon_pyeong
//router handler
app.delete('/api/:owner_id/visitor/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {

        const ownerCheck = await pool.query(`SELECT writer_id FROM ilchon_pyeong WHERE id=$1`, [id]);
        //Verification
        if (ownerCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Ilchon_pyeong not found" });
        }

        const writerID = ownerCheck.rows[0].writer_id;
        if (writerID === req.user.id) {
            await pool.query(`DELETE FROM ilchon_pyeong WHERE id=$1`, [id]);
            return res.status(200).json({ success: true, message: "Ilchon_pyeong deleted successful!" });
        }

        res.status(403).json({ success: false, message: "No right to delete!" });

    } catch (err) {
        console.log("Error creating ilchon_pyeong delete : ", err);
        res.status(500).json({ success: false, message: "Database error." });
    }
});

startServer();