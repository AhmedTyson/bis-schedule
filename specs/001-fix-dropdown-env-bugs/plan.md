# Implementation Plan: Fix Critical UI and Environment Bugs

**Branch**: `001-fix-dropdown-env-bugs` | **Date**: 2026-02-28 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-fix-dropdown-env-bugs/spec.md`

## Summary

This plan addresses three critical issues: 1) UI filter state not clearing when switching data sources, 2) inconsistent environment-based data loading, and 3) **data duplication in the results table** due to overlapping rendering cycles. The technical approach involves modifying `app.js` and `ScheduleTable.js` to synchronize the UI state and rendering process, while updating `inject-data.js` for secure and robust environment-based data injection.

## Technical Context

**Language/Version**: JavaScript (ES6+), Node.js (v22+)  
**Primary Dependencies**: Vanilla JS, pnpm/uv, Netlify CLI  
**Storage**: JSON files (`schedule-data.json`, `sections-data.json`)  
**Testing**: Manual UI verification, environment variable simulation  
**Target Platform**: Web (Chrome/Safari/Firefox), Netlify CI  
**Project Type**: Web Application  
**Performance Goals**: Instant UI reset (<100ms), Build failure on missing CI data  
**Constraints**: Must maintain data privacy in public GitHub logs

## Constitution Check

- **Code Quality**: Ensure modular structure is maintained in `app.js` and `inject-data.js`.
- **Testing Standards**: Verify manual test cases for both UI and environment logic.
- **UX Consistency**: Ensure dropdowns return to "All ..." labels consistently.
- **Performance**: Ensure data injection is fast and fails safely.
- **Spec-First**: This plan follows the approved specification.

## Project Structure

### Documentation (this feature)

```text
specs/001-fix-dropdown-env-bugs/
├── spec.md              # Feature specification
├── plan.md              # This file
└── checklists/
    └── requirements.md  # Quality validation
```

### Source Code (repository root)

```text
app.js                  # Main entry point - needs filter reset logic
inject-data.js          # Build-time script - needs environment logic updates
modules/
├── Config.js           # Configuration constants
├── FilterManager.js    # Logic for filtering - needs reset reinforcement
└── CustomSelect.js     # UI component - needs reset verification
```

## Proposed Changes

### 1. UI Filter Reset & Rendering Sync (app.js & ScheduleTable.js)

- **ScheduleTable.js**:
  - Add `#currentFrame` to track and cancel pending `requestAnimationFrame` calls.
  - Ensure `innerHTML = ""` is called before starting any new rendering sequence.
- **app.js**:
  - Update `#initDataSourceSwitcher` to:
    - Call `this.#filters.reset()` immediately.
    - Explicitly set `this.#ui.elements.searchInput.value = ""`.
    - Iterate through `this.#dropdowns` and call `.reset()` on each.
    - Clear the URL query parameters using `history.replaceState`.

### 2. Environment Data Logic (inject-data.js)

- Implement `IS_GITHUB_ACTIONS` check: `process.env.GITHUB_ACTIONS === "true"`.
- Logic Update:
  - **IF** `IS_NETLIFY`: Require `REAL_DATA_URL` and `REAL_SECTIONS_URL`. FAIL if missing.
  - **ELSE IF** `IS_GITHUB_ACTIONS`: FORCE skip injection and use demo data (protection).
  - **ELSE** (Local): Use `REAL_*` if present, otherwise warn and use demo data.

## Verification Plan

### Manual Verification

1. **Dropdown Test**: Select filters in "Lectures", switch to "Sections". Verify all dropdowns show "All ..." and results refresh to full "Sections" list.
2. **URL Test**: Verify URL query string disappears after switching sources.
3. **Environment Test**:
   - Run build on GitHub Actions (via PR). Verify logs show "Skipping real data for GitHub CI".
   - Run build locally with `.env` or exported variables. Verify "SUCCESS: schedule-data.json injected".
   - Run build locally without variables. Verify "Warning: REAL_DATA_URL is NOT set. Using demo data".
