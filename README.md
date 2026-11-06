# ⚡ Member 3: Backend & REST API Service

> **Microservice & REST API for SaaS Team Collaboration Platform**  
> **Role:** Member 3 — Backend Engineering, Express Server Setup, Project & Task APIs, Validation, and Error Handling  
> **Company:** QVETO TECHNOLOGIES

---

## 📌 Member 3 Scope & Execution Plan

According to the **Team Work Division & Project Execution Plan**:
- **Primary Area:** `Backend & API`
- **Main Responsibilities:**
  1. **Set up Node.js/Express server** (`server.js` with CORS, JSON body parser, health checks, route mounting).
  2. **Design REST API routes** for Projects, Tasks, Kanban operations, and Workspaces.
  3. **Implement project and task operations** (Controllers with CRUD, real-time progress calculations, task status transitions, subtask toggles, and assignee filtering).
  4. **Add input validation and consistent error responses** (Middlewares `validate.js` and `errorHandler.js`).
  5. **Document API endpoints** (`docs/API_SPECIFICATION.md`).
- **Expected Output:**
  **Working backend APIs for projects and tasks.**

---

## 📁 Repository Structure

```text
member-3-backend-api/
│
├── config/
│   ├── db.js                     # MongoDB connection & Zero-setup Memory DB fallback
│   └── memoryDb.js               # In-memory store with synthetic seed (Projects & Tasks)
│
├── controllers/
│   ├── projectController.js      # Project operations: CRUD, metrics, progress calculation
│   ├── taskController.js         # Task operations: CRUD, status, subtasks, assignment, filters
│   ├── workspaceController.js    # Workspaces & KPI dashboard statistics
│   └── authController.js         # Authentication endpoints for auth flow
│
├── routes/
│   ├── projectRoutes.js          # REST API routes for /api/projects
│   ├── taskRoutes.js             # REST API routes for /api/tasks & /api/tasks/:id/status
│   ├── workspaceRoutes.js        # REST API routes for /api/workspaces & /api/workspaces/stats
│   └── authRoutes.js             # /api/auth routes (integrated with Member 4)
│
├── middlewares/
│   ├── validate.js               # Strict input validation for projects, tasks & statuses
│   ├── errorHandler.js           # Consistent error formatting (CastError, ValidationError, etc.)
│   ├── authMiddleware.js         # JWT Bearer token authentication & user attachment
│   ├── roleMiddleware.js         # RBAC (authorizeRoles) & Tenant scoping (scopeToOrganization)
│   └── rateLimit.js              # Rate limiters for abuse prevention
│
├── models/
│   ├── index.js                  # Model proxy (switches MongoDB / MemoryDB dynamically)
│   ├── Project.js                # Project schema (key, members, progress, organization)
│   ├── Task.js                   # Task schema (status, priority, assignee, subtasks)
│   ├── Workspace.js              # Workspace schema
│   ├── User.js                   # User schema
│   ├── Organization.js           # Organization schema
│   └── Membership.js             # Membership schema
│
├── utils/
│   └── token.js                  # JWT token generator & validator
│
├── seeds/
│   └── seed.js                   # Database seed script for MongoDB
│
├── docs/
│   └── API_SPECIFICATION.md      # Full API endpoints documentation (as required)
│
├── tests/
│   └── api.test.js               # Automated tests for Project & Task APIs, Validation, RBAC
│
├── server.js                     # Express server setup, CORS, route mounting & health check
├── .env                          # Local environment variables
├── .env.example                  # Environment variables template
├── .gitignore                    # Ignored files (node_modules, .env, logs)
├── package.json                  # NPM scripts & dependencies
└── README.md                     # Comprehensive documentation
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- *(Optional)* **MongoDB** running on `mongodb://127.0.0.1:27017` (If MongoDB is absent, the in-memory fallback activates automatically with full project & task seed data).

### 2. Installation
```bash
git clone <your-github-repo-url>
cd member-3-backend-api
npm install
```

### 3. Environment Configuration
Copy the template `.env.example`:
```bash
cp .env.example .env
```
Default `.env` configuration:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/saas_collab_db
JWT_SECRET=super-secret-jwt-key-member3
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
ALLOW_MEMORY_DB=true
```

### 4. Run Server
```bash
# Production start
npm start

# Or development mode
npm run dev
```
Server runs at `http://localhost:5000`.

---

## 🧪 Automated Tests (19 / 19 Passed)

Run the test suite using Node.js built-in native test runner:
```bash
npm test
```

