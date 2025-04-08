import { gql } from 'apollo-server-express';

const typeDefs = gql`
  type User {
    id: ID!
    email: String!
    name: String!
    photoURL: String
    bio: String
    prompt: String
    preferences: String
    location: Location
    age: Int!
    gender: String!
    interests: [String]
    ethnicity: String
    education: String
    smoking: Boolean
    views: Int
    swipesRight: Int
    swipesLeft: Int
    superLikesReceived: Int
    hiatus: Boolean
    verified: Boolean
    maybeSwipes: [User]
    skippedMatches: [User]
    lastActive: String
    boostedUntil: String
  }

  type Location {
    type: String!
    coordinates: [Float]!
  }

  type Message {
    id: ID!
    sender: User!
    receiver: User!
    text: String!
    timestamp: String!
    read: Boolean!
    isConfession: Boolean!
  }

  type Match {
    id: ID!
    users: [User!]!
    createdAt: String!
  }

  type Confession {
    id: ID!
    text: String!
    sender: User!
    timestamp: String!
  }

  type SafetyReport {
    id: ID!
    userId: User!
    reportedUserId: User!
    location: String
    reason: String!
    timestamp: String!
  }

  type Stats {
    views: Int
    swipesRight: Int
    swipesLeft: Int
    superLikes: Int
    avgResponseTime: Float
    ghostedCount: Int
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type SwipeResponse {
    match: Boolean!
  }

  type UndoResponse {
    undoneUser: User
  }

  type ApiResponse {
    statusCode: Int!
    success: Boolean!
    message: String!
    data: JSON
  }

  type Query {
    profiles(lat: Float!, lng: Float!, maxDistance: Float, minAge: Int, maxAge: Int, gender: String, interests: String, preferences: String, ethnicity: String, education: String, smoking: Boolean): ApiResponse!
    stats: ApiResponse!
    conversation(userId: ID!): ApiResponse!
    safetyGuidelines: ApiResponse!
  }

  type Mutation {
    register(email: String!, password: String!, name: String!, phone: String!, prompt: String!, lat: Float!, lng: Float!, age: Int!, gender: String!, interests: String): ApiResponse!
    login(email: String!, password: String!): ApiResponse!
    swipe(targetId: ID!, direction: String!): ApiResponse!
    undo: ApiResponse!
    toggleHiatus: ApiResponse!
    superLike(targetId: ID!): ApiResponse!
    boostProfile: ApiResponse!
    sendMessage(receiverId: ID!, text: String!): ApiResponse!
    sendConfession(text: String!): ApiResponse!
    reportSuspiciousActivity(reportedUserId: ID!, location: String, reason: String!): ApiResponse!
    verifyLocation(location: String!): ApiResponse!
    confirmIdentity: ApiResponse!
  }

  type Subscription {
    messageReceived: Message!
  }

  scalar JSON
`;

export default typeDefs;