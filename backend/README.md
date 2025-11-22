# SkillHub Backend API

This is the backend API for the SkillHub application, built with Node.js, Express, and MongoDB.

## Features

- User authentication (login/register)
- JWT-based authentication
- Role-based access control (student/faculty)
- MongoDB database integration

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Bcrypt for password hashing

## Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example` (if available) or use the default values

4. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register new user
- `GET /api/auth/profile` - Get user profile (requires authentication)

## Environment Variables

- `PORT` - Server port (default: 5000)
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT token signing

## Development

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server