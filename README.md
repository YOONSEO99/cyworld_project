🚀 Cyworld Archive: Advanced Data Sync & Security
A full-stack web application project focusing on nostalgic UI restoration and robust data management. This repository contains the core server logic and API implementations.

📌 Project Overview
This project reinterprets the classic "Cyworld" interface with modern backend architecture. The primary focus was on ensuring data integrity during complex state changes and implementing secure authentication protocols.

🛠 Tech Stack
Backend: Node.js, Express

Database: PostgreSQL

Authentication: JWT (JSON Web Tokens)

Security: Bcrypt (Password Hashing), Regex Validation

Environment: dotenv, Multer (File Uploads)

✨ Key Features
1. Robust Post & Profile Management (CRUD)
Optimized lifecycle for posts with real-time UI synchronization.

Smart Profile Controller: Implemented "Fetch-Before-Update" logic to allow partial updates (e.g., changing a nickname) while preserving existing profile images.

2. Interactive Visitor Log (Guestbook)
Engineered a real-time guestbook system with dynamic rendering.

Ownership Verification: Client and server-side checks to ensure administrative actions (Delete) are only accessible to the content owner.

3. Advanced Security Protocols
Regex Validation: Enforced a strict alphanumeric password policy (8+ characters).

Protected Routes: All data-mutating endpoints are secured with JWT-based middleware.

🔍 Troubleshooting & Deep Insights
Handling Data Inconsistency in Partial Updates
Issue: Optional fields like profile images were being overwritten by null values during text-only updates.

Solution: Designed a server-side merge strategy that retrieves current state from the database before applying updates, ensuring continuous data integrity.

Authorization Metadata Issues
Issue: UI logic for ownership verification (e.g., Delete button) failed due to missing metadata.

Insight: SQL JOIN queries must be designed to include hidden foreign keys (e.g., writer_id) for secure UI rendering.

Action: Refactored database queries to provide the necessary context for frontend authorization logic.

🚀 Getting Started
Clone the repository

```bash
   git clone [https://github.com/YOONSEO99/cyworld_server.git](https://github.com/YOONSEO99/cyworld_server.git)

Install dependencies

```bash
npm install

Setup Environment Variables Create a .env file and add your PostgreSQL credentials and JWT_SECRET.

Run the server

```bash
npm start
