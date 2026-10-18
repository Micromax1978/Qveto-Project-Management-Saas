# Role Permission Matrix

**Status:** Initial draft; confirm with the team.

| Action | Owner | Manager | Employee |
|---|---|---|---|
| View authorized organization data | Yes | If a member | If a member |
| Manage organization settings | Yes | Only if granted | No |
| Manage membership | Yes | As approved | No |
| Manage workspaces/teams | Yes | As approved | Only if granted |
| Create/manage projects | Yes | Within scope | Only if granted |
| Create tasks | Yes | Yes | As permitted |
| Update permitted tasks | Yes | Yes | Yes, within scope |
| Change task assignment | Yes | As permitted | Only if granted |
| View comments/activity | If authorized | If authorized | If authorized |
| Access another organization's data | No, unless explicitly authorized | No, unless explicitly authorized | No, unless explicitly authorized |

## Review notes
- Define whether employees may create tasks or edit tasks assigned to others.
- Define whether managers can invite/remove members or change roles.
- Enforce permissions in backend/API handlers, not only in the frontend.
- Test organization isolation using users from two demo organizations.
