# REST API Specification — Complete 4-Week Implementation

**Base URL:** `http://localhost:5000/api`  
**Authentication Scheme:** `Authorization: Bearer <JWT_TOKEN>`  
**Content-Type:** `application/json`

---

## 1. Authentication Endpoints (Member 4)
- `POST /api/auth/register` — Register account & auto-provision organization.
- `POST /api/auth/login` — Sign in and receive signed JWT token.
- `GET /api/auth/me` — Current user profile and active workspace.
- `GET /api/auth/users` — Organization team directory.

---

## 2. Project Endpoints (Member 3)
- `GET /api/projects` — Retrieve organization projects with live progress %.
- `GET /api/projects/:id` — Single project details.
- `POST /api/projects` — Create project with unique uppercase key (Owner/Manager).
- `PUT /api/projects/:id` — Update project metadata & members.
- `DELETE /api/projects/:id` — Cascade delete project & contained tasks (Owner only).

---

## 3. Tasks & Kanban Endpoints (Member 3)
- `GET /api/tasks` — Multi-criteria filtered search (`projectId`, `status`, `priority`, `assignee`, `search`).
- `POST /api/tasks` — Create task with priority, due date, tags, and subtasks.
- `GET /api/tasks/:id` — Single task details.
- `PUT /api/tasks/:id` — Update task details.
- `PATCH /api/tasks/:id/status` — Drag-and-drop Kanban column update.
- `PATCH /api/tasks/:id/subtasks/:subtaskId` — Toggle subtask checkbox.
- `DELETE /api/tasks/:id` — Delete task.

---

## 4. Collaboration & File Attachments (Week 3 — Member 3)
- `GET /api/tasks/:id/comments` — Retrieve discussion comments for task.
- `POST /api/tasks/:id/comments` — Post comment (triggers notification & activity log).
- `GET /api/tasks/:id/attachments` — List files attached to task.
- `POST /api/tasks/:id/attachments` — Upload file (validates size <= 10MB and approved MIME types).
- `GET /api/attachments/:id/download` — Secure download authorization check with tenant boundary enforcement.

---

## 5. Activity History & Audit Log (Week 3 — Member 3)
- `GET /api/activity` — Retrieve organization, project, or task activity stream.

---

## 6. Notifications & Overdue Alerts (Week 3 & 4 — Member 3)
- `GET /api/notifications` — List in-app alerts with unread counter.
- `PATCH /api/notifications/:id/read` — Mark single notification as read.
- `PATCH /api/notifications/read-all` — Mark all notifications as read.
- `POST /api/notifications/overdue-check` — Scan database for overdue tasks and auto-generate alerts.

---

## 7. Productivity Analytics & Multi-Tenant Audit (Week 4 — Member 3)
- `GET /api/analytics/summary` — Full analytics: completion rates, team workload table, milestone progress.
- `GET /api/analytics/multi-tenant-audit` — Live proof verifying that cross-tenant tasks are strictly blocked.
