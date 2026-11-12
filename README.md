# Project Management & Team Collaboration SaaS — Backend & REST API

**Student / Member Role:** Member 3 — Backend Engineer & API Architect  
**Scope Delivered:** Complete 4-Week Backend Implementation (Weeks 1 to 4)  
**Tech Stack:** Node.js, Express.js, MongoDB / Mongoose, JWT, CORS, Dotenv

---

## 📌 Deliverables Implemented by Member 3 Across All 4 Weeks

### Week 1: Multi-Tenant Architecture & Data Foundations
- Express app bootstrap with CORS, request logging, and unified JSON error handling (`errorHandler.js`).
- Modular route mounting under `/api`.

### Week 2: Projects, Tasks & Kanban Engine
- **Project CRUD:** Create, read, update, delete projects with unique key validation (`SAAS`, `MOB`) and automatic completion percentage calculation.
- **Task CRUD & Search:** Multi-criteria filtered query (`projectId`, `status`, `priority`, `assignee`, `search`).
- **Kanban Drag-and-Drop Endpoint (`PATCH /api/tasks/:id/status`):** Real-time column transitions and ordering.
- **Subtask Checkbox Toggle (`PATCH /api/tasks/:id/subtasks/:subtaskId`):** Checkbox state updates.

### Week 3: Collaboration, Attachments & Notifications
- **Comments API (`/api/tasks/:id/comments`):** Add and list task discussion threads with user attribution and activity logging.
- **Controlled File Attachments (`/api/tasks/:id/attachments`):** Enforces 10MB file limit and approved MIME types (PNG, JPEG, PDF, DOCX, JSON).
- **Secure Download Endpoint (`/api/attachments/:id/download`):** Verifies caller belongs to the same tenant before authorizing file download.
- **Activity Audit Trail (`/api/activity`):** Centralized activity stream for tasks, projects, and organizations.
- **Notification Center (`/api/notifications`):** In-app alert dispatch and mark-as-read endpoints.
- **Overdue Task Detection Engine (`POST /api/notifications/overdue-check`):** Automatically scans database for tasks where `dueDate < now` and creates overdue alerts.

### Week 4: Analytics Engine & Multi-Tenant Audit
- **Analytics Summary (`GET /api/analytics/summary`):** Computes team velocity, milestone progress, and individual workload distribution.
- **Multi-Tenant Audit Endpoint (`GET /api/analytics/multi-tenant-audit`):** Validates that cross-tenant tasks are strictly blocked from returning.

---

## 🚀 How to Run Locally

```bash
npm install
npm start
```
Runs at [http://localhost:5000](http://localhost:5000).

---

## 📤 GitHub Upload Commands for Member 3
```bash
git init
git add .
git commit -m "feat: complete member 3 backend REST API, comments, attachments, notifications, and analytics engine"
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>.git
git push -u origin main
```
