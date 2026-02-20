import { Config } from "./modules/Config.js";

import { Utils } from "./modules/Utils.js";
import { TimeUtils } from "./modules/utils/TimeUtils.js";
import { CustomSelect } from "./modules/CustomSelect.js";
import { DataService } from "./modules/DataService.js";
import { UIManager } from "./modules/UIManager.js";
import { FilterManager } from "./modules/FilterManager.js";
import { DOMUtils } from "./modules/DOMUtils.js";

class App {
  #state = {
    currentPage: 1,
    filteredData: [],
  };
  #filters = new FilterManager();
  #dataService = new DataService();
  #ui = new UIManager();

  #dropdowns = {};

  constructor() {
    Config.init();
    // Expose cache cleaner globally for manual admin use
    window.clearAppCache = Utils.clearCache;
  }

  async init() {
    this.#initGlobalListeners();
    this.#ui.initViewSwitcher((view) => this.#handleViewChange(view));

    // Show Ramadan Indicator if enabled
    if (Config.RAMADAN_MODE?.ENABLED) {
      document.getElementById("ramadan-indicator")?.classList.remove("hidden");
    }

    // Academic Status Integration
    const status = TimeUtils.getAcademicStatus();
    if (status) {
      const indicator = document.getElementById("academic-indicator");
      const text = document.getElementById("academic-text");
      if (indicator && text) {
        text.textContent = `W${status.week} • ${status.location}${status.event ? ` (${status.event})` : ""}`;
        indicator.classList.remove("hidden");
      }
    }

    // Handle Initial Hash
    if (window.location.hash === "#live") {
      this.#ui.switchView("live");
      this.#handleViewChange("live");
    }

    // Handle Back/Forward Navigation
    window.addEventListener("hashchange", () => {
      const view = window.location.hash === "#live" ? "live" : "schedule";
      this.#ui.switchView(view);
      this.#handleViewChange(view);
    });

    try {
      this.#ui.setLoading(true);
      const data = await this.#dataService.fetchData();
      this.#state.filteredData = data;

      // Update Live Dashboard immediately if it's active
      if (window.location.hash === "#live") {
        this.liveDashboard?.start();
      }

      this.#initFilters(data);
      this.handleFilterChange();

      // Self-Healing: Check if dropdowns are empty after a short delay and retry
      setTimeout(() => {
        const subjectOptions = document.getElementById("subject-options");
        if (subjectOptions && subjectOptions.children.length <= 1) {
          console.warn("Dropdowns appear empty, retrying population...");
          this.#initFilters(data);
        }
      }, 500);
    } catch (error) {
      this.#ui.elements.noResults.innerHTML = `<div class="error-message">Error loading data: ${error.message}</div>`;
      this.#ui.elements.noResults.classList.remove("hidden");
    } finally {
      this.#ui.setLoading(false);
    }
  }

  #initGlobalListeners() {
    window.addEventListener("click", () => CustomSelect.closeAll());

    // Search Input with Debounce
    this.#ui.elements.searchInput.addEventListener(
      "input",
      Utils.debounce((e) => {
        this.#filters.update("search", e.target.value);
        this.handleFilterChange();
      }, 300),
    );

    // Clear Button
    this.#ui.elements.clearFilters.onclick = () => {
      this.#ui.elements.searchInput.value = "";
      this.#ui.elements.searchInput.dispatchEvent(new Event("input")); // Trigger debounce
      this.#filters.reset();
      Object.values(this.#dropdowns).forEach((d) => d.reset());
      this.handleFilterChange();
    };
  }

  #initFilters(data) {
    // Initialize Dropdowns using generic handler
    ["subject", "group", "day"].forEach((key) => {
      const id = `${key}-dropdown`;
      if (this.#dropdowns[id]) this.#dropdowns[id].destroy();

      this.#dropdowns[id] = new CustomSelect(id, (dropdownId, value) => {
        const filterKey = dropdownId.split("-")[0];
        this.#filters.update(filterKey, value);

        // Special case: Subject change affects Group options
        if (filterKey === "subject") {
          this.#populateGroupFilters(
            this.#dataService
              .getAllData()
              .filter((item) => value === "all" || item.subject === value),
          );
          this.#filters.update("group", "all");
          this.#dropdowns["group-dropdown"].reset();
        }

        this.handleFilterChange();
      });
    });

    this.#populateSubjectFilters(data);
    this.#populateGroupFilters(data);
  }

  #populateSubjectFilters(data) {
    const subjects = [
      ...new Set(data.map((item) => item.subject).filter(Boolean)),
    ].sort();
    if (!subjects.length) {
      console.warn("App: No subjects found!");
      return;
    }

    this.#ui.elements.subjectListContainer?.classList.remove("hidden");

    // 1. Populate Dropdown Options
    const options = document.getElementById("subject-options");
    if (options) {
      DOMUtils.populateContainer(options, subjects, (subject) =>
        DOMUtils.createOption(subject),
      );
      options.insertAdjacentElement(
        "afterbegin",
        DOMUtils.createOption("all", "All Subjects", true),
      );
    }

    // 2. Populate Native Select (Hidden)
    const hiddenSelect = document.getElementById("subject-filter");
    if (hiddenSelect) {
      // Native selects need option elements, not divs
      hiddenSelect.innerHTML = '<option value="all">All Subjects</option>';
      subjects.forEach((subject) =>
        hiddenSelect.add(new Option(subject, subject)),
      );
    }

    // 3. Populate Tags
    if (this.#ui.elements.subjectTags) {
      DOMUtils.populateContainer(
        this.#ui.elements.subjectTags,
        subjects,
        (subject) =>
          DOMUtils.createElement("span", {
            className: "subject-tag",
            text: subject,
            events: {
              click: () =>
                this.#dropdowns["subject-dropdown"].select(subject, subject),
            },
          }),
      );
    }
  }

  #populateGroupFilters(data) {
    // Use natural sort for groups (Group 2 < Group 10)
    const groups = [
      ...new Set(data.map((item) => item.group).filter(Boolean)),
    ].sort((a, b) => {
      return a.localeCompare(b, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

    const options = document.getElementById("group-options");
    if (options) {
      DOMUtils.populateContainer(options, groups, (group) =>
        DOMUtils.createOption(group),
      );
      options.insertAdjacentElement(
        "afterbegin",
        DOMUtils.createOption("all", "All Groups", true),
      );
    }

    const hiddenSelect = document.getElementById("group-filter");
    if (hiddenSelect) {
      hiddenSelect.innerHTML = '<option value="all">All Groups</option>';
      groups.forEach((group) => hiddenSelect.add(new Option(group, group)));
    }
  }

  // ...

  async handleFilterChange() {
    const currentScroll = window.scrollY;

    // Schedule View Logic (Only view remaining in this app)
    const searchQuery = this.#filters.filters.search;

    // 1. Get Search Results (Async Worker)
    let searchResults;
    if (searchQuery && searchQuery.length >= 2) {
      // Create a loading state for table if needed, strictly speaking we are debounced
      // but for slow devices a spinner might be nice.
      searchResults = await this.#dataService.search(searchQuery);
    } else {
      searchResults = this.#dataService.getAllData();
    }

    // 2. Apply Structure Filters (Sync)
    this.#state.filteredData = this.#filters.applyFilters(searchResults);

    this.#state.currentPage = 1;
    this.#updateTagHighlights();
    this.render();
    this.#ui.scrollToResults(currentScroll);
  }

  #updateTagHighlights() {
    const currentSubject = this.#filters.filters.subject;
    this.#ui.elements.subjectTags
      .querySelectorAll(".subject-tag")
      .forEach((tag) => {
        tag.classList.toggle("active", tag.textContent === currentSubject);
      });
  }

  render() {
    const { filteredData, currentPage } = this.#state;
    const filters = this.#filters.filters;

    if (filteredData.length === 0) {
      this.#ui.renderTable([], currentPage, filters.search);

      if (filters.search?.length >= 2) {
        this.#dataService.getSuggestions(filters.search).then((suggestions) => {
          this.#ui.renderNoResults(
            filters.day === "Friday",
            suggestions,
            (selected) => {
              this.#ui.elements.searchInput.value = selected;
              this.#filters.update("search", selected);
              this.handleFilterChange();
            },
          );
        });
      } else {
        this.#ui.renderNoResults(filters.day === "Friday", [], null);
      }
    } else {
      this.#ui.renderTable(filteredData, currentPage, filters.search);
      this.#ui.renderPagination(filteredData.length, currentPage, (page) => {
        this.#state.currentPage = page;
        this.render();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  }

  #handleViewChange(view) {
    if (view === "live") {
      if (!this.liveDashboard) {
        // Lazy load or access if already imported
        // For now, prompt phase 4 to implement
        import("./modules/LiveDashboard.js").then((module) => {
          if (!this.liveDashboard) {
            this.liveDashboard = new module.LiveDashboard(this.#dataService);
          }
          this.liveDashboard.start();
        });
      } else {
        this.liveDashboard.start();
      }
    } else {
      this.liveDashboard?.stop();
    }
  }
}

// Start App
document.addEventListener("DOMContentLoaded", () => {
  new App().init();
});
