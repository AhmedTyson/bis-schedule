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
    this.#initDataSourceSwitcher();

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

    // Handle Initial Hash for view switching
    if (window.location.hash === "#live") {
      this.#ui.switchView("live");
      this.#handleViewChange("live");
    }

    // Handle Back/Forward Navigation (both view hash and filter state)
    window.addEventListener("popstate", () => {
      const view = window.location.hash === "#live" ? "live" : "schedule";
      this.#ui.switchView(view);
      this.#handleViewChange(view);
      this.#restoreFiltersFromURL();
    });

    try {
      this.#ui.setLoading(true);
      const data = await this.#dataService.fetchData();
      this.#state.filteredData = data;

      // Update Live Dashboard immediately if it's active
      if (window.location.hash === "#live") {
        this.liveDashboard?.refresh(true);
      }

      this.#initFilters(data);
      this.#restoreFiltersFromURL();

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
        this.#syncURLFromFilters();
      }, 150),
    );

    // Clear Button
    this.#ui.elements.clearFilters.onclick = () => {
      this.#ui.elements.searchInput.value = "";
      this.#filters.reset();
      Object.values(this.#dropdowns).forEach((d) => d.reset());
      this.handleFilterChange();
      this.#syncURLFromFilters();
    };

    // Keyboard Shortcuts
    window.addEventListener("keydown", (e) => {
      // Focus search on Ctrl+K / Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        this.#ui.elements.searchInput.focus();
        this.#ui.elements.searchInput.select();
      }
      // Clear filters on Escape
      if (e.key === "Escape") {
        this.#ui.elements.clearFilters.click();
      }
      // Switch to Live view on Alt+L
      if (e.altKey && e.key === "l") {
        e.preventDefault();
        const currentView =
          window.location.hash === "#live" ? "schedule" : "live";
        this.#ui.switchView(currentView);
        this.#handleViewChange(currentView);
      }
    });
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
        this.#syncURLFromFilters();
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
      hiddenSelect.innerHTML = '<option value="all">All Subjects</option>';
      subjects.forEach((subject) =>
        hiddenSelect.add(new Option(subject, subject)),
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

  /**
   * Reads URL search params and restores filter + search state.
   * Called on initial load and on popstate (back/forward).
   */
  #restoreFiltersFromURL() {
    const params = new URLSearchParams(window.location.search);

    const subject = params.get("subject") || "all";
    const group = params.get("group") || "all";
    const day = params.get("day") || "all";
    const search = params.get("q") || "";

    // Update FilterManager state
    this.#filters.update("subject", subject);
    this.#filters.update("group", group);
    this.#filters.update("day", day);
    this.#filters.update("search", search);

    // Sync UI: search input
    this.#ui.elements.searchInput.value = search;

    // Sync UI: dropdowns
    if (subject !== "all" && this.#dropdowns["subject-dropdown"]) {
      this.#dropdowns["subject-dropdown"].select(subject, subject);
    }
    if (group !== "all" && this.#dropdowns["group-dropdown"]) {
      this.#dropdowns["group-dropdown"].select(group, group);
    }
    if (day !== "all" && this.#dropdowns["day-dropdown"]) {
      this.#dropdowns["day-dropdown"].select(day, day);
    }

    this.handleFilterChange();
  }

  /**
   * Writes current filter state to URL search params.
   * Uses replaceState to avoid polluting history on every keystroke.
   */
  #syncURLFromFilters() {
    const filters = this.#filters.filters;
    const params = new URLSearchParams();

    if (filters.subject !== "all") params.set("subject", filters.subject);
    if (filters.group !== "all") params.set("group", filters.group);
    if (filters.day !== "all") params.set("day", filters.day);
    if (filters.search) params.set("q", filters.search);

    const qs = params.toString();
    const newUrl = qs
      ? `${window.location.pathname}?${qs}${window.location.hash}`
      : `${window.location.pathname}${window.location.hash}`;

    history.replaceState(null, "", newUrl);
  }

  async handleFilterChange() {
    const currentScroll = window.scrollY;

    // Schedule View Logic
    const searchQuery = this.#filters.filters.search;

    // 1. Get Search Results (Async Worker)
    let searchResults;
    if (searchQuery && searchQuery.length >= 2) {
      searchResults = await this.#dataService.search(searchQuery);
    } else {
      searchResults = this.#dataService.getAllData();
    }

    // 2. Apply Structure Filters (Sync)
    this.#state.filteredData = this.#filters.applyFilters(searchResults);

    this.#state.currentPage = 1;
    this.render();
    this.#ui.scrollToResults(currentScroll);
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

  #initDataSourceSwitcher() {
    const container = document.getElementById("data-source-switcher");
    if (!container) return;

    const buttons = container.querySelectorAll(".source-pill");
    buttons.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const source = btn.dataset.source;
        if (btn.classList.contains("active")) return;

        // Update active state
        buttons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        // Switch data source
        const url =
          source === "sections" ? Config.SECTIONS_DATA_URL : Config.DATA_URL;

        try {
          this.#ui.setLoading(true);

          // Capture current filters before switch
          const currentFilters = { ...this.#filters.filters };

          const data = await this.#dataService.switchDataSource(url);
          this.#state.filteredData = data;

          // Re-init filters with new data but try to preserve values
          this.#initFilters(data);

          // Restore filters if they still make sense for the new data
          // (initFilters already handles most of this by populating dropdowns)
          // We just need to trigger a fresh application of filters
          this.handleFilterChange();

          // Refresh Live Dashboard if it's active
          this.liveDashboard?.refresh(true);
        } catch (error) {
          console.error("Failed to switch data source:", error);
          this.#ui.elements.noResults.innerHTML = `<div class="error-message">Failed to switch data source: ${error.message}</div>`;
          this.#ui.elements.noResults.classList.remove("hidden");
        } finally {
          this.#ui.setLoading(false);
        }
      });
    });
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
