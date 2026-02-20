import { Utils } from "./Utils.js";
import { Config } from "./Config.js";

export class LiveDashboard {
  #dataService;
  #intervalId = null;
  #container;
  #emptyState;
  #currentIds = null; // Changed to null to ensure first update always triggers check

  constructor(dataService) {
    this.#dataService = dataService;
    this.#container = document.getElementById("live-feed-container");
    this.#emptyState = document.getElementById("live-empty-state");
  }

  start() {
    if (this.#intervalId) return;
    this.#update(); // Immediate run
    this.#intervalId = setInterval(() => this.#update(), 60000); // 60s loop
  }

  stop() {
    if (this.#intervalId) {
      clearInterval(this.#intervalId);
      this.#intervalId = null;
    }
  }

  #update(force = false) {
    const allData = this.#dataService.getAllData();
    const { active, upcoming } = this.#dataService.getActiveClasses();
    const allItems = [...active, ...upcoming];

    // 1. DATA LOAD GUARD:
    // If DataService is empty but we haven't rendered yet (currentIds is null),
    // wait for data.
    if (allData.length === 0 && this.#currentIds === null) {
      return;
    }

    // Create a signature to check if we need full re-render
    const newIds =
      allItems.length > 0 ? allItems.map((i) => i.code).join(",") : "empty";

    if (force || this.#currentIds !== newIds) {
      this.#renderFull(allItems);
      this.#currentIds = newIds;
    } else {
      this.#updateDOM(allItems);
    }

    // Toggle Empty State
    if (allItems.length === 0) {
      this.#container.classList.add("hidden");
      this.#emptyState.classList.remove("hidden");

      // Ramadan Specific Message
      if (Config.RAMADAN_MODE?.ENABLED) {
        this.#emptyState.classList.add("ramadan-active");
        const h3 = this.#emptyState.querySelector("h3");
        const p = this.#emptyState.querySelector("p");
        const icon = this.#emptyState.querySelector("i");
        if (h3) h3.style.fontFamily = "var(--font-ramadan)";
        if (h3) h3.textContent = "Ramadan Mubarak!";
        if (p) p.textContent = "Enjoy your spiritual break! 🌙";
        if (icon) icon.className = "fa-solid fa-moon"; // Removed fa-bounce to let the whole container float
        if (icon) icon.style.color = "#fbbf24";
      } else {
        this.#emptyState.classList.remove("ramadan-active");
      }
    } else {
      this.#container.classList.remove("hidden");
      this.#emptyState.classList.add("hidden");
    }
  }

  #renderFull(items) {
    // Separate items
    const active = items.filter((i) => i.status === "ACTIVE");
    const upcoming = items.filter((i) => i.status !== "ACTIVE");

    let html = "";

    // 1. Live Now Section (Priority, but closed by default as requested)
    if (active.length > 0) {
      html += `
        <details class="time-group-details">
             <summary class="time-group-summary live-priority">
                <span class="summary-text"><i class="fa-solid fa-circle-play fa-fade" style="color: #34d399; font-size: 0.8em; margin-right: 6px;"></i> Live Now</span>
                <span class="summary-count">${active.length} Active</span>
                <i class="fa-solid fa-chevron-down summary-icon"></i>
             </summary>
          <div class="cards-grid">
            ${active.map((item) => this.#createCardHTML(item)).join("")}
          </div>
        </details>
      `;
    }

    // 2. Upcoming Section (Grouped by Time)
    if (upcoming.length > 0) {
      // Group by time
      const groups = {};
      upcoming.forEach((item) => {
        const time = item.startTime;
        if (!groups[time]) groups[time] = [];
        groups[time].push(item);
      });

      const uniqueTimes = [...new Set(upcoming.map((item) => item.startTime))];

      uniqueTimes.forEach((time, index) => {
        const groupItems = groups[time];
        const label = `From ${time}`;

        // Generate consistent color for this time slot
        // Modified for "Comfort to Eyes": Static Purple as requested
        const groupColor = "#c084fc"; /* Soft Purple */

        html += `
           <details class="time-group-details" style="--group-color: ${groupColor}">
             <summary class="time-group-summary">
                <span class="summary-text">${label}</span>
                <span class="summary-count">${groupItems.length} Layouts</span>
                <i class="fa-solid fa-chevron-down summary-icon"></i>
             </summary>
             <div class="cards-grid">
               ${groupItems.map((item) => this.#createCardHTML(item)).join("")}
             </div>
           </details>
         `;
      });
    }

    this.#container.innerHTML = html;
  }

  #createCardHTML(item) {
    const isNow = item.status === "ACTIVE";
    const statusLabel = isNow ? "Live Now" : "Upcoming";

    // Generate dynamic color based on subject
    // We import Utils at top of file, or assume it is available if module structure allows.
    // Since LiveDashboard is dynamically imported in App.js, we need to ensure Utils is imported here.
    const subjectColor = Utils.stringToHslColor(item.subject, 75, 60);

    // Generate progress style only for active cards
    const progressHTML = isNow
      ? `
      <div class="progress-line">
        <div class="progress-fill" style="transform: scaleX(${item.progress / 100}); background: #34d399;"></div>
      </div>
    `
      : "";

    let timeText = "";
    if (isNow) {
      timeText = `${item.timeLeft}m left`;
    } else {
      const hours = Math.floor(item.startsIn / 60);
      const mins = item.startsIn % 60;
      timeText = hours > 0 ? `In ${hours}h ${mins}m` : `In ${mins}m`;
    }

    return `
      <div class="live-card ${isNow ? "active" : ""}" data-code="${item.code}" id="card-${item.code}" style="--subject-color: ${subjectColor}">
        <div class="card-header">
          <span class="status-indicator ${isNow ? "pulse" : ""}" style="background: ${isNow ? "#34d399" : "var(--subject-color)"}"></span>
          <span class="status-text">${statusLabel}</span>
          <span class="time-readout">${item.startTime}</span>
        </div>

        <div class="card-body">
        <h3 class="card-subject">${Utils.getSubjectDisplay(item.subject)}</h3>
          
          <div class="meta-list">
            <div class="meta-row">
              <span class="meta-label">Doctor</span>
              <span class="meta-val">${item.doctorEn || item.doctorAr}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Location</span>
              <span class="meta-val">${item.room || "N/A"}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Group</span>
              <span class="meta-val">${item.group}</span>
            </div>
          </div>
        </div>
        
        <div class="card-footer">
          <div class="footer-info">
            <span class="time-remaining">${timeText}</span>
          </div>
        </div>
        ${progressHTML}
      </div>
    `;
  }

  #updateDOM(items) {
    items.forEach((item) => {
      const card = document.getElementById(`card-${item.code}`);
      if (!card) return;

      // Updated Data
      // Re-calculate progress manually or trust data?
      // DataService returns fresh data every call.

      // 1. Update Progress Bar
      const bar = card.querySelector(".progress-fill");
      if (bar) {
        bar.style.transform = `scaleX(${item.progress / 100})`;
      }

      // 2. Update Text
      const textSpan = card.querySelector(".time-remaining");
      if (textSpan) {
        let newText = "";
        if (item.status === "ACTIVE") {
          newText = `${item.timeLeft}m left`;
        } else {
          const hours = Math.floor(item.startsIn / 60);
          const mins = item.startsIn % 60;
          newText = hours > 0 ? `In ${hours}h ${mins}m` : `In ${mins}m`;
        }

        if (textSpan.textContent !== newText) {
          textSpan.textContent = newText;
        }
      }
    });
  }
}
