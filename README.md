# BIS Schedule Search

![Vanilla JS](https://img.shields.io/badge/Vanilla%20JS-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![PWA Ready](https://img.shields.io/badge/PWA-Ready-purple?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Maintained-green?style=for-the-badge)

[🌍 Live Demo](https://your-username.github.io/bis-schedule-search)

A lightning-fast, offline-capable schedule search tool for BIS students. Built with pure Vanilla JS and modern Web APIs to ensure maximum performance on any device.

## 🎯 Overview & Features

This application solves the problem of finding specific class schedules in a massive dataset. It replaces cumbersome PDFs with an instant, searchable interface.

- **⚡ Instant Search:** Powered by **[Fuse.js](https://www.fusejs.io/)** for robust fuzzy search logic and offloaded to a background Web Worker, results appear instantly as you type.
- **🔍 Smart Filters:** Drill down by Subject, Group, Doctor, Day, or Time.
- **📱 Mobile-First Design:** A responsive UI that looks great on phones, with touch-friendly controls.
- **📶 Offline Capable:** A fully functional Progressive Web App (PWA) that works without an internet connection.
- **📋 One-Tap Copy:** Quickly copy course codes to your clipboard.
- **🌙 Dark Mode Native:** Designed with a sleek, dark aesthetic for reduced eye strain.

![App Screenshot](./assets/screenshot.png)
_(Note: Add a screenshot of the app here)_

## 🏗️ Architecture & Tech Stack

**Philosophy: The "No Build Step" Approach**

This project completely eschews complex build tools like Webpack, Vite, or Babel. It relies on standard **ES Modules** natively supported by all modern browsers. This facilitates instant development loops and zero configuration overhead.

### Core Modules

- **`App.js`**: The composition root. Initializes the `DataService`, `UIManager`, and `FilterManager`.
- **`DataService.js`**: Manages data fetching and caching. It spawns a **Web Worker** (`SearchWorker.js`) to handle CPU-intensive search operations off the main thread.
- **`FilterManager.js`**: A pure logic class that maintains the state of active filters (Subject, Group, Day) and applies them to the dataset.
- **`UIManager.js`**: Handles DOM manipulation, rendering the `ScheduleTable` component, and managing event listeners.

## 🚀 Local Development

Since there is no build step, you only need a static file server to run the project locally.

1.  **Clone the repository**

    ```bash
    git clone https://github.com/your-username/bis-schedule-search.git
    cd bis-schedule-search
    ```

2.  **Start a local server**
    You can use any static server. Here are a few options:
    - **Using Python (Pre-installed on most systems):**

      ```bash
      # Python 3
      python -m http.server 8000
      ```

    - **Using Node.js:**

      ```bash
      npx serve .
      ```

    - **Using VS Code:**
      Install the "Live Server" extension and click "Go Live".

3.  **Open in Browser**
    Navigate to `http://localhost:8000` (or whatever port your server provided).

## 📂 Project Structure

```text
/
├── css/
│   ├── base/           # Reset and CSS Variables
│   ├── components/     # Component-specific styles (buttons, table, inputs)
│   └── layout/         # Main container and responsive grid
├── modules/
│   ├── components/     # UI Components (ScheduleTable.js)
│   ├── workers/        # Web Workers (SearchWorker.js)
│   ├── App.js          # Entry Point
│   ├── DataService.js  # Data & Worker Management
│   └── ...             # Other utility modules
├── assets/             # Icons, Memes, Images
├── index.html          # Main application shell
├── sw.js               # Service Worker for PWA support
└── schedule-data.json  # Raw dataset
```

## ⚡ Performance Optimizations

We treat performance as a feature, not an afterthought.

1.  **Off-Main-Thread Architecture**: Search logic is moved to a Web Worker, ensuring the UI thread remains buttery smooth at 60fps, even while filtering thousands of records.
2.  **Layout Containment**: CSS `content-visibility: auto` is applied to table rows to skip rendering off-screen content, significantly reducing initial paint time.
3.  **Debounced Inputs**: Search inputs are debounced to prevent unnecessary calculations during rapid typing.
4.  **Native Modules**: Zero bundle size overhead. The browser loads exactly what it needs, when it needs it.

## 🔮 Future Roadmap

- [ ] **Integration Testing**: Add Cypress/Playwright tests for critical user flows.
- [ ] **PWA Enhancements**: Add a custom install prompt and richer offline fallbacks.
- [ ] **Conflict Detection**: Visual warnings for overlapping class times.
- [ ] **Theme Toggle**: Support for light mode (if requested).
