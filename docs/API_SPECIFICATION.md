# REST API Specification

**Base URL:** `http://localhost:5000/api`  
**Authentication Scheme:** `Authorization: Bearer <JWT_TOKEN>`  
**Content-Type:** `application/json`

---

## 1. Authentication Endpoints

### 1.1 Register Account
- **Method / Route:** `POST /api/auth/register`
- **Access:** Public
- **What it does:** creates a new organization and makes the person its **owner**. A `role` sent in the request is ignored, and nobody can join an existing organization through this endpoint.
- **Rules:** name 2-60 characters, valid email (case-insensitive, must be unique), password at least 8 characters with a letter and a number, organization name 2-80 characters.
- **Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePass123",
  "organizationName": "Acme Corp"
}
```
- **Errors:** `400` validation problem (message explains which), `409` email already registered, `429` too many attempts.
- **Success Response (201 Created):**
```json
{
  "success": true,
  "token": "eyJhbGciOi...",
  "user": {
    "id": "671e...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "owner",
    "organization": { "id": "...", "name": "Acme Corp" },
    "defaultWorkspaceId": "..."
  }
}
```

### 1.2 User Login
- **Method / Route:** `POST /api/auth/login`
- **Access:** Public
- **Errors:** `401` wrong email or password (same message for both), `429` after 10 wrong attempts for the same account within 15 minutes.
- **Request Body:**
```json
{
  "email": "owner@apex.com",
  "password": "Password123!"
}
```
- **Success Response (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOi...",
  "user": {
    "id": "...",
    "name": "Alex Vance (Owner)",
    "email": "owner@apex.com",
    "role": "owner",
    "organization": { "id": "...", "name": "Apex Innovations Corp" },
    "defaultWorkspaceId": "..."
  }
}
```

### 1.3 Get Current User Profile
- **Method / Route:** `GET /api/auth/me`
- **Access:** Private (`Bearer Token`)

### 1.4 Get Organization Team Members
- **Method / Route:** `GET /api/auth/users`
- **Access:** Private (`Bearer Token`)
- **Description:** Returns the people in the requester's organization (for assignment dropdowns). Only `_id`, `name`, `email`, `role` and `avatar` are returned.

---

## 2. Project Endpoints (Member 3)

### 2.1 Get All Projects
- **Method / Route:** `GET /api/projects`
- **Access:** Private
- **Query Params:**
  - `workspaceId` (optional)
  - `status` (optional: `active`, `planning`, `completed`, `on_hold`)
- **Returns:** List of projects with computed `totalTasks`, `completedTasks`, and `progressPercentage`.

### 2.2 Get Single Project
- **Method / Route:** `GET /api/projects/:id`
- **Access:** Private

### 2.3 Create Project
- **Method / Route:** `POST /api/projects`
- **Access:** Private (Roles: `owner`, `manager`)
- **Request Body:**
```json
{
  "name": "E-Commerce App",
  "key": "ECOMM",
  "description": "Storefront redesign and cart checkout improvements",
  "dueDate": "2026-11-30T00:00:00.000Z",
  "members": ["userId1", "userId2"]
}
```

- **Notes:** `dueDate` must be a valid date (or empty). Every id in `members` must belong to the same organization, otherwise `400`.

### 2.4 Update Project
- **Method / Route:** `PUT /api/projects/:id`
- **Access:** Private (Roles: `owner`, `manager`)
- **Notes:** `status` must be one of `planning`, `active`, `completed`, `on_hold`, `archived`.

### 2.5 Delete Project
- **Method / Route:** `DELETE /api/projects/:id`
- **Access:** Private (Roles: `owner` only)
- **Description:** Cascades deletion to all tasks contained in the project.

---

## 3. Task & Kanban Endpoints (Member 3)

### 3.1 Get Tasks (with Multi-criteria Filters)
- **Method / Route:** `GET /api/tasks`
- **Access:** Private
- **Query Params:**
  - `projectId`: Filter by project
  - `status`: `todo` | `in_progress` | `review` | `done` | `all`
  - `priority`: `low` | `medium` | `high` | `urgent` | `all`
  - `assignee`: `userId` | `all`
  - `search`: Keyword string searched in title, description, and labels.

### 3.2 Create Task
- **Method / Route:** `POST /api/tasks`
- **Access:** Private
- **Request Body:**
```json
{
  "title": "Design responsive navigation bar",
  "description": "Mobile drawer and desktop sticky navbar",
  "project": "671e...",
  "priority": "high",
  "status": "todo",
  "assignee": "671e...",
  "dueDate": "2026-11-15T00:00:00.000Z",
  "labels": ["ui", "navbar"],
  "subtasks": [
    { "title": "Wireframe desktop navbar", "completed": true },
    { "title": "Implement mobile hamburger toggle", "completed": false }
  ]
}
```

- **Notes:** `dueDate` must be a valid date (or empty/null). `assignee` must be a person from the same organization, otherwise `400`. Titles are stored as plain text.

### 3.3 Update Task
- **Method / Route:** `PUT /api/tasks/:id`
- **Access:** Private. Owners and managers can change any task, other members only tasks assigned to them or created by them (otherwise `403`).

### 3.4 Move Task / Kanban Drag-and-Drop
- **Method / Route:** `PATCH /api/tasks/:id/status`
- **Access:** Private, same rule as updating a task (`403` for tasks that are not yours)
- **Request Body:**
```json
{
  "status": "in_progress",
  "order": 1
}
```

### 3.5 Toggle Subtask
- **Method / Route:** `PATCH /api/tasks/:id/subtasks/:subtaskId`
- **Access:** Private, same rule as updating a task

### 3.6 Delete Task
- **Method / Route:** `DELETE /api/tasks/:id`
- **Access:** Private (Roles: `owner`, `manager`, or the Task's Creator)

---

## 4. Workspace & KPI Stats Endpoints

### 4.1 Get Workspaces
- **Method / Route:** `GET /api/workspaces`

### 4.2 Get Dashboard KPIs & Metrics
- **Method / Route:** `GET /api/workspaces/stats`
- **Returns:**
  - `totalTasks`, `completedTasks`, `inProgressTasks`, `reviewTasks`, `todoTasks`
  - `activeProjects`, `totalTeamMembers`
  - `overdueTasks` (computed against current date/time)
  - `taskCompletionRate` (percentage)
  - `assignmentCoverageRate` (percentage)

## 4. General notes
- Everything is scoped to the logged-in user's organization. Ids from another organization behave as if they do not exist (`404`).
- Error responses look like `{ "success": false, "message": "..." }`.
- `GET /api/health` shows whether the server is using MongoDB or the in-memory demo database.
