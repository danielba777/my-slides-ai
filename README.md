# My Slides AI

This repository powers the **My Slides AI** application. The most important part of this document is the branching workflow, so that we can collaborate without stepping on each other’s changes.

---

## Branch Strategy

| Branch   | Purpose                                                          | Who pushes                                                |
| -------- | ---------------------------------------------------------------- | --------------------------------------------------------- |
| `main`   | Production-ready code. This branch must always be deployable.    | **Nobody pushes directly.** Only reviewed PRs are merged. |
| `daniel` | Daniel’s integration branch. Draft and feature work starts here. | Daniel only.                                              |
| `artur`  | Artur’s integration branch. Draft and feature work starts here.  | Artur only.                                               |

Both personal branches are long-lived and track `main`. Any spike branches (feature, bugfix) should branch off your personal branch and merge back into it.

---

## Daily Workflow

1. **Sync `main` locally**
   ```bash
   git checkout main
   git pull origin main
   ```
2. **Sync your personal branch (`daniel` or `artur`)**
   ```bash
   git checkout <personal-branch>
   git pull origin <personal-branch>
   git merge main   # or git rebase main if you prefer a linear history
   ```
3. **Create a short-lived feature branch (optional but recommended)**
   ```bash
   git checkout -b feature/<topic>
   ```
4. **Commit changes frequently**
   ```bash
   git add .
   git commit -m "Describe the change"
   ```
5. **Push the feature branch**
   ```bash
   git push origin feature/<topic>
   ```
6. **Open a Pull Request targeting your personal branch**

   - Assign yourself as the owner and request review if needed.
   - Once approved, merge into your personal branch.

7. **When ready to promote work to production**
   - Open a PR from your personal branch (`daniel` or `artur`) into `main`.
   - Tag the other teammate for review.
   - Only merge when CI passes and both agree the code is production-ready.

---

## Keeping Personal Branches Up to Date

- **At least once per day**, merge `main` into your personal branch to minimize divergence.
- Resolve conflicts locally before pushing.
- If a change on `main` breaks your work-in-progress, coordinate early so we can fix it quickly.

---

## Pull Request Expectations

1. **Clear description** of what changed and why.
2. **Testing notes** (commands run, screenshots, etc.).
3. **No direct pushes to `main`**. Every change must flow through a PR.
4. **Use squash merge** for feature branches into personal branches to keep history tidy.
5. **Use merge commits** (not squash) when promoting `daniel`/`artur` into `main` so we preserve the branch structure and deployment history.

---

## Handling Production Hotfixes

1. Branch off `main` (`hotfix/<issue>`).
2. Fix, test, and open a PR directly into `main`.
3. After merging, immediately merge `main` back into both `daniel` and `artur` to keep them current.

---

## Local Development Tips

- Install dependencies with `pnpm install`.
- Common scripts:
  ```bash
  pnpm dev    # start Next.js locally
  pnpm type   # run TypeScript checks
  pnpm lint   # run lint (if configured)
  ```
- Follow the existing ESLint/Prettier setup so that diffs stay clean.

---

## Release Checklist

1. Confirm `main` has the commits you want to release.
2. Tag the release (optional) – `git tag -a vX.Y.Z -m "Release notes"`.
3. Deploy using the production pipeline.
4. Announce the release and archive the associated work items.

---

By sticking to this workflow, we keep `main` stable, ensure both `daniel` and `artur` stay in sync, and make it easy to understand who is responsible for each change. Happy shipping! 👍

// pnpm Bug Fix
