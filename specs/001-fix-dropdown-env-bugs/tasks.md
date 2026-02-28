# Tasks: Fix Critical UI and Environment Bugs

**Input**: Design documents from `/specs/001-fix-dropdown-env-bugs/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 [P] Verify local environment variables for testing (REAL_DATA_URL, REAL_SECTIONS_URL)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [x] T002 [P] Review `modules/FilterManager.js` to ensure the `reset()` method is comprehensive
- [x] T003 [P] Review `modules/CustomSelect.js` to ensure the `reset()` method properly updates the trigger text
- [x] T004 [P] Fix race condition in `modules/components/ScheduleTable.js` by cancelling pending animation frames

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Clear Filter State on Source Switch (Priority: P1) 🎯 MVP

**Goal**: Ensure a clean UI slate when switching between Lectures and Sections.

**Independent Test**: Select filters in one mode, switch to another, and verify all filters are reset in UI, state, and URL.

### Implementation for User Story 1

- [x] T004 [P] [US1] Update `app.js` `#initDataSourceSwitcher` to call `this.#filters.reset()`
- [x] T005 [P] [US1] Update `app.js` `#initDataSourceSwitcher` to clear `this.#ui.elements.searchInput.value`
- [x] T006 [P] [US1] Update `app.js` `#initDataSourceSwitcher` to loop through `this.#dropdowns` and call `.reset()`
- [x] T007 [US1] Update `app.js` `#initDataSourceSwitcher` to clear URL query parameters using `history.replaceState`

**Checkpoint**: User Story 1 functional and testable independently.

**Checkpoint**: User Story 1 functional and testable independently.

---

## Phase 4: User Story 2 - Robust Environment Data Loading (Priority: P1)

**Goal**: Secure and flexible data injection for Local, GitHub, and Netlify.

**Independent Test**: Run build in different environments (simulated) and verify correct data source usage and build success/failure.

### Implementation for User Story 2

- [x] T008 [P] [US2] Update `inject-data.js` to detect `GITHUB_ACTIONS` environment
- [x] T009 [US2] Update `inject-data.js` logic to enforce strict requirements on Netlify and protection on GitHub
- [x] T010 [P] [US2] Update `inject-data.js` to allow `REAL_*` overrides for local development

**Checkpoint**: User Story 2 functional and secure.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T011 [P] Verify build logs for clear environment detection messages
- [x] T012 [P] Final UI regression test on all data source transitions

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup.
- **User Stories (Phase 3 & 4)**: Depend on Foundational completion. Can run in parallel.
- **Polish (Final Phase)**: Depends on all stories.

### User Story Dependencies

- **User Story 1 (P1)**: Independent after Foundational.
- **User Story 2 (P1)**: Independent after Foundational.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 & 2.
2. Complete Phase 3 (User Story 1).
3. **STOP and VALIDATE**: Verify UI reset logic.
4. Move to Phase 4 (User Story 2).
