# Qveto SaaS: Role-Based Permission Matrix

**Document Owner:** Member 5 (QA) in alignment with Member 2 (Auth/Backend)  
**Status:** Approved & Enforced  

This matrix defines the authorization rules enforced at both the API/data layer and the user interface.

| System Action / Resource Operation | Owner | Manager | Employee | Notes / Enforcement Rule |
| :--- | :---: | :---: | :---: | :--- |
| **Organization Management** | | | | |
| View Organization Profile | Yes | Yes | Yes | Scoped strictly to current user's org |
| Edit Organization Settings & Name | Yes | No | No | Only the organization creator/owner |
| Invite New Members to Organization | Yes | Yes | No | Managers can invite employees |
| Remove Members from Organization | Yes | No | No | Owner exclusive |
| Delete Organization | Yes | No | No | Hard delete with cascading isolation |
| **Project Management** | | | | |
| Create New Project | Yes | Yes | No | Employees receive `403 Forbidden` |
| View All Projects in Organization | Yes | Yes | No | Owner & Manager see all org projects |
| View Assigned Projects | Yes | Yes | Yes | Employees only see projects where they are members |
| Edit Project Details (Name, Scope) | Yes | Yes | No | Managers edit assigned; Owners edit all |
| Archive / Delete Project | Yes | No | No | Owner exclusive |
| Add / Remove Members to Project | Yes | Yes | No | Restricted to project leads |
| **Task & Kanban Operations** | | | | |
| Create Task in Project | Yes | Yes | Yes | Any member assigned to project |
| View Tasks in Accessible Project | Yes | Yes | Yes | Within authorized project |
| Edit Task Details (Title, Description) | Yes | Yes | Yes | Assigned member, creator, or manager |
| Assign Task to Team Member | Yes | Yes | No | Restricted to Owner & Manager |
| Set Task Priority & Due Date | Yes | Yes | Yes | Full task planning capability |
| Add / Check Subtasks | Yes | Yes | Yes | Task collaborators |
| Move Kanban Card (Drag/Drop or Key) | Yes | Yes | Yes | Any project member |
| Delete Task | Yes | Yes | No | Owner or Manager only |
| **Search, Filters & Analytics** | | | | |
| Search Tasks by Keyword | Yes | Yes | Yes | Filtered strictly by tenant org |
| Filter by Assignee / Tag / Status | Yes | Yes | Yes | UI and API supported |
| View Project Productivity Reports | Yes | Yes | No | Aggregated team metrics |
| Cross-Tenant Access (Other Orgs) | **NO** | **NO** | **NO** | **Zero-Tolerance: strictly forbidden (404/403)** |
