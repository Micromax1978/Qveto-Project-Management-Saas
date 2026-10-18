# Initial Test Cases

**Status:** Not run. Update actual results after execution.

| ID | Test | Steps/input | Expected result | Actual result | Status |
|---|---|---|---|---|---|
| TC-01 | Valid sign-in | Use valid test credentials | User authenticated | Not run | Not run |
| TC-02 | Invalid sign-in | Use invalid credentials | Request rejected safely | Not run | Not run |
| TC-03 | Authorized project read | Request project in user's organization | Data returned if permitted | Not run | Not run |
| TC-04 | Cross-org project read | User A requests User B's project | Access denied; no data leak | Not run | Not run |
| TC-05 | Cross-org task update | User A updates another org's task | Access denied; no change saved | Not run | Not run |
| TC-06 | Create valid task | Submit valid task details | Task saved and returned | Not run | Not run |
| TC-07 | Missing task title | Submit task without required title | Validation error; no invalid record | Not run | Not run |
| TC-08 | Invalid project reference | Use nonexistent project ID | Request rejected; no orphan record | Not run | Not run |
| TC-09 | Invalid assignee | Assign user not eligible for org | Request rejected | Not run | Not run |
| TC-10 | Duplicate membership | Add same user/org membership twice | Duplicate prevented or safely handled | Not run | Not run |
| TC-11 | Persistence | Update task, reload, fetch again | Saved value remains | Not run | Not run |
| TC-12 | Seed repeatability | Run seed script twice | No unintended duplicate demo data | Not run | Not run |
| TC-13 | Fresh database | Apply migrations to clean database | Migrations succeed | Not run | Not run |
| TC-14 | Permission enforcement | Employee attempts restricted action | Backend rejects action | Not run | Not run |
| TC-15 | Invalid resource ID | Request malformed/nonexistent ID | Safe validation/not-found response | Not run | Not run |

## Execution notes
Record environment, date, actual result, and evidence. Adapt endpoints/payloads to the API actually implemented. Do not mark tests passed until executed.
