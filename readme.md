Build a RESTful API using Node.js (with Express) for a basic Book Review system.

🔧 Requirements:

1. Tech Stack:
   Node.js with Express.js
   Any database (e.g., MongoDB, PostgreSQL, or SQLite)
   Use JWT for authentication

2. Authentication:
   Implement JWT-based user authentication
   Endpoints:
   POST /signup – register a new user
   POST /login – authenticate and return a token

3. Core Features:
   POST /books – Add a new book (Authenticated users only)
   GET /books – Get all books (with pagination and optional filters by author and genre)
   GET /books/:id – Get book details by ID, including:
   Average rating
   Reviews (with pagination)
   POST /books/:id/reviews – Submit a review (Authenticated users only, one review per user per book)
   PUT /reviews/:id – Update your own review
   DELETE /reviews/:id – Delete your own review

4. Additional Feature:
   GET /search – Search books by title or author (partial and case-insensitive)
