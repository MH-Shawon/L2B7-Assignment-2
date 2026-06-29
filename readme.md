# DevPulse

A collaborative platform for software teams to report bugs, suggest features, and coordinate resolutions.

## Project Overview

DevPulse is an internal issue and feature tracking system that enables teams to manage technical work efficiently. The platform allows contributors to report issues while maintainers oversee project progress and resolve tracking items. Built with TypeScript and Express, this API provides secure authentication and role-based access control for managing bug reports and feature requests.

## Features

- User authentication and registration with JWT tokens
- Role-based access control (contributor and maintainer roles)
- Create, read, update, and delete issues
- Filter and sort issues by type, status, and date
- Secure password hashing with bcrypt
- RESTful API design with consistent response formatting
- PostgreSQL database with raw SQL queries
- TypeScript for type safety throughout the codebase

## Technology Stack

- Node.js (LTS 24.x or higher)
- TypeScript (latest stable version)
- Express.js for API routing
- PostgreSQL for data persistence
- bcryptjs for password hashing
- jsonwebtoken for JWT authentication
- pg for database driver

## Project Structure

```
src/
├── app.ts                 # Express application setup
├── server.ts              # Server initialization
├── config/
│   └── index.ts           # Environment configuration
├── db/
│   └── index.ts           # Database connection and schema initialization
├── middleware/
│   ├── auth.ts            # JWT authentication middleware
│   └── index.d.ts         # TypeScript type definitions
├── modules/
│   ├── auth/              # Authentication endpoints (login)
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.route.ts
│   ├── user/              # User registration endpoints
│   │   ├── user.controller.ts
│   │   ├── user.interface.ts
│   │   ├── user.service.ts
│   │   └── user.route.ts
│   └── issue/             # Issue management endpoints
│       ├── issue.controller.ts
│       ├── issue.service.ts
│       └── issue.route.ts
├── types/
│   └── index.ts           # TypeScript type definitions
└── utility/
    └── sendResponse.ts    # Response formatting utility
```

## Installation

1. Clone the repository
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   ```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=5000
CONNECTION_STRING=postgresql://user:password@host:5432/devpulse
JWT_SECRET=your_secret_key_here
```

## Running the Project

Start the development server with hot reload:

```bash
npm run dev
```

The server will run on the port specified in your `.env` file (default: 5000).

## Database Schema

### Users Table

| Field      | Type         | Constraints                 |
| ---------- | ------------ | --------------------------- |
| id         | SERIAL       | Primary key, auto-increment |
| name       | VARCHAR(100) | NOT NULL                    |
| email      | VARCHAR(255) | UNIQUE, NOT NULL            |
| password   | TEXT         | NOT NULL                    |
| role       | VARCHAR(20)  | DEFAULT 'contributor'       |
| created_at | TIMESTAMP    | DEFAULT NOW()               |
| updated_at | TIMESTAMP    | DEFAULT NOW()               |

### Issues Table

| Field       | Type         | Constraints                       |
| ----------- | ------------ | --------------------------------- |
| id          | SERIAL       | Primary key, auto-increment       |
| reporter_id | INT          | References users(id)              |
| title       | VARCHAR(150) | NOT NULL                          |
| description | TEXT         | NOT NULL                          |
| type        | TEXT         | NOT NULL (bug or feature_request) |
| status      | TEXT         | open, in_progress, or resolved    |
| created_at  | TIMESTAMP    | DEFAULT NOW()                     |
| updated_at  | TIMESTAMP    | DEFAULT NOW()                     |

## API Endpoints

### Authentication Module

#### User Registration

- **Endpoint:** POST /api/auth/signup
- **Access:** Public
- **Request Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john.doe@devpulse.com",
    "password": "securePassword123",
    "role": "contributor"
  }
  ```
- **Response:** 201 Created
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@devpulse.com",
      "role": "contributor",
      "created_at": "2026-01-20T09:00:00Z",
      "updated_at": "2026-01-20T09:00:00Z"
    }
  }
  ```

#### User Login

- **Endpoint:** POST /api/auth/login
- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "john.doe@devpulse.com",
    "password": "securePassword123"
  }
  ```
- **Response:** 200 OK
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john.doe@devpulse.com",
        "role": "contributor",
        "created_at": "2026-01-20T09:00:00Z",
        "updated_at": "2026-01-20T09:00:00Z"
      }
    }
  }
  ```

### Issues Module

#### Create Issue

- **Endpoint:** POST /api/issues
- **Access:** Authenticated (contributor, maintainer)
- **Headers:** Authorization: <JWT_TOKEN>
- **Request Body:**
  ```json
  {
    "title": "Database connection timeout under load",
    "description": "Pool exhausts after 50+ concurrent queries, causing 500 errors",
    "type": "bug"
  }
  ```
