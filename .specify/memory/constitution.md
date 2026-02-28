<!--
Sync Impact Report:
- Version change: [INITIAL_SETUP] → 1.0.0
- List of modified principles:
  - Code Quality (Added)
  - Testing Standards (Added)
  - User Experience Consistency (Added)
  - Performance Requirements (Added)
  - Spec-First Development (Added)
- Added sections: Tech Stack, Review Process
- Removed sections: N/A
- Templates requiring updates:
  - .specify/templates/plan-template.md (Reflects new principles)
  - .specify/templates/spec-template.md (Reflects new principles)
  - .specify/templates/tasks-template.md (Reflects new principles)
- Follow-up TODOs: N/A
-->

# bis-schedule Constitution

## Core Principles

### I. Code Quality

High code quality is achieved through strict linting, consistent naming conventions, and modular architecture. All code MUST be readable, maintainable, and avoid complex nested logic unless absolutely necessary and documented. Any technical debt introduced must be tracked and prioritized for resolution.

### II. Testing Standards

Automated testing is mandatory for all core logic. Every new feature MUST include unit tests, and regression tests MUST pass before any deployment. We aim for high test coverage on critical business logic to ensure stability and reliability. Automated checks MUST run on every pull request.

### III. User Experience Consistency

The user interface MUST remain consistent across all pages. This includes color palettes, typography, spacing, and interaction patterns. Any UI change MUST be evaluated against existing design tokens and patterns to ensure a professional and unified experience for the user.

### IV. Performance Requirements

Application performance is a top priority. Pages MUST load quickly, and assets MUST be optimized. We monitor Core Web Vitals and aim for a Lighthouse score of 90+ on performance. Any feature that significantly degrades performance (e.g., heavy JS payloads, unoptimized images) MUST be justified and mitigated.

### V. Spec-First Development

No coding follows without a clear specification. Every feature MUST be documented in a spec before implementation begins. This ensures alignment on requirements and technical approach, reducing rework and scope creep.

## Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+).
- **Package Manager**: pnpm or uv.
- **Deployment**: Netlify.
- **Logic**: Modular JavaScript using ES modules.

## Review Process

All changes MUST be reviewed for adherence to these principles. Automated checks (linting, tests) MUST pass before manual review. Pull requests should be descriptive, linking to the relevant specification and documentation.

## Governance

This constitution is the source of truth for project standards and takes precedence over individual preferences. Amendments require a proposal, justification, and a version bump following semantic versioning rules.

**Version**: 1.0.0 | **Ratified**: 2026-02-28 | **Last Amended**: 2026-02-28
