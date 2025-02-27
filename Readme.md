# Backend (Express + Mongoose + Redis)

This is the backend of the MERN stack application, built using **Express**, **Mongoose**, **Redis** for caching, **JWT** for authentication, **Socket.IO** for real-time communication, and **Joi** for validation.

## Folder Structure
```
/backend
├── /src                        # Main source directory
│   ├── /config                 # Configuration files
│   ├── /controllers            # Controllers for request handling
│   ├── /middlewares            # Express middleware
│   ├── /models                 # Mongoose models
│   ├── /routes                 # API routes
│   ├── /services               # Service logic (e.g., business logic, external APIs)
│   ├── /socket                 # Socket.IO setup and events
│   ├── /utils                  # Utility functions
│   ├── app.js                  # Express app setup
│   ├── server.js               # Server setup with Socket.IO
│   └── index.js                # Entry point for the backend
├── .env                        # Environment variables
├── package.json                # Dependencies and scripts
├── README.md                   # Project documentation
└── nodemon.json                # Nodemon configuration (for development)
```

## Getting Started
### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud-based)
- Redis

### Installation
1. Clone the repository.
   ```bash
   git clone <repository-url>
   cd backend
   ```
2. Install dependencies.
   ```bash
   npm install
   ```
3. Create a `.env` file and add the following variables:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017
   JWT_SECRET=your_secret_key
   REDIS_HOST=127.0.0.1
   REDIS_PORT=6379
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```
4. Start the development server.
   ```bash
   npm run dev
   ```

### Scripts
- **`npm run dev`**: Starts the development server with Nodemon.
- **`npm start`**: Starts the production server.

## API Routes
Here are some key routes provided by the backend:
- **`/api/auth`**: Authentication routes (Login, Signup, Logout)
- **`/api/users`**: User-related routes (Get profile, update profile, etc.)
- **`/api/content`**: Content-related routes (Upload, fetch, delete content)
- **`/api/subscriptions`**: Subscription management routes

### Example Route
#### POST `/api/auth/login`
Request:
```json
{
  "email": "example@example.com",
  "password": "password123"
}
```
Response:
```json
{
  "success": true,
  "token": "<JWT_TOKEN>",
  "user": {
    "id": "123456",
    "name": "John Doe",
    "email": "example@example.com"
  }
}
```