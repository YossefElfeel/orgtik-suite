---
title: "Kanban Board API Response Contract — Flat Columns + Tasks"
version: "1.0"
date_created: "2026-08-27"
last_updated: "2026-08-27"
owner: "somion-task-manager front-end team"
tags: ["data", "api", "kanban", "board", "performance"]
---

# Introduction

The project Kanban board currently calls `GET /projects/{projectId}` and receives a nested `sections → { section, tasks[] }` payload. The front end then reshapes that payload into flat `columns[]` and `tasks[]` (with `columnId`) before rendering. That client-side reshape adds latency and the oversized payload slows the network response.

This specification defines the exact response shape the board needs so the backend can return board-ready data, drop unused fields, and eliminate front-end reshaping.

---

## 1. Purpose & Scope

### Purpose
Define a lean, board-ready API contract for the project Kanban view so the client can consume the response with no structural transform.

### Scope
- Primary: project Kanban board data loading.
- Secondary: project archive column loading (same task/column field rules).
- Out of scope: task detail sheet payloads, create/update task mutations, list/table views (may reuse this shape later), and non-board project metadata pages.

### Audience
Backend developers implementing or changing project board endpoints. Front-end developers consuming the new contract.

### Assumptions
- Existing wrapper envelope remains: `{ success: boolean, message: string, data: T }`.
- Search continues to filter tasks by query string.
- Archive remains lazy-loaded (not included in the initial board response).
- Column title display formatting (e.g. replacing `_` with spaces) may stay on the client; backend returns the stored `title` as-is.

### Recommended approach
Prefer a **dedicated board endpoint** so `GET /projects/{projectId}` can keep serving richer project-detail consumers without forcing them onto a slim board payload.

| Option | Endpoint | Recommendation |
|--------|----------|----------------|
| A (preferred) | `GET /projects/{projectId}/board` | New dedicated board contract |
| B | Change `GET /projects/{projectId}` | Only if all current consumers of that endpoint accept the new shape |

This spec describes the **target `data` payload**. Apply it to Option A by default.

---

## 2. Definitions

| Term | Definition |
|------|------------|
| **Column** | A Kanban column. Maps 1:1 to a project section. |
| **columnId** | The section id that owns a task. Required on every task so the board can group without nesting. |
| **Board-ready** | Response shape the Kanban UI can bind to directly (`columns[]` + `tasks[]`) with no flatten/map/inject step. |
| **Slim field** | A field required for board card rendering or drag-and-drop. |
| **Envelope** | Standard API wrapper: `{ success, message, data }`. |
| **Archive section** | Optional archived-tasks column loaded on demand via a separate endpoint. |

---

## 3. Requirements, Constraints & Guidelines

### Requirements

- **REQ-001**: Provide a board endpoint that returns flat `columns` and flat `tasks` in one response.
- **REQ-002**: Every task MUST include `columnId` equal to its section id. The client MUST NOT derive column membership from nesting.
- **REQ-003**: `columns` MUST be sorted ascending by `order` before response.
- **REQ-004**: Within each column, `tasks` SHOULD be ordered ascending by `order`. The flat `tasks` array MAY be column-grouped or fully sorted by `(columnId, order)`; either is acceptable if `order` values are correct.
- **REQ-005**: Response MUST include only the fields listed in Section 4. Do not include nested `sections[].section` / `sections[].tasks` structure.
- **REQ-006**: `search` query param MUST filter tasks (title/description or existing search semantics). Columns with zero matching tasks MUST still be returned.
- **REQ-007**: Archive endpoint MUST return the same slim column + tasks field contract (see Section 4.3).
- **REQ-008**: Project-level `members` and `teams` MUST be included (slim) because the board page uses them for assignee avatars and add-member/add-team dialogs.

### Constraints

- **CON-001**: Do not nest tasks inside columns in the board response.
- **CON-002**: Do not repeat `project: { id, title }` on every section/task.
- **CON-003**: Do not return full assignment graphs, dependency graphs, attachment file lists, subtask arrays, activity logs, or `createdBy` objects on board tasks.
- **CON-004**: Numeric ids remain numbers (not strings) in JSON. The client stringifies where UI libraries require strings.
- **CON-005**: `dueDate` MUST be an ISO 8601 date/datetime string or `null`.

### Guidelines

- **GUD-001**: Prefer omitting null/empty optional nested objects rather than sending empty placeholders, except where listed as required arrays (`columns`, `tasks`, `members`, `teams`, `assignments`).
- **GUD-002**: Keep assignee objects on tasks minimal: only fields needed for avatar display.
- **GUD-003**: If Option A is chosen, keep `GET /projects/{projectId}` unchanged for other screens until those screens are migrated deliberately.

### Patterns

- **PAT-001**: Board list payload = metadata + columns + flat tasks.
- **PAT-002**: Detail payloads (task sheet) remain separate heavier endpoints.

---

## 4. Interfaces & Data Contracts

### 4.1 Endpoint — Board (preferred)

```
GET /projects/{projectId}/board?search={search}
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `projectId` | number (path) | yes | Project id |
| `search` | string (query) | no | Task search filter; empty/absent = all tasks |

**Auth / permissions**: same as current project details access.

### 4.2 Response envelope

```ts
type SuccessResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};
```

### 4.3 `data` contract — Board

```ts
type BoardResponseData = {
  id: number;                 // project id
  title: string;              // project title (dialogs / page context)
  members: BoardMember[];     // project members
  teams: BoardTeam[];         // project teams
  columns: BoardColumn[];     // sorted by order ASC
  tasks: BoardTask[];         // flat list; each has columnId
};

type BoardMember = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
};

type BoardTeam = {
  id: number;
  name: string;
  teamImage: string | null;
  description?: string;       // optional; omit if unused by dialogs
};

type BoardColumn = {
  id: number;                 // section id
  title: string;              // stored section title
  color: string;              // hex or existing color token string
  order: number;
  flag?: string;              // optional; useful for section menus, not required for card render
};

type BoardTask = {
  id: number;
  columnId: number;           // MUST equal owning section id
  order: number;              // position within column (1-based or 0-based — keep current API convention)
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string | null;     // ISO 8601
  attachmentsCount: number;
  commentsCount: number;
  assignments: BoardTaskAssignment[];
};

type BoardTaskAssignment = {
  assignee: {
    id: number;
    avatar: string | null;
    firstName: string;        // used for avatar fallback
    name?: string;            // optional display name; if omitted, client may compose from first/last
    lastName?: string;
  };
};
```

### 4.4 Endpoint — Archive (align field contract)

```
GET /projects/{projectId}/archive-tasks
```

Current endpoint path may remain. Change only the `data` shape:

```ts
type ArchiveBoardResponseData = {
  column: BoardColumn;
  tasks: BoardTask[];         // every task.columnId === column.id
};
```

### 4.5 Fields to REMOVE (present today, not needed for board)

These appear in the current nested project-details payload and MUST NOT appear on the board/archive board contracts:

**Per section (current `IProjectSectionDetails`)**
- `project` (repeated `{ id, title }`)
- `tasksCount`
- `completedTasksCount`
- `progressPercentage`
- Nested wrapper `section: { ... }` — flatten into `columns[]` entries instead

**Per task (current board consumer does not use)**
- `members` (use `assignments` only)
- `assignmentsCount`
- `canComplete`
- `progress`
- `status`
- `subtasksCount`
- `createdAt`
- `updatedAt`
- `project`
- Full `assignments[].assignedBy`, `assignedAt`, `assigneeType`, `assigneeId` metadata
- `subtasks[]`, `dependencies`, `attachments[]` (file objects), activity arrays

**Project-level (not needed for board paint; keep only `id`, `title`, `members`, `teams`)**
- `description`
- `priority`
- `isPrivate`
- `sectionsCount`
- `totalAttachmentsCount`
- `totalCommentsCount`
- `completedTasksPercentage`
- `createdAt`
- `updatedAt`

### 4.6 Example — Board success response

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "id": 42,
    "title": "Website Redesign",
    "members": [
      {
        "id": 7,
        "email": "alex@example.com",
        "firstName": "Alex",
        "lastName": "Nguyen",
        "avatar": "https://cdn.example.com/a.png"
      }
    ],
    "teams": [
      {
        "id": 3,
        "name": "Design",
        "teamImage": null
      }
    ],
    "columns": [
      {
        "id": 101,
        "title": "todo",
        "color": "#3B82F6",
        "order": 1,
        "flag": "todo"
      },
      {
        "id": 102,
        "title": "in_progress",
        "color": "#F59E0B",
        "order": 2,
        "flag": "in_progress"
      }
    ],
    "tasks": [
      {
        "id": 1001,
        "columnId": 101,
        "order": 1,
        "title": "Draft wireframes",
        "description": "Mobile + desktop",
        "priority": "high",
        "dueDate": "2026-09-01T00:00:00.000Z",
        "attachmentsCount": 2,
        "commentsCount": 4,
        "assignments": [
          {
            "assignee": {
              "id": 7,
              "avatar": "https://cdn.example.com/a.png",
              "firstName": "Alex",
              "lastName": "Nguyen",
              "name": "Alex Nguyen"
            }
          }
        ]
      },
      {
        "id": 1002,
        "columnId": 102,
        "order": 1,
        "title": "Implement header",
        "description": null,
        "priority": "medium",
        "dueDate": null,
        "attachmentsCount": 0,
        "commentsCount": 0,
        "assignments": []
      }
    ]
  }
}
```

### 4.7 Example — Archive success response

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "column": {
      "id": 199,
      "title": "archive",
      "color": "#6B7280",
      "order": 99,
      "flag": "done"
    },
    "tasks": [
      {
        "id": 2001,
        "columnId": 199,
        "order": 1,
        "title": "Old launch checklist",
        "description": null,
        "priority": "low",
        "dueDate": null,
        "attachmentsCount": 0,
        "commentsCount": 1,
        "assignments": []
      }
    ]
  }
}
```

### 4.8 Front-end consumption after change (no reshape)

Client will bind directly:

- `columns` → Kanban columns (`id`, `title`, `color`, `order`)
- `tasks` → Kanban items via `task.columnId`
- `members` / `teams` → dialogs and mention/avatar helpers

Icon nodes (e.g. colored dot) remain client-only UI and are not part of the API.

---

## 5. Acceptance Criteria

- **AC-001**: Given a project with multiple sections and tasks, When `GET /projects/{id}/board` is called, Then `data.columns` is a flat array sorted by `order` and `data.tasks` is a flat array where every task has a valid `columnId`.
- **AC-002**: Given the board response, When the front end renders the Kanban, Then no flatten/`flatMap`/columnId-injection transform is required.
- **AC-003**: Given `search=wire`, When board is requested, Then only matching tasks are returned and all columns still appear.
- **AC-004**: Given archive is requested, When the archive endpoint responds, Then `data.column` + `data.tasks` use the slim field set and each task has `columnId === data.column.id`.
- **AC-005**: Given the board payload, When inspected, Then none of the fields listed in Section 4.5 are present.
- **AC-006**: Given tasks with assignees, When rendered, Then `assignments[].assignee.id|avatar|firstName` are sufficient to show up to 3 avatars plus overflow count.
- **AC-007**: Given an empty section, When board is requested, Then the column is present and simply has zero tasks referencing its id.

---

## 6. Test Automation Strategy

- **Test Levels**: Unit (serializer/mapper), Integration (endpoint contract), End-to-End (board loads without client reshape).
- **Frameworks**: Existing backend test stack; front-end contract types aligned to this spec.
- **Test Data Management**: Seed a project with ≥2 sections, mixed empty/non-empty columns, tasks with 0/1/4+ assignees, null `dueDate`, and archive tasks.
- **CI/CD Integration**: Contract/schema assertion on board and archive endpoints in pipeline.
- **Coverage Requirements**: Assert required keys present; assert banned keys absent; assert sort order; assert `columnId` integrity.
- **Performance Testing**: Compare payload size and p95 latency of old nested `GET /projects/{id}` vs new board endpoint for a project with ~200 tasks.

---

## 7. Rationale & Context

Today the board page:

1. Fetches nested project details.
2. Maps sections → columns.
3. `flatMap`s tasks and injects `columnId`.
4. Sets local state after reshape (`isReshaping`).

That work is pure data reshaping and should be done once on the server (or via a dedicated projection query), not on every client load/search. Removing unused nested and aggregate fields also reduces JSON size, which is the main latency lever for large boards.

Task detail remains a separate heavier fetch when the user opens a task sheet; the board only needs card + DnD fields.

---

## 8. Dependencies & External Integrations

### External Systems
- **EXT-001**: Project/section/task persistence store — source of board projection data.

### Third-Party Services
- None specific to this contract.

### Infrastructure Dependencies
- **INF-001**: Existing authenticated HTTP API for projects.

### Data Dependencies
- **DAT-001**: Sections ordered by `order`.
- **DAT-002**: Tasks belonging to sections, ordered by `order`, with assignment summaries and comment/attachment counts.

### Technology Platform Dependencies
- **PLT-001**: JSON HTTP API compatible with current SuccessResponse envelope.

### Compliance Dependencies
- **COM-001**: Same authorization rules as current project details endpoint (no privilege broadening).

---

## 9. Examples & Edge Cases

### Empty project (sections exist, no tasks)

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "id": 42,
    "title": "Empty Board",
    "members": [],
    "teams": [],
    "columns": [
      { "id": 1, "title": "todo", "color": "#3B82F6", "order": 1 }
    ],
    "tasks": []
  }
}
```

### Search matches nothing

Return all columns and `tasks: []`.

### Task with many assignees

Return full `assignments` array (client displays first 3 + `+N`). Do not pre-truncate on the server unless payload size becomes an issue; if truncating, include `assignmentsTotal` (not required in v1).

### Invalid / unauthorized project

Keep existing error envelope/status codes used by project details.

---

## 10. Validation Criteria

- [ ] Board endpoint returns flat `columns` + `tasks`.
- [ ] Every task includes correct `columnId`.
- [ ] Columns sorted by `order` ascending.
- [ ] Banned fields from Section 4.5 are absent.
- [ ] `members` and `teams` are present and slim.
- [ ] Archive endpoint matches slim column/task contract.
- [ ] Search preserves columns and filters tasks only.
- [ ] Front end can remove the board-page reshape `useEffect` after switching to this contract.
- [ ] Payload size and response time improved vs nested project-details for large boards.

---

## 11. Related Specifications / Further Reading

- Current front-end board consumer: `app/[locale]/(dashboard)/projects/[projectId]/board/page.tsx`
- Current types: `types/projects.ts` (`IProjectDetails`, `IProjectSectionDetails`), `types/tasks.ts` (`IProjectTask`)
- Current API slice: `redux/features/projects/projectsApi.ts` (`getProjectDetails`, `getProjectArchiveTasks`)
- Card field usage: `components/shared/TaskCard/index.tsx`
- Related future work: apply the same flat contract to project Lists view if it still reshapes nested sections
