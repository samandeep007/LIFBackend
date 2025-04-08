# L.I.F - Love Is Free Backend

![Node.js](https://img.shields.io/badge/Node.js-v18.x-green)
![GraphQL](https://img.shields.io/badge/GraphQL-v16.x-purple)
![MongoDB](https://img.shields.io/badge/MongoDB-v6.x-blue)
![Swagger](https://img.shields.io/badge/Swagger-OpenAPI%203.0-brightgreen)

The backend for "L.I.F - Love Is Free" is a Node.js application built with Express, Apollo Server (GraphQL), MongoDB, and Cloudinary. It provides a robust API for a dating app with advanced user filtering, location-based search, messaging, safety features, and real-time subscriptions. The codebase uses ES6 modules, standardized error/response handling with `ApiError` and `ApiResponse` classes, `asyncHandler` for async operations, and Swagger for REST API documentation.

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
  - Free messaging and photo viewing
  - Improved matchmaking with bio (100 chars) and prompt (50 chars)
  - Location-based search with customizable radius
  - Comprehensive filters: age, gender, interests, relationship preferences, ethnicity, education, smoking
  - Preferences: long-term, casual, intimacy
  - Confessions sent to random users
  - Auto-delete unread messages after 5 days
  - Ghosting stats and detailed user insights
  - Swipe up for "maybe" and undo last swipe
  - Hiatus mode to pause profile visibility
  - Update and delete user profiles

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
  - Dual API: REST (Swagger-documented) and GraphQL with real-time subscriptions
  - MongoDB with geospatial indexing for location queries
  - Cloudinary for photo storage with Multer for temp uploads
  - Standardized error and response handling
  - Rate limiting, CSRF protection, and security middleware

---

## Prerequisites
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **MongoDB**: Local instance or MongoDB Atlas (with geospatial support)
- **Cloudinary Account**: For photo storage
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
   Create a `.env` file in the root directory and configure it (see [Environment Variables](#environment-variables)).

4. **Create Temporary Storage**:
   ```bash
   mkdir -p public/temp
   ```

---

## Project Structure
```
LIFBackend/
├── src/
│   ├── controllers/         # Business logic for auth, users, messages, safety
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── messageController.js
│   │   ├── safetyController.js
│   ├── models/              # Mongoose schemas
│   │   ├── User.js
│   │   ├── Message.js
│   │   ├── Match.js
│   │   ├── Confession.js
│   │   ├── SafetyReport.js
│   ├── middlewares/         # Express middleware
│   │   ├── authMiddleware.js
│   │   ├── validateInput.js
│   │   ├── rateLimitPerUser.js
│   ├── utils/               # Utility functions and classes
│   │   ├── cloudinary.js
│   │   ├── autoDelete.js
│   │   ├── logger.js
│   │   ├── apiError.js
│   │   ├── apiResponse.js
│   │   ├── asyncHandler.js
│   ├── graphql/             # GraphQL schema and resolvers
│   │   ├── schema.js
│   │   ├── resolvers.js
│   ├── lib.js               # Centralized imports/exports
│   ├── app.js               # Express and Apollo Server setup
│   ├── swagger.js           # Swagger configuration
├── public/
│   ├── temp/                # Temporary storage for Multer uploads
├── .env                     # Environment variables
├── index.js                 # Entry point
├── package.json             # Project metadata and dependencies
├── README.md                # This file
```

---

## Environment Variables
Create a `.env` file in the root directory with:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/LIFDB
JWT_SECRET=your-very-long-random-secret-key-32-chars-min
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CSRF_SECRET=your-csrf-secret-key
NODE_ENV=development
```
- `PORT`: Server port (default: 5000)
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret for JWT signing (min 32 chars)
- `CLOUDINARY_*`: Cloudinary credentials for photo uploads
- `CSRF_SECRET`: Secret for CSRF token generation
- `NODE_ENV`: `development` or `production`

---

## Running the Application
1. **Start the Server**:
   ```bash
   npm start
   ```
   - Uses `nodemon` for auto-reloading in development.
   - Server runs at `http://localhost:5000`.
   - REST API base: `/api`
   - GraphQL: `/graphql`
   - WebSocket subscriptions: `ws://localhost:5000/graphql`
   - Swagger UI: `/api-docs`

2. **Test the API**:
   - Use Swagger UI at `http://localhost:5000/api-docs` for REST endpoints.
   - Use a GraphQL client (e.g., Postman, GraphiQL) for `/graphql`.

---

## API Documentation

### Swagger UI
The REST API is documented using Swagger (OpenAPI 3.0). Access the interactive UI at:
- **URL**: `http://localhost:5000/api-docs`
- **Features**: Explore endpoints, test requests, view schemas.

### REST Endpoints
All endpoints require JWT authentication via `Authorization: Bearer <token>` unless noted.

- **Auth**:
  - `POST /api/auth/register` - Register a new user (multipart/form-data with photo, location, age, gender, interests)
  - `POST /api/auth/login` - Log in a user

- **Users**:
  - `GET /api/users/profiles` - Get filtered profiles (supports location radius, age, gender, interests, preferences, ethnicity, education, smoking)
  - `PUT /api/users/profile` - Update user profile (multipart/form-data with optional photo)
  - `DELETE /api/users/profile` - Delete user profile
  - `POST /api/users/swipe` - Swipe on a user (right, left, up)
  - `GET /api/users/stats` - Get user statistics
  - `POST /api/users/undo` - Undo last swipe
  - `POST /api/users/hiatus` - Toggle hiatus mode
  - `POST /api/users/superlike` - Super like a user
  - `POST /api/users/boost` - Boost profile visibility

- **Messages**:
  - `POST /api/messages` - Send a message
  - `GET /api/messages/conversation/:userId` - Get conversation
  - `POST /api/messages/confession` - Send a confession
  - `GET /api/messages/safety-guidelines` - Get safety guidelines (no auth required)

- **Safety**:
  - `POST /api/safety/report` - Report suspicious activity
  - `POST /api/safety/verify-location` - Verify location
  - `POST /api/safety/confirm-identity` - Confirm identity (multipart/form-data with photo)

### GraphQL Queries
- **profiles(lat, lng, maxDistance, minAge, maxAge, gender, interests, preferences, ethnicity, education, smoking)**:
  Retrieve filtered user profiles.
  ```graphql
  query {
    profiles(lat: 40.7128, lng: -74.0060, maxDistance: 10, minAge: 25, maxAge: 35, gender: "female", interests: "hiking") {
      statusCode
      success
      message
      data
    }
  }
  ```
- **stats**: Get user statistics.
  ```graphql
  query {
    stats {
      statusCode
      success
      message
      data {
        views
        swipesRight
        swipesLeft
        superLikes
        avgResponseTime
        ghostedCount
      }
    }
  }
  ```
- **conversation(userId)**: Fetch conversation with a user.
  ```graphql
  query {
    conversation(userId: "user-id") {
      statusCode
      success
      message
      data {
        id
        text
        sender { id }
        receiver { id }
      }
    }
  }
  ```
- **safetyGuidelines**: Get safety conversation starters.
  ```graphql
  query {
    safetyGuidelines {
      statusCode
      success
      message
      data
    }
  }
  ```

### GraphQL Mutations
- **register(email, password, name, phone, prompt, lat, lng, age, gender, interests)**:
  Register a new user (requires `photo` via `multipart/form-data`).
  ```graphql
  mutation {
    register(email: "test@example.com", password: "password123", name: "Test", phone: "1234567890", prompt: "Hi!", lat: 40.7128, lng: -74.0060, age: 30, gender: "male", interests: "hiking,music") {
      statusCode
      success
      message
      data {
        token
        user { id }
      }
    }
  }
  ```
- **login(email, password)**: Log in a user.
  ```graphql
  mutation {
    login(email: "test@example.com", password: "password123") {
      statusCode
      success
      message
      data {
        token
        user { id }
      }
    }
  }
  ```
- **updateProfile(name, bio, prompt, lat, lng, age, gender, interests, preferences, ethnicity, education, smoking)**:
  Update user profile (requires `photo` via `multipart/form-data` if updating photo).
  ```graphql
  mutation {
    updateProfile(name: "New Name", bio: "New bio", lat: 40.7128, lng: -74.0060, interests: "hiking,music") {
      statusCode
      success
      message
      data {
        id
        name
        bio
        location { coordinates }
        interests
      }
    }
  }
  ```
- **deleteProfile**: Delete user profile.
  ```graphql
  mutation {
    deleteProfile {
      statusCode
      success
      message
      data
    }
  }
  ```
- **swipe(targetId, direction)**: Swipe on a user.
  ```graphql
  mutation {
    swipe(targetId: "target-id", direction: "right") {
      statusCode
      success
      message
      data {
        match
      }
    }
  }
  ```
- **undo**: Undo the last swipe.
  ```graphql
  mutation {
    undo {
      statusCode
      success
      message
      data {
        undoneUser { id }
      }
    }
  }
  ```
- **toggleHiatus**: Toggle hiatus mode.
  ```graphql
  mutation {
    toggleHiatus {
      statusCode
      success
      message
      data
    }
  }
  ```
- **superLike(targetId)**: Super like a user.
  ```graphql
  mutation {
    superLike(targetId: "target-id") {
      statusCode
      success
      message
      data
    }
  }
  ```
- **boostProfile**: Boost profile visibility.
  ```graphql
  mutation {
    boostProfile {
      statusCode
      success
      message
      data
    }
  }
  ```
- **sendMessage(receiverId, text)**: Send a message.
  ```graphql
  mutation {
    sendMessage(receiverId: "receiver-id", text: "Hello!") {
      statusCode
      success
      message
      data {
        id
        text
      }
    }
  }
  ```
- **sendConfession(text)**: Send a confession.
  ```graphql
  mutation {
    sendConfession(text: "I like you!") {
      statusCode
      success
      message
      data
    }
  }
  ```
- **reportSuspiciousActivity(reportedUserId, location, reason)**: Report a user.
  ```graphql
  mutation {
    reportSuspiciousActivity(reportedUserId: "user-id", location: "City", reason: "Inappropriate behavior") {
      statusCode
      success
      message
      data
    }
  }
  ```
- **verifyLocation(location)**: Verify user location.
  ```graphql
  mutation {
    verifyLocation(location: "lat,long") {
      statusCode
      success
      message
      data
    }
  }
  ```
- **confirmIdentity**: Confirm identity (requires `photo` via `multipart/form-data`).
  ```graphql
  mutation {
    confirmIdentity {
      statusCode
      success
      message
      data
    }
  }
  ```

### GraphQL Subscriptions
- **messageReceived**: Subscribe to real-time message updates.
  ```graphql
  subscription {
    messageReceived {
      id
      text
      sender { id }
      receiver { id }
    }
  }
  ```

---

## Error Handling
- Errors are managed with the `ApiError` class:
  - `statusCode`: HTTP status (e.g., 400, 401, 500)
  - `status`: "fail" (4xx) or "error" (5xx)
  - `message`: Descriptive error message
  - `isOperational`: Indicates expected errors (default: true)
- `asyncHandler` catches errors in async functions, passing them to API responses.

---

## Response Format
All responses use the `ApiResponse` class:
```json
{
  "statusCode": Int,    // HTTP status code (e.g., 200, 400)
  "success": Boolean,   // True if statusCode < 400
  "message": String,    // Descriptive message
  "data": JSON          // Response data or null on error
}
```
- **Success Example**:
  ```json
  {
    "statusCode": 200,
    "success": true,
    "message": "Profiles retrieved successfully",
    "data": [/* user objects */]
  }
  ```
- **Error Example**:
  ```json
  {
    "statusCode": 400,
    "success": false,
    "message": "Invalid swipe direction",
    "data": null
  }
  ```

---

## Dependencies
- **Core**: `express`, `apollo-server-express`, `graphql`, `mongoose`
- **Security**: `helmet`, `express-mongo-sanitize`, `csurf`, `express-rate-limit`
- **Utilities**: `jsonwebtoken`, `bcryptjs`, `dotenv`, `winston`
- **File Handling**: `multer`, `cloudinary`
- **Development**: `nodemon`
- **GraphQL Tools**: `@graphql-tools/schema`, `subscriptions-transport-ws`
- **Swagger**: `swagger-jsdoc`, `swagger-ui-express`

---

## Contributing
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit changes (`git commit -m "Add your feature"`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.

---

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
