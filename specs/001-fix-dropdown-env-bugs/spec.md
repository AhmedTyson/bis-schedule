# Feature Specification: Fix Critical UI and Environment Bugs

**Feature Branch**: `001-fix-dropdown-env-bugs`  
**Created**: 2026-02-28  
**Status**: Draft  
**Input**: User description: "Fix bugs that highly critical my project as: 1. when switching between the lectures and sections: - the app refreshes chooses and clear all of the chooses from dropdown, and keeps showing me what i have choosed in the earlier page: (lectures) or ( Sections). - i want every time time switching page, to clear all automatically 2. ensure the real data shows up in the local however i make: - makes the github who only identifys the demo mockup data - netlify the only deploymant page that has to showup only the real data"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Clear Filter State on Source Switch (Priority: P1)

As a user, when I switch between "Lectures" and "Sections" data sources, I want all my previous filter selections (Subject, Group, Day, Search) to be completely reset and cleared from the UI, so that I don't see results or dropdown labels that belong to the previous data source.

**Why this priority**: High priority because it prevents UI confusion and ensures data integrity when switching modes.

**Independent Test**:

1. Select a Subject and Group in "Lectures" mode.
2. Observe the filtered results.
3. Click "Sections" in the data source switcher.
4. **Acceptance**: The dropdowns should all show "All ...", the search box should be empty, and the results should show all data for "Sections".

**Acceptance Scenarios**:

1. **Given** I have filtered results in one view, **When** I switch to the other view, **Then** all dropdown selections MUST return to "all" and the search input MUST be cleared.
2. **Given** I am in any view, **When** I switch views, **Then** the URL query parameters MUST be cleared to reflect the reset state.

---

### User Story 2 - Robust Environment Data Loading (Priority: P1)

As a developer, I want the application to automatically use real data on Netlify and local development (when configured), while strictly using demo "mockup" data on GitHub (CI/Production-like preview), to ensure privacy of real data in public environments while maintaining ease of development.

**Why this priority**: High priority for data security and developer experience.

**Independent Test**:

1. Run the build locally without environment variables; observe demo data.
2. Run the build locally with `REAL_DATA_URL` , `REAL_SECTIONS_URL`set; observe real data.
3. Observe Netlify build logs to confirm real data injection.
4. Observe GitHub Action logs to confirm demo data is used.

**Acceptance Scenarios**:

1. **Given** the environment is Netlify, **When** the build runs, **Then** real data MUST be fetched, OR the build MUST fail if URLs are missing.
2. **Given** the environment is Local, **When** the dev server starts, **Then** real data SHOULD be used if URLs are provided, otherwise fallback to demo data.
3. **Given** the repository is on GitHub (non-Netlify CI), **When** a check or preview build runs, **Then** it MUST ONLY use demo data.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST clear the internal `FilterManager` state on data source switch.
- **FR-002**: System MUST reset the UI labels of all `CustomSelect` instances to their default values (e.g., "All Subjects") on switch.
- **FR-003**: System MUST clear the search input field value on switch.
- **FR-004**: System MUST update the URL query parameters to "empty" on switch.
- **FR-005**: `inject-data.js` MUST explicitly detect GitHub CI environment and force demo data usage.
- **FR-006**: `inject-data.js` MUST allow local override for real data if environment variables are present.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of data source switches result in a clean slate UI (0 leftover selections).
- **SC-002**: Netlify builds FAIL 100% of the time if real data injection is not possible (ensuring no accidental demo deployments).
- **SC-003**: 0% chance of real data being injected in GitHub CI environments (protecting data privacy).
