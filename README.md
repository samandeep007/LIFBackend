# L.I.F - Love Is Free Backend

![Node.js](https://img.shields.io/badge/Node.js-v18.x-green)
![GraphQL](https://img.shields.io/badge/GraphQL-v16.x-purple)
![MongoDB](https://img.shields.io/badge/MongoDB-v7.x-blue)
![Swagger](https://img.shields.io/badge/Swagger-OpenAPI%203.0-brightgreen)

The backend for "L.I.F - Love Is Free" is a Node.js application built with Express, Apollo Server (GraphQL), MongoDB, Cloudinary, and WebSockets. It powers a modern dating app with user authentication, location-based matching, real-time messaging, audio/video calls, safety features, and comprehensive API documentation via Swagger and GraphQL.

---

## Table of Contents
1. [Features](#features)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Project Structure](#project-structure)
5. [Environment Variables](#environment-variables)
6. [Running the Application](#running-the-application)
7. [API Documentation](#api-documentation)
   - [Swagger UI](#swagger-ui)
   - [REST Endpoints](#rest-endpoints)
   - [GraphQL Queries](#graphql-queries)
   - [GraphQL Mutations](#graphql-mutations)
   - [GraphQL Subscriptions](#graphql-subscriptions)
8. [Error Handling](#error-handling)
9. [Response Format](#response-format)
10. [Dependencies](#dependencies)
11. [Contributing](#contributing)
12. [License](#license)

---

## Features
- **Core Features**:
  - User registration with email verification
  - Secure login with JWT and password reset functionality
  - Free messaging and photo viewing
  - Improved matchmaking with bio (100 chars) and prompt (50 chars)
  - Location-based search with customizable radius
  - Filters: age, gender, interests, preferences, ethnicity, education, smoking
  - Preferences: long-term, casual, intimacy
  - Simplified liking system: swipe right (like), swipe up (maybe)
  - "Maybe" list and undo last swipe (within 24 hours)
  - Hiatus mode to pause profile visibility
  - Profile updates and deletion
  - Real-time messaging with notifications
  - Audio/video calling via WebRTC
  - User stats: views, likes, matches, response time, ghosting

- **Safety Features**:
  - Profile verification with simulated facial recognition
  - Safety guidelines for conversations
  - Location and identity verification
  - Report suspicious activity (3+ reports trigger hiatus)

- **Paid Features**:
  - Super Likes
  - Profile Boosts (24-hour visibility boost)
  - Enhanced visibility for boosted profiles

- **Technical Features**:
  - Dual API: REST (Swagger-documented) and GraphQL with subscriptions
  - MongoDB with geospatial indexing for location queries
  - Cloudinary for photo storage with Multer for uploads
  - WebSocket support for real-time updates (GraphQL subscriptions)
  - Email integration for verification and password resets
  - Standardized error and response handling
  - Security: rate limiting, CSRF protection, Helmet, MongoDB sanitization

---

## Prerequisites
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **MongoDB**: v7.x (local or MongoDB Atlas with geospatial support)
- **Cloudinary Account**: For photo storage
- **Email Service**: SMTP provider (e.g., Gmail) for verification/reset emails
- **Git**: For version control

---

## Installation
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/yourusername/LIFBackend.git
   cd LIFBackend
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**:
   Create a `.env` file in the root directory (see [Environment Variables](#environment-variables)).

4. **Create Temporary Storage**:
   ```bash
   mkdir -p public/temp
   ```

---

## Project Structure
```
LIFBackend/
├── src/
│   ├── controllers/         # API logic
│   │   ├── authController.js        # Auth endpoints (register, login, etc.)
│   │   ├── userController.js        # User management and matching
│   │   ├── messageController.js     # Messaging and confessions
│   │   ├── safetyController.js      # Safety features
│   │   ├── notificationController.js # Notifications
│   │   ├── callController.js        # Audio/video calls
│   ├── graphql/             # GraphQL schema and resolvers
│   │   ├── schema.js
│   │   ├── resolvers.js
│   ├── models/              # Mongoose schemas
│   │   ├── User.js
│   │   ├── Like.js
│   │   ├── Call.js
│   │   ├── Confession.js
│   │   ├── Match.js
│   │   ├── Message.js
│   │   ├── Notification.js
│   │   ├── SafetyReport.js
│   ├── utils/               # Utility functions
│   │   ├── email.js         # Email sending
│   │   ├── apiError.js
│   │   ├── apiResponse.js
│   │   ├── asyncHandler.js
│   │   ├── autoDelete.js
│   │   ├── cloudinary.js
│   │   ├── logger.js
│   ├── app.js               # Express and Apollo setup
│   ├── lib.js               # Centralized imports/exports
│   ├── swagger.js           # Swagger configuration
│   ├── index.js             # Server entry point
├── public/
│   ├── temp/                # Temporary file storage for uploads
├── .env                     # Environment variables
├── package.json             # Dependencies and scripts
├── README.md                # This file
```

---

## Environment Variables
Create a `.env` file with:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/lif
JWT_SECRET=your-very-long-random-secret-key-32-chars-min
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
NODE_ENV=development
```

---

## Running the Application
1. **Start the Server**:
   ```bash
   npm start
   ```
   - Runs on `http://localhost:5000` (or your `PORT`).
   - REST API base: `/api`
   - GraphQL endpoint: `/graphql`
   - WebSocket subscriptions: `ws://localhost:5000/graphql`
   - Swagger UI: `/api-docs`

2. **Test the API**:
   - Swagger UI: `http://localhost:5000/api-docs`
   - GraphQL: Use a client like GraphiQL or Postman at `http://localhost:5000/graphql`

---

## API Documentation

### Swagger UI
- Access: `http://localhost:5000/api-docs`
- Fully documented REST endpoints for auth, users, messages, and safety.

### REST Endpoints
- **Auth**:
  - `POST /api/auth/register`: Register with email verification
  - `POST /api/auth/login`: Login with JWT
  - `GET /api/auth/verify-email`: Verify email with token
  - `POST /api/auth/forgot-password`: Request password reset
  - `POST /api/auth/reset-password`: Reset password with token
- **Users**:
  - `GET /api/users/profiles`: Fetch profiles with filters
  - `PUT /api/users/profile`: Update profile
  - `DELETE /api/users/profile`: Delete profile
  - `POST /api/users/like`: Like or mark as maybe
  - `GET /api/users/maybe-likes`: Get maybe list
  - `POST /api/users/undo`: Undo last swipe
  - `GET /api/users/stats`: Get user stats
  - `POST /api/users/hiatus`: Toggle hiatus
  - `POST /api/users/boost`: Boost profile
- **Messages** & **Safety**: (Unchanged from original)

### GraphQL Queries
- `profiles(lat, lng, maxDistance, minAge, maxAge, gender, interests, preferences, ethnicity, education, smoking)`: Fetch filtered profiles
  ```graphql
  query {
    profiles(lat: 40.7128, lng: -74.0060, maxDistance: 50) {
      data {
        id
        name
        photoURL
        bio
        age
      }
    }
  }
  ```
- `maybeLikes`: Get user’s maybe list
  ```graphql
  query {
    maybeLikes {
      data {
        id
        name
        photoURL
      }
    }
  }
  ```
- `stats`: Get user statistics
  ```graphql
  query {
    stats {
      data {
        views
        likesGiven
        likesReceived
        matches
      }
    }
  }
  ```

### GraphQL Mutations
- `register(email, password, name, phone, prompt, lat, lng, age, gender, interests)`: Register a user
  ```graphql
  mutation {
    register(email: "test@example.com", password: "12345678", name: "Test", phone: "1234567890", prompt: "Hi!", lat: 40.7128, lng: -74.0060, age: 25, gender: "male") {
      statusCode
      message
      data {
        token
        user { id }
      }
    }
  }
  ```
- `login(email, password)`: Log in
  ```graphql
  mutation {
    login(email: "test@example.com", password: "12345678") {
      statusCode
      message
      data {
        token
        user { id }
      }
    }
  }
  ```
- `verifyEmail(token)`: Verify email
  ```graphql
  mutation {
    verifyEmail(token: "your-token") {
      statusCode
      message
    }
  }
  ```
- `forgotPassword(email)`: Request password reset
  ```graphql
  mutation {
    forgotPassword(email: "test@example.com") {
      statusCode
      message
    }
  }
  ```
- `resetPassword(token, password)`: Reset password
  ```graphql
  mutation {
    resetPassword(token: "your-token", password: "newpassword123") {
      statusCode
      message
    }
  }
  ```
- `likeProfile(targetId, direction)`: Like or maybe a profile
  ```graphql
  mutation {
    likeProfile(targetId: "user-id", direction: "right") {
      statusCode
      message
      data {
        isMatch
      }
    }
  }
  ```
- `undoLastSwipe`: Undo last swipe
  ```graphql
  mutation {
    undoLastSwipe {
      statusCode
      message
      data {
        undoneUser { id name }
      }
    }
  }
  ```
- `toggleHiatus`: Toggle hiatus mode
  ```graphql
  mutation {
    toggleHiatus {
      statusCode
      message
      data
    }
  }
  ```
- `boostProfile`: Boost profile visibility
  ```graphql
  mutation {
    boostProfile {
      statusCode
      message
    }
  }
  ```

### GraphQL Subscriptions
- `matchCreated`: Real-time match notifications
  ```graphql
  subscription {
    matchCreated {
      id
      users { id name }
      createdAt
    }
  }
  ```
- `messageReceived(receiverId)`: Real-time messages
  ```graphql
  subscription {
    messageReceived(receiverId: "user-id") {
      id
      text
      sender { id name }
    }
  }
  ```
- `notificationReceived(userId)`: Real-time notifications
  ```graphql
  subscription {
    notificationReceived(userId: "user-id") {
      id
      type
      message
    }
  }
  ```
- `callInitiated(receiverId)`: Real-time call initiation
  ```graphql
  subscription {
    callInitiated(receiverId: "user-id") {
      id
      caller { id name }
      type
    }
  }
  ```

---

## Error Handling
- Custom `ApiError` class with `statusCode`, `success`, `message`, and optional `data`.

---

## Response Format
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

---

## Dependencies
- **Core**: `express`, `apollo-server-express`, `graphql`, `mongoose`, `ws`
- **Auth**: `jsonwebtoken`, `bcryptjs`, `nodemailer`
- **Storage**: `multer`, `cloudinary`
- **Security**: `helmet`, `express-mongo-sanitize`, `csurf`
- **GraphQL**: `@graphql-tools/schema`, `graphql-subscriptions`, `graphql-ws`
- **Docs**: `swagger-jsdoc`, `swagger-ui-express`
- **Utils**: `dotenv`, `winston`

Run `npm install` to install all dependencies listed in `package.json`.

---

## Contributing
1. Fork the repo.
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "Add your feature"`
4. Push: `git push origin feature/your-feature`
5. Open a pull request.

---

## License
MIT License
