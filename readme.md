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
