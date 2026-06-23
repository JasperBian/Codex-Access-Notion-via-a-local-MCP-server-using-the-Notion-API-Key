---
name: notion-spec-to-implementation
description: Turn Notion specs, PRDs, and requirements into implementation plans with tracked progress.
---

# Notion Spec to Implementation

Use this skill when working with Notion specs, product requirements, or feature documentation and tracking implementation progress.

## Workflow

### 1. Parse the spec
Read the Notion page or database containing the specification, identifying:
- Goals and non-goals
- Requirements (functional and non-functional)
- Acceptance criteria
- Technical constraints
- Dependencies

### 2. Create implementation plan
Break down the spec into a Notion database with:
- **Task/feature name**
- **Status** (To Do, In Progress, Done, Blocked)
- **Priority** (P0, P1, P2)
- **Owner**
- **Estimated effort**
- **Dependencies**
- **Acceptance criteria**
- **Notes**

### 3. Track progress
- Update database rows as work progresses
- Add sub-tasks or checklists for complex features
- Document blockers and decisions in page content
- Link PRs, commits, and related code artifacts

### 4. Generate explainer docs
When implementation is complete, create a summary page documenting:
- What was built
- Key architectural decisions
- Deviations from original spec (and why)
- Testing strategy and coverage
- Deployment and release notes

## Guidelines

- Keep the task database as the single source of truth for status
- Update status promptly to reflect reality
- Document reasons for scope changes in the page
- Use Notion rollups to aggregate progress across sub-projects
