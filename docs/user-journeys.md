# User Journeys

## 1. Sign in and open a project
1. User signs in with valid credentials.
2. System verifies identity.
3. System shows only organizations/projects the user may access.
4. User opens an authorized project.
**Expected:** No unauthorized data is shown.

## 2. Create a project
1. Authorized owner/manager opens project management.
2. User selects the correct organization/workspace.
3. User enters details and submits.
4. System validates and saves the project.
**Expected:** Project is saved under the correct organization/workspace.

## 3. Create and assign a task
1. User opens an authorized project.
2. User enters task details, priority, and due date as needed.
3. User selects an eligible assignee.
4. System validates and saves the task.
**Expected:** Task appears and persists after reload.

## 4. Update task status
1. User opens a task they may update.
2. User changes its status.
3. System checks permissions and saves.
4. User reloads the task/board.
**Expected:** Updated status persists.

## 5. Collaborate
1. Authorized user opens a task.
2. User adds a comment/attachment if supported.
3. System validates permissions and stores it.
**Expected:** Authorized project members can see the contribution.

## 6. Cross-organization access attempt
1. User from Organization A obtains an ID for a project/task in Organization B.
2. User attempts to read/update it through the API.
3. Backend checks organization membership and resource ownership.
**Expected:** Access is denied; protected data is not exposed and no change is made.
