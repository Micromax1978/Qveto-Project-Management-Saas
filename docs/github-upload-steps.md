# Member 5: GitHub Upload & Daily Workflow Guide
**Branch:** `member-5-qa-docs`  
**Repository:** `https://github.com/Micromax1978/Qveto-Project-Management-Saas.git`  
**Role:** Member 5 (Requirements, Testing, Documentation and QA)

---

## 1. Quick Status Check & Verification

Before uploading any work to GitHub, always verify that your working tree is clean and all tests are passing:

```powershell
# 1. Verify you are on your designated branch
git status

# 2. Run the automated test suite (all 39 tests must pass)
npm test
```

---

## 2. Daily Push Instructions (Step-by-Step)

Follow these exact steps from your terminal inside `project2`:

### Step 1: Check your branch
```powershell
git status
# The first line must display: On branch member-5-qa-docs
```

### Step 2: Stage any modified or new files
```powershell
git add .
```

### Step 3: Commit with clear descriptive message
Use proper commit prefixes (`feat:`, `test:`, `docs:`, `fix:`, `chore:`):
```powershell
git commit -m "docs: add github upload guide and week 2 deliverables"
```

### Step 4: Push to your branch on GitHub
```powershell
git push origin member-5-qa-docs
```
*(If pushing for the first time on a fresh setup, use `git push -u origin member-5-qa-docs`)*

### Step 5: Verify on GitHub
1. Open [https://github.com/Micromax1978/Qveto-Project-Management-Saas](https://github.com/Micromax1978/Qveto-Project-Management-Saas)
2. Switch to the `member-5-qa-docs` branch from the branch dropdown.
3. Confirm that your latest commits, `docs/`, `tests/`, and `README.md` are present.

---

## 3. Creating the Pull Request (PR) for Week 2 Review

Once your branch is pushed:
1. Navigate to GitHub: [Pull Requests](https://github.com/Micromax1978/Qveto-Project-Management-Saas/pulls)
2. Click **New pull request**.
3. Set **Base branch:** `main` $\leftarrow$ **Compare branch:** `member-5-qa-docs`.
4. Copy the PR Title and Description directly from [`docs/week-2-report.md`](./week-2-report.md):
   - **Title:** `[Week 2 Deliverables] Comprehensive Project & Task Test Suites, Kanban QA, Bug Tracking & Setup Docs`
5. Submit the pull request and notify your team leader.

---

## 4. Qveto Team Commit Rules
- **Rule 1:** Work only on `member-5-qa-docs`. Never push directly to `main`.
- **Rule 2:** Commit from your own computer and GitHub account.
- **Rule 3:** Only commit real, verified work with passing tests.
- **Rule 4:** Never commit passwords, `.env` files with real secrets, or `node_modules/`.
