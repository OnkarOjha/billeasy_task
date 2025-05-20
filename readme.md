# Book Review API

A RESTful API for managing books and reviews with JWT authentication, built with Node.js, Express.js, and MongoDB.

## Table of Contents
- [Features](#features)
- [Technologies](#technologies)
- [Setup](#setup)
- [Environment Variables](#environment-variables) (included in email)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)

## Features
- JWT-based authentication (signup/login)
- CRUD operations for books
- Review management (create, update, delete)
- Search functionality
- Pagination for books and reviews
- Rating calculations

## Technologies
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT
- **Validation**: Joi
- **Environment Management**: dotenv

## Setup

### Prerequisites
- Node.js (v14+)
- MongoDB
- npm or yarn

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/OnkarOjha/billeasy_task.git
   cd billeasy_task

### API Endpoints
1. Authentication
   - Signup
   ```bash
      curl --location 'http://localhost:3000/v1/auth/signup' \
      --header 'Content-Type: application/json' \
      --data-raw '{
        "name": "User Full Name",  
        "email": "user@example.com",
        "password": "securePassword123",
        "phone": "+1234567890"  
      }'
      ```
   - Login
   ```bash
      curl --location 'http://localhost:3000/v1/auth/login' \
      --header 'Content-Type: application/json' \
      --data-raw '{
     "email": "user@example.com",
     "password": "securePassword123"

      }'
   ```
2. Books
   -   Create Book
        ```curl --location 'http://localhost:3000/v1/book/' \
         --header 'Content-Type: application/json' \
         --data '{
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "genre": "Classic Fiction"
         }'
        ```
   -   Get All Books
        ```
        curl --location 'http://localhost:3000/v1/book/?genre=Classic%20Fiction' \
         --header 'Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJwaG9uZSI6IisxMjM0NTY3ODkwIiwic3ViIjoiYTg4OWYzYTYtODE1OS00NTNjLWE3Y2QtYTlkODIwMWNhNWY0IiwiaWF0IjoxNzQ3NzIzMTY2LCJleHAiOjE3NDc3MjY3MDYsInR5cGUiOiJhY2Nlc3MiLCJyb2xlIjoidXNlciJ9.is3svJgeaJVCVc9OeMR38FF-189mHsdZOB9zphbhGu8' \
         --header 'Content-Type: application/json'

        ```
   - Get Book
   ```
   curl --location 'http://localhost:3000/v1/book/?page=2&limit=5' \
   --header 'Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJwaG9uZSI6IisxMjM0NTY3ODkwIiwic3ViIjoiYTg4OWYzYTYtODE1OS00NTNjLWE3Y2QtYTlkODIwMWNhNWY0IiwiaWF0IjoxNzQ3NzIzMTY2LCJleHAiOjE3NDc3MjY3MDYsInR5cGUiOiJhY2Nlc3MiLCJyb2xlIjoidXNlciJ9.is3svJgeaJVCVc9OeMR38FF-189mHsdZOB9zphbhGu8' \
   --header 'Content-Type: application/json' \
   --data ''
   ```   
   - Post Review
        ```
        curl --location 'http://localhost:3000/v1/book/682c2606e0290ead6af90357/reviews' \
         --header 'Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJwaG9uZSI6IisxMjM0NTY3ODkwIiwic3ViIjoiYTg4OWYzYTYtODE1OS00NTNjLWE3Y2QtYTlkODIwMWNhNWY0IiwiaWF0IjoxNzQ3NzIzMTY2LCJleHAiOjE3NDc3MjY3MDYsInR5cGUiOiJhY2Nlc3MiLCJyb2xlIjoidXNlciJ9.is3svJgeaJVCVc9OeMR38FF-189mHsdZOB9zphbhGu8' \
         --header 'Content-Type: application/json' \
         --data '{
        "rating": 2,
        "comment": " Not so engaging book with solid character development."
         }
         '

        ```
   -  Update Review
        ```
        curl --location --request PUT 'http://localhost:3000/v1/review/682c2f7654c187bc8a5bf830' \
      --header 'Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJwaG9uZSI6IisxMjM0NTY3ODkwIiwic3ViIjoiYTg4OWYzYTYtODE1OS00NTNjLWE3Y2QtYTlkODIwMWNhNWY0IiwiaWF0IjoxNzQ3NzIzMTY2LCJleHAiOjE3NDc3MjY3MDYsInR5cGUiOiJhY2Nlc3MiLCJyb2xlIjoidXNlciJ9.is3svJgeaJVCVc9OeMR38FF-189mHsdZOB9zphbhGu8' \
      --header 'Content-Type: application/json' \
      --data '{
        "rating": 4,
        "comment": "Really engaging book with solid character development."
      }
      '

        ```
   -  Delete Review
        ```
        curl --location --request DELETE 'http://localhost:3000/v1/review/682c2f7654c187bc8a5bf830' \
      --header 'Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJwaG9uZSI6IisxMjM0NTY3ODkwIiwic3ViIjoiYTg4OWYzYTYtODE1OS00NTNjLWE3Y2QtYTlkODIwMWNhNWY0IiwiaWF0IjoxNzQ3NzIzMTY2LCJleHAiOjE3NDc3MjY3MDYsInR5cGUiOiJhY2Nlc3MiLCJyb2xlIjoidXNlciJ9.is3svJgeaJVCVc9OeMR38FF-189mHsdZOB9zphbhGu8' \
      --header 'Content-Type: application/json'

        ```
   -   Search Review
        ```
        curl --location 'http://localhost:3000/v1/search/?keyword=The%20Great%20Gatsby'

        ```

### API Doucmenation
   Moreover this is the link to POSTMAN API DOCUMENTATION : https://documenter.getpostman.com/view/20307707/2sB2qZD1zh
### Database Schema

## 🗂️ Database Schema

The backend of this application uses **MongoDB** with well-structured schemas to ensure data integrity and efficiency. Below is the **Entity-Relationship Diagram (ERD)** representing how various entities interact within the system.

### 📌 Key Entities & Relationships

- **User**
  - Stores user information such as `email`, `phone`, `password`, and login status.
  - One user can:
    - Have multiple **Sessions**.
    - Generate multiple **OTPs**.
    - Submit multiple **Reviews** (one per book).

- **Session**
  - Tracks active login sessions per user.
  - Stores device info, JWT access/refresh tokens, and expiration details.
  - Linked to `user_id`.

- **OTP**
  - Time-sensitive one-time password records used for login/verification.
  - Linked to a specific `user` via reference.

- **Book**
  - Contains book metadata such as `title`, `author`, and `genre`.
  - One book can have multiple **Reviews**.

- **Review**
  - Linked to both a **User** and a **Book**.
  - A user can review a book once (enforced via a unique index).
  - Contains `rating` and optional `comment`.

### 🧭 ER Diagram

The following ER diagram illustrates the relationships between the key collections:

![BILLEASY-ER-DIAGRAM](https://github.com/user-attachments/assets/f5b97db3-7803-4389-ba20-de75e72923a7)