- **Response:** 201 Created
  ```json
  {
    "success": true,
    "message": "Issue created successfully",
    "data": {
      "id": 45,
      "title": "Database connection timeout under load",
      "description": "Pool exhausts after 50+ concurrent queries, causing 500 errors",
      "type": "bug",
      "status": "open",
      "reporter_id": 1,
      "created_at": "2026-01-20T10:30:00Z",
      "updated_at": "2026-01-20T10:30:00Z"
    }
  }
  ```

#### Get All Issues

- **Endpoint:** GET /api/issues
- **Access:** Public
- **Query Parameters:**
  - `sort`: newest or oldest (default: newest)
  - `type`: bug or feature_request
  - `status`: open, in_progress, or resolved
- **Response:** 200 OK
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 45,
        "title": "Database connection timeout under load",
        "description": "Pool exhausts after 50+ concurrent queries, causing 500 errors",
        "type": "bug",
        "status": "open",
        "reporter": {
          "id": 1,
          "name": "John Doe",
          "role": "contributor"
        },
        "created_at": "2026-01-20T10:30:00Z",
        "updated_at": "2026-01-20T14:45:00Z"
      }
    ]
  }
  ```

#### Get Single Issue

- **Endpoint:** GET /api/issues/:id
- **Access:** Public
- **Response:** 200 OK
  ```json
  {
    "success": true,
    "data": {
      "id": 45,
      "title": "Database connection timeout under load",
      "description": "Pool exhausts after 50+ concurrent queries, causing 500 errors",
      "type": "bug",
      "status": "open",
      "reporter": {
        "id": 1,
        "name": "John Doe",
        "role": "contributor"
      },
      "created_at": "2026-01-20T10:30:00Z",
      "updated_at": "2026-01-20T14:45:00Z"
    }
  }
  ```

#### Update Issue

- **Endpoint:** PATCH /api/issues/:id
- **Access:** Maintainer (any issue) or Contributor (own issue if status is open)
- **Headers:** Authorization: <JWT_TOKEN>
- **Request Body:**
  ```json
  {
    "title": "Updated title",
    "description": "Updated description",
    "type": "bug"
  }
  ```
- **Response:** 200 OK
  ```json
  {
    "success": true,
    "message": "Issue updated successfully",
    "data": {
      "id": 45,
      "title": "Updated title",
      "description": "Updated description",
      "type": "bug",
      "status": "in_progress",
      "reporter_id": 1,
      "created_at": "2026-01-20T10:30:00Z",
      "updated_at": "2026-01-20T14:45:00Z"
    }
  }
  ```

#### Delete Issue

- **Endpoint:** DELETE /api/issues/:id
- **Access:** Maintainer only
- **Headers:** Authorization: <JWT_TOKEN>
- **Response:** 200 OK
  ```json
  {
    "success": true,
    "message": "Issue deleted successfully"
  }
  ```

## User Roles and Permissions

### Contributor

- Register and log in
- Create new issues (bug or feature request)
- View all issues
- Update their own issues if they are in open status
- Cannot delete issues
- Cannot change issue workflow status

### Maintainer

- All contributor permissions
- Update any issue field
- Delete any issue
- Change issue workflow status independently
- Access to all system functionality

## HTTP Status Codes

| Status Code | Reason                | Usage                                    |
| ----------- | --------------------- | ---------------------------------------- |
| 200         | OK                    | Successful GET, PATCH, PUT, DELETE       |
| 201         | Created               | Successful POST (resource created)       |
| 400         | Bad Request           | Validation errors, invalid input         |
| 401         | Unauthorized          | Missing or invalid JWT token             |
| 403         | Forbidden             | Valid token but insufficient permissions |
| 404         | Not Found             | Requested resource does not exist        |
| 500         | Internal Server Error | Server or database error                 |

## Authentication Flow

1. User registers with email and password
2. Password is hashed using bcryptjs (salt rounds: 8-12)
3. User logs in with email and password
4. Server validates credentials and returns JWT token
5. Client includes token in Authorization header for protected endpoints
6. Server verifies token signature and expiry before processing request
7. Role validation occurs before privileged operations

## Security Measures

- Passwords are never exposed in API responses
- Password hashing using bcryptjs with industry-standard salt rounds
- JWT tokens include user id, name, and role for permission verification
- Protected endpoints reject requests without valid JWT
- Role verification occurs before all privileged operations
- Email addresses must be unique across all user accounts

## Code Quality Standards

- Modular architecture with separate modules for each feature
- Reusable utility functions for common tasks
- TypeScript with strict typing (no any types)
- Consistent response formatting across all endpoints
- Raw SQL queries only (no query builders or ORMs)
- Clean and readable code with meaningful variable names

## Deployment

This API can be deployed to any Node.js hosting platform such as Vercel, Render, or Railway. Use NeonDB, Supabase, or ElephantSQL for PostgreSQL database hosting. Ensure environment variables and CORS are properly configured before deployment.