### Test Coverage Summary:
- **Suite 1: Project API Operations**
  - ✅ `POST /api/projects`: Project creation with unique key within tenant.
  - ✅ `POST /api/projects`: Duplicate project key rejection (409 Conflict).
  - ✅ `GET /api/projects`: List projects with live task progress percentages.
  - ✅ `GET /api/projects/:id`: Single project retrieval with status counters.
  - ✅ `PUT /api/projects/:id`: Update status and description.
  - ✅ `DELETE /api/projects/:id`: Owner-only project deletion.
- **Suite 2: Task & Kanban API Operations**
  - ✅ `POST /api/tasks`: Create task with subtasks, assignee, and priority.
  - ✅ `GET /api/tasks`: Multi-criteria filtering (status, priority, assignee, search).
  - ✅ `GET /api/tasks/:id`: Single task retrieval.
  - ✅ `PATCH /api/tasks/:id/status`: Drag-and-drop column transition (`todo` -> `in_progress` -> `review` -> `done`).
  - ✅ `PATCH /api/tasks/:id/subtasks/:subtaskId`: Subtask checkbox toggle.
  - ✅ `DELETE /api/tasks/:id`: Task deletion with permissions check.
- **Suite 3: Workspaces & Dashboard KPIs**
  - ✅ `GET /api/workspaces`: Organization workspaces list.
  - ✅ `GET /api/workspaces/stats`: Dashboard KPIs (completion rate, overdue tasks, active projects).
- **Suite 4: Input Validation**
  - ✅ `validateProjectInput`: Validates name, unique key, due date.
  - ✅ `validateTaskInput`: Validates title, project ID, priority, status.
  - ✅ `validateStatusUpdate`: Validates Kanban column transitions.
- **Suite 5: Centralized Error Handler**
  - ✅ CastError -> Clean 404 response.
  - ✅ ValidationError -> Clean 400 response.

---

## 📡 REST API Reference

Full specification available in [`docs/API_SPECIFICATION.md`](file:///docs/API_SPECIFICATION.md).

### 1. Projects API (`/api/projects`)
| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/api/projects` | Private | List all projects with live task progress % |
| `GET` | `/api/projects/:id` | Private | Single project details & task count breakdown |
| `POST` | `/api/projects` | `owner`, `manager` | Create project (Key, name, description, due date) |
| `PUT` | `/api/projects/:id` | `owner`, `manager` | Update status, due date, description |
| `DELETE` | `/api/projects/:id` | `owner` only | Delete project and cascade delete tasks |

### 2. Tasks & Kanban API (`/api/tasks`)
| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/api/tasks` | Private | Filter tasks by `projectId`, `status`, `priority`, `assignee`, or `search` |
| `GET` | `/api/tasks/:id` | Private | Get task with populated assignee and creator |
| `POST` | `/api/tasks` | Private | Create task with subtasks, priority, labels, due date |
| `PUT` | `/api/tasks/:id` | Private | Update task details (creator, assignee, or manager/owner) |
| `PATCH` | `/api/tasks/:id/status` | Private | Move task status & order for Kanban board drag-and-drop |
| `PATCH` | `/api/tasks/:id/subtasks/:subtaskId` | Private | Toggle subtask checkbox completion |
| `DELETE` | `/api/tasks/:id` | Private | Delete task |

### 3. Workspaces & Dashboard KPIs (`/api/workspaces`)
| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/api/workspaces` | Private | Workspaces in caller's organization |
| `GET` | `/api/workspaces/stats` | Private | Dashboard KPI metrics (completion %, overdue tasks, totals) |

### 4. System Health Check
| Method | Route | Access | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Returns server health and active database engine |

---

## 🤝 Coordination Note (Member 3 & Member 4)

- **Member 3 (Backend & API):** Handles server setup, routes, controllers, input validation, and endpoint documentation.
- **Member 4 (Database & Auth):** Supplies MongoDB schemas (`User`, `Organization`, `Workspace`, `Membership`), JWT token utilities, and authentication endpoints.
- Both modules integrate seamlessly via shared schemas and `authMiddleware`.

---

## 📦 How to Push this Repository to GitHub

```bash
# 1. Navigate to Member 3 repository
cd "C:\Users\sangi\.gemini\antigravity\scratch\member-3-backend-api"

# 2. Initialize Git
git init

# 3. Add all files
git add .

# 4. Commit
git commit -m "feat: complete member-3 backend and REST API service"

# 5. Create a new repository on GitHub (e.g. 'member-3-backend-api')

# 6. Link remote and set default branch
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/member-3-backend-api.git

# 7. Push to GitHub
git push -u origin main
```

---

## 📄 License
ISC © Member 3 - QVETO TECHNOLOGIES SaaS Collaboration Team
