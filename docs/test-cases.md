# Qveto Initial Test Cases (Week 1 Baseline)

**Document Owner:** Member 5 (QA)  

---

### Test Suite: Authentication, Sessions & Role Foundations

| Test Case ID | Feature / Area | Steps to Execute | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-AUTH-01** | User Auth Lookup | Query user record by email `alice@acme.com`. | Returns user details with role `OWNER` and org `org_acme_corp`. | Matches expected schema. | **PASS** |
| **TC-AUTH-02** | Multi-Tenant Membership | Check tenant membership mapping for `user_owner_1`. | Confirms membership in `org_acme_corp`. | Confirmed. | **PASS** |
| **TC-PERM-01** | Owner Project Creation | Call `createProject` with `OWNER` role credentials. | Project successfully created with ID and active status. | Created successfully. | **PASS** |
| **TC-PERM-02** | Employee Project Creation Denial | Call `createProject` with `EMPLOYEE` credentials. | Server rejects operation with `403 Forbidden`. | Rejected with 403. | **PASS** |
