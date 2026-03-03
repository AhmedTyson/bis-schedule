# Feature Specification: Fix Netlify Data Duplication

**Feature Branch**: `003-fix-netlify-duplication`  
**Created**: 2026-03-03  
**Status**: Draft  
**Input**: User description: "fix data duplication on Netlify when filtering"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Clean UI State on Filter Change (Priority: P1)

As a student searching for my schedule, I want the filter results to only appear once, so that I don't get confused by duplicated timetable entries.

**Why this priority**: Core functionality is affected; duplicated table rows reduce the usability and trust in the application.

**Independent Test**: Can be tested by visiting the Netlify deployment out in production, selecting a filter such as "subject" (e.g. "Advanced Database"), and verifying that each class code only appears exactly one time in the schedule data table.

**Acceptance Scenarios**:

1. **Given** the app has loaded on Netlify and `window.__DATA_PROMISE__` has fetched the JSON payload, **When** the user selects "Economics of Information" from the subject dropdown, **Then** all rows representing Economics of Information should be displayed only once.
2. **Given** a user is switching views between "Lectures" and "Sections", **When** they switch views, **Then** the new dataset is loaded and displayed exactly once without the previous dataset or duplicated entries.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST prevent data payloads fetched in `index.html` via `window.__DATA_PROMISE__` from being processed multiple times by `DataService.js`.
- **FR-002**: Filter operations MUST trigger exactly one render cycle of the `ScheduleTable.js`.
- **FR-003**: The UI `renderTable` method MUST clear old content synchronously or handle asynchronous clearing precisely so no lingering DOM elements multiply across fast filter changes.

### Key Entities

- **ScheduleItem**: The JSON object holding schedule row data (subject, time, group, doctor, room, code).
- **DataService**: The central module responsible for data fetching, caching, and searching.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Selecting any dropdown filter re-renders the Schedule table with exactly 0 duplicated row IDs (codes).
- **SC-002**: Repeated back-and-forth filtering does not increase the DOM node count of `#table-body` beyond the standard paginated limit.
