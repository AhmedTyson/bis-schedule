# AI Refactoring Context

## 1. Project Overview
* **Domain:** University Schedule Viewer (Business Information Systems - Level 3).
* **Primary Goal:** Provide a fast, mobile-friendly interface for students to search class schedules, filter by subject/doctor/group, and find available rooms.
* **Current State:** Recently refactored into a modular, clean ES6 codebase (Post-Phase 3 Refactoring).

## 2. Tech Stack & Versioning (CRITICAL)
* **Language:** Vanilla JavaScript (ES2022+ features like private class fields `#private`).
* **Framework:** No Framework (Custom component-based architecture).
* **State Management:** Custom observable pattern via `FilterManager.js` and `Router.js`.
* **Database/ORM:** Static JSON (`schedule-data.json`) fetched via `fetch` API.
*   **Search Engine:** Fuse.js (v7.0.0) for client-side fuzzy search.
* **Styling:** Vanilla CSS3 with CSS Variables (Custom properties), Flexbox, and Grid.
* **Testing:** Manual Verification / Syntax Checks (`node -c`).

## 3. Architecture & File Structure
* **Architectural Pattern:** Modular Monolith / Component-Service Pattern.
* **Key Directories:**
    * `/modules` - Core logic (`App.js`, `DataService.js`, `Router.js`, `EventBus.js`).
    * `/modules/components` - UI Components (`ScheduleTable.js`, `RoomGrid.js`).
    * `/css` - Modular CSS (`base`, `components`, `layout`).
    * `/assets` - Static assets (images, icons).
* **Data Flow:** `App` initializes -> `DataService` fetches JSON -> `FilterManager` processes filters -> `Router` handles view state -> `UIManager` delegates rendering to Components.

## 4. Coding Standards & Conventions
* **Naming:** PascalCase for Classes (`UIManager`), camelCase for methods/variables (`initFilters`), UPPER_SNAKE_CASE for constants (`Constants.js`).
* **Typing:** Dynamic (JSDoc recommended for documenting complex logic).
*   **Modularity:** ES Modules (`import/export`) are mandatory.
* **Error Handling:** Centralized `try/catch` in async operations (`App.init`, `DataService.fetchData`).
* **Preferences:**
    *   Use private class fields (`#state`) for encapsulation.
    *   Avoid global scope pollution.
    *   Prefer event delegation for list items (`UIManager` handles clicks).

## 5. The "Do Not Touch" List (Constraints)
* **No Build Step:** The project must run directly in modern browsers without compilation/transpilation (Webpack/Vite is optional/not currently used). Do not introduce build dependencies.
* **Performance:** Must be lightweight and fast on mobile devices.
* **External Dependencies:** Only `Fuse.js` is permitted (loaded as a module or script). Avoid adding heavy libraries.

## 6. Known Issues / Refactoring Targets
*   **Completed:** Phase 1-3 Refactoring (DRY, Router, Components) is finished.
*   **Future Targets:**
    *   Integration Testing / E2E Testing.
    *   Enhanced Accessibility (ARIA improvements).
    *   PWA enhancements (Offline support is basic).
    *   Dynamic Data Source (currently static JSON).