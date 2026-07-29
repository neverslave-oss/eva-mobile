# Agent Development Workflow

This document describes the standard workflow for developing and maintaining all repositories under `repositories/`. It ensures consistency, quality, and reliability across all collaborative development and iteration.

---

## ⚠️ Before Touching Any Codebase

1. **Read commit history first**: `git log --oneline -20`
2. **Never judge a project by its README** — READMEs go stale; commit history reflects reality
3. Only then read source files and plan work

This applies to every repo, every time. No exceptions.

### Repository AGENTS.md Guard (mandatory)

Before working in any **new or existing** repository under `repositories/`:

1. Check whether `<repo>/AGENTS.md` exists.
2. If it does **not** exist, copy the canonical template from `repositories/AGENTS.md` into that repository as `AGENTS.md`.
3. Read that repository’s `AGENTS.md` fully before making any change.
4. If a repository already has its own `AGENTS.md`, do **not** overwrite it — follow the repo-local file.

---

## Core Principles

- **No push without green tests.** Every feature must have passing tests before merge.
- **Tests before the first release tag.** If you're about to `git tag v1.0.0`, there must be a test suite already committed.
- **No iterative fix→build→crash cycles.** Audit the root cause fully, fix everything in one PR, run tests, reviewer checks — then merge once.
- **Always `ls` before creating anything.** Never recreate existing scripts, skills, or files.

---

## Feature Flow (mandatory for all non-trivial changes)

```
plan → implementation → tests → human approval → merge
```

### When to use the full flow
- New feature or refactor > ~50 lines
- Changes spanning multiple files
- DB schema changes
- Any destructive or irreversible action
- New public-facing API endpoints

### When a quick fix is OK
Simple contained tasks (fix a typo, update a config value, add a single function) can skip planning — but **still require at least a smoke test** committed with the fix.

---

## Workflow Steps

### 1. Plan (complex/risky tasks)

Spawn a planner subagent or write a `.specs/plans/<task>.md`. It reads the codebase and returns:
- Checklist of steps
- Risk assessment
- Files to be touched

Send Fabio the **checklist summary only**. Wait for "go" before proceeding.

### 2. Branch

```bash
# Always from main (or dev if mid-sprint)
git checkout main
git checkout -b feature/<short-description>
# e.g. feature/add-rsi-signals, fix/createpost-categories-type
```

### 3. Implement

- Work iteratively on the feature branch
- Commit frequently with clear messages:
  ```bash
  git commit -m "feat: add RSI signal calculation to signals.py"
  ```
- Do NOT push until tests are green and review is complete

### 4. Write Tests

Tests are written **as part of the implementation**, not after. Before requesting approval:

- Unit tests for all new logic (pure functions, parsers, validators)
- Integration tests for API endpoints or service interactions
- Edge cases for known failure modes
- Run the full suite — all tests must pass:
  ```bash
  pytest tests/ -v
  # or for PHP:
  php artisan test
  ```

### 5. Human Approval

Send Fabio:
- What was built (summary, not wall of text)
- Test results (`X passed, 0 failed`)
- Commit hash
- Any open questions or tradeoffs

Wait for explicit approval before merging or pushing.

### 6. Merge & Push

After approval:

```bash
# Merge feature branch to dev or main
git checkout main
git merge feature/<short-description>
git push origin main
```

For `repositories/*` repos: Olly pushes autonomously after approval.  
For the workspace repo (`~/.openclaw/workspace`): always ask Fabio to push.

---

## Releasing (Tagging)

Before tagging any release:

1. Test suite must exist and be green
2. All open PRs for the release milestone must be merged
3. CHANGELOG or commit log must reflect what changed

```bash
git tag -a v1.0.0 -m "Initial release — describe what's in it"
git push origin v1.0.0
```

---

## CI/CD (in progress)

Goal: automated test runs on every push. Current status: manual.

Planned pipeline per repo:
- **Trigger:** push to `main` or `dev`, or PR opened
- **Steps:** lint → unit tests → integration tests → report
- **Gate:** merge blocked if any step fails

Until CI is wired up, Olly runs the test suite manually before every merge and includes results in the approval request.

---

## Branching Structure

| Branch | Purpose |
|---|---|
| `main` | Stable, production-ready |
| `dev` | Integration branch for bundling related changes |
| `feature/<name>` | One branch per task/issue |
| `fix/<name>` | Bug fixes |
| `chore/<name>` | Non-functional changes (docs, deps, config) |

---

## Commit Message Format

```
<type>: <short description>

Types: feat, fix, test, chore, docs, refactor, perf
```

Examples:
```
feat: add volume signal to signals.py
fix: remove strict array type from $categories in CreatePost
test: add unit tests for skills.py parsing
chore: update pyproject.toml with pytest config
```

---

## GitHub Issues

For tracked work, create a GitHub issue first:

```bash
gh issue create --title "<Task Title>" --body "<Description>" --assignee pacificDev
```

Branch from it:
```bash
git checkout -b feature/issue-<number>-<short-name>
```

---

## Notes

- Always use concise, descriptive commit messages
- Follow branching structure to avoid conflicts
- Regularly test — never merge untested code
- When in doubt, ask Fabio before pushing anything external

---

*Last updated: 2026-04-29 — aligned with agreed plan→implementation→tests→approval→merge flow*
