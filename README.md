# Task Management & Collaboration Platform

A full-stack task management application with Kanban boards, project collaboration, and analytics dashboards.

## Features

- **User Authentication**: Secure login/registration with JWT tokens
- **Project Management**: Create, update, and manage projects with team members
- **Kanban Board**: Drag-and-drop task management with status columns
- **Task Management**: Create tasks with priorities, due dates, and assignees
- **Collaboration**: Comments, team member management, and activity tracking
- **Dashboard**: Analytics with charts showing task progress and statistics
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS

## Tech Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database
- **JWT** for authentication
- **bcryptjs** for password hashing
- **express-validator** for input validation

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **React Router** for navigation
- **@hello-pangea/dnd** for drag-and-drop
- **Recharts** for analytics charts
- **Axios** for API calls

## Project Structure

```
Project Management/
├── backend/
│   ├── config/
│   │   └── database.js       # PostgreSQL connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── projectController.js
│   │   ├── taskController.js
│   │   └── commentController.js
│   ├── middleware/
│   │   ├── auth.js           # JWT verification
│   │   └── errorHandler.js   # Global error handling
│   ├── routes/
│   │   ├── auth.js
│   │   ├── projects.js
│   │   ├── tasks.js
│   │   ├── comments.js
│   │   └── users.js
│   ├── schema.sql            # Database schema
│   ├── package.json
│   ├── server.js             # Entry point
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Register.jsx
│   │   │   ├── Layout/
│   │   │   │   ├── Layout.jsx
│   │   │   │   ├── Navbar.jsx
│   │   │   │   └── Sidebar.jsx
│   │   │   ├── Common/
│   │   │   │   ├── Loading.jsx
│   │   │   │   ├── ErrorMessage.jsx
│   │   │   │   └── Modal.jsx
│   │   │   ├── Dashboard/
│   │   │   │   └── Dashboard.jsx
│   │   │   ├── Projects/
│   │   │   │   ├── ProjectList.jsx
│   │   │   │   ├── CreateProject.jsx
│   │   │   │   └── ProjectDetail.jsx
│   │   │   ├── Tasks/
│   │   │   │   ├── KanbanBoard.jsx
│   │   │   │   ├── CreateTask.jsx
│   │   │   │   ├── TaskDetail.jsx
│   │   │   │   └── MyTasks.jsx
│   │   │   ├── Profile/
│   │   │   │   └── Profile.jsx
│   │   │   └── Settings/
│   │   │       └── Settings.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env.example
│
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE task_management;
```

2. Connect to the database and run the schema:
```bash
psql -U postgres -d task_management -f backend/schema.sql
```

### Backend Setup

1. Navigate to the backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from example:
```bash
cp .env.example .env
```

4. Update `.env` with your database credentials:
```env
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/task_management
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

5. Start the server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend folder:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from example:
```bash
cp .env.example .env
```

4. Update `.env` if needed:
```env
VITE_API_URL=http://localhost:5000/api
```

5. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/members` - Add member
- `DELETE /api/projects/:id/members/:userId` - Remove member

### Tasks
- `GET /api/tasks` - List tasks (with filters)
- `POST /api/tasks` - Create task
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PUT /api/tasks/:id/move` - Move task (drag-drop)
- `GET /api/tasks/my-tasks` - Get user's assigned tasks

### Comments
- `GET /api/comments/:taskId` - Get task comments
- `POST /api/comments/:taskId` - Add comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment

### Users
- `GET /api/users/search` - Search users
- `GET /api/users/:id` - Get user profile

## Default Test User

After setting up, you can register a new account or create a test user:

```sql
-- Password: password123 (hashed)
INSERT INTO users (username, email, password_hash, full_name)
VALUES (
  'testuser',
  'test@example.com',
  '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  'Test User'
);
```

## Development

### Running in Development Mode

1. Start the backend:
```bash
cd backend && npm run dev
```

2. In another terminal, start the frontend:
```bash
cd frontend && npm run dev
```

### Building for Production

1. Build the frontend:
```bash
cd frontend && npm run build
```

2. The build output will be in `frontend/dist/`

### Running Tests
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## Environment Variables

### Backend
| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| DATABASE_URL | PostgreSQL connection string | - |
| JWT_SECRET | Secret for JWT signing | - |
| JWT_EXPIRES_IN | JWT expiration time | 7d |
| NODE_ENV | Environment | development |

### Frontend
| Variable | Description | Default |
|----------|-------------|---------|
| VITE_API_URL | Backend API URL | http://localhost:5000/api |

## License

MIT License - feel free to use this project for learning or as a starting point for your own applications.
