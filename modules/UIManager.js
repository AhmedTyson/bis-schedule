import { Config } from "./Config.js";
import { Utils } from "./Utils.js";
import { Icons } from "./Icons.js";
import { ScheduleTable } from "./components/ScheduleTable.js";

export class UIManager {
  #elements = {};
  #paginationCallback = null;
  #currentPage = 1;
  #scheduleTable;

  constructor() {
    this.#initElements();
    this.#initGlobalListeners();
    this.#scheduleTable = new ScheduleTable();
  }

  #initElements() {
    const ids = [
      "table-body",
      "search-input",
      "result-count",
      "no-results",
      "page-numbers",
      "prev-page",
      "next-page",
      "loader",
      "subject-list-container",
      "subject-tags",
      "clear-filters",
      "meme-container",
      "no-results-text",
      "pagination",
      "fab-scroll-top",
    ];
    ids.forEach((id) => {
      const camelKey = id.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      this.#elements[camelKey] = document.getElementById(id);
    });

    // Manual mapping for special cases/shorthand
    this.#elements.paginationNumbers = this.#elements.pageNumbers;
    this.#elements.prevBtn = this.#elements.prevPage; // Shorthand for usage elsewhere
    this.#elements.nextBtn = this.#elements.nextPage; // Shorthand for usage elsewhere
  }

  #initGlobalListeners() {
    // Event Delegation for Copy Buttons
    this.#elements.tableBody?.addEventListener("click", async (e) => {
      const btn = e.target.closest(".copy-btn");
      if (!btn) return;

      const { code } = btn.dataset;
      try {
        await navigator.clipboard.writeText(code);
        this.#handleCopySuccess(btn);
      } catch (err) {
        console.error("Copy failed:", err);
      }
    });

    // FAB Scroll Top
    this.#elements.fabScrollTop?.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // Throttled Scroll Listener for FAB
    let isScrolling = false;
    window.addEventListener(
      "scroll",
      () => {
        if (!isScrolling) {
          window.requestAnimationFrame(() => {
            if (this.#elements.fabScrollTop) {
              this.#elements.fabScrollTop.classList.toggle(
                "visible",
                window.scrollY > 400,
              );
            }
            isScrolling = false;
          });
          isScrolling = true;
        }
      },
      { passive: true },
    );
  }

  #handleCopySuccess(btn) {
    const iconContainer = btn.querySelector(".icon-wrapper");
    const originalIcon = iconContainer.innerHTML;

    iconContainer.innerHTML = Icons.check;
    btn.classList.add("copied");

    setTimeout(() => {
      iconContainer.innerHTML = originalIcon;
      btn.classList.remove("copied");
    }, 2000);
  }

  get elements() {
    return this.#elements;
  }

  /**
   * Smoothly scrolls to the top of the results table.
   * @param {number} capturedScroll - The scroll position before updates.
   */
  scrollToResults(capturedScroll) {
    // Use the scroll value captured BEFORE DOM changes to avoid forced reflow
    if (capturedScroll < 300) return;

    requestAnimationFrame(() => {
      const thead = document.querySelector("thead");
      if (thead) {
        thead.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  /**
   * Renders the schedule table with data for the current page.
   * @param {Array} data - The dataset to render.
   * @param {number} currentPage - The current page number.
   * @param {string} searchTerm - The current search term for highlighting.
   */
  renderTable(data, currentPage, searchTerm) {
    const start = (currentPage - 1) * Config.ROWS_PER_PAGE;
    const pageData = data.slice(start, start + Config.ROWS_PER_PAGE);

    if (!pageData.length) {
      if (this.#elements.tableBody) this.#elements.tableBody.innerHTML = "";
      // Table clearing is handled by component, but we also handle empty state outside
      return;
    }

    this.#elements.noResults?.classList.add("hidden");
    if (this.#elements.memeContainer)
      this.#elements.memeContainer.innerHTML = "";
    if (this.#elements.resultCount)
      this.#elements.resultCount.textContent = data.length;

    this.#scheduleTable.render(pageData, searchTerm);
  }

  /**
   * Displays the "No Results" state, with special handling for Fridays.
   * @param {boolean} isFriday - Whether the selected day is Friday.
   * @param {Array} suggestions - Search suggestions if available.
   * @param {Function} onSelect - Callback when a suggestion is clicked.
   */
  renderNoResults(isFriday, suggestions = [], onSelect = null) {
    const el = this.#elements;
    el.noResults?.classList.remove("hidden");
    el.pagination?.classList.add("hidden");
    if (el.resultCount) el.resultCount.textContent = "0";
    if (el.paginationNumbers) el.paginationNumbers.innerHTML = "";
    if (el.prevBtn) el.prevBtn.disabled = true;
    if (el.nextBtn) el.nextBtn.disabled = true;

    if (isFriday) {
      this.#renderFridayState();
    } else {
      this.#renderEmptyState(suggestions, onSelect);
    }
  }

  #renderFridayState() {
    if (!this.#elements.memeContainer) return;
    const randomMeme = Math.floor(Math.random() * Config.FRIDAY_MEME_COUNT) + 1;
    this.#elements.memeContainer.innerHTML = `<img src="assets/meme-friday-${randomMeme}.webp" alt="Friday Meme" class="meme-img" width="400" height="300">`;
    if (this.#elements.noResultsText)
      this.#elements.noResultsText.textContent =
        "Enjoy your Friday! No schedules, just vibes. 😎";
  }

  #renderEmptyState(suggestions, onSelect) {
    if (!this.#elements.noResultsText) return;
    this.#elements.noResultsText.innerHTML = `
            <div class="empty-state-container">
                <div class="empty-state-icon">${Icons.ghost}</div>
                <h3>No matching schedules found</h3>
                <p>We couldn't find any sessions for your current filters.<br>Try adjusting your search or clearing filters.</p>
                <div class="suggestion" onclick="document.querySelector('.clear-btn-styled').click()">Clear all filters</div>
            </div>
        `;

    if (suggestions?.length && onSelect) {
      this.#renderSuggestions(suggestions, onSelect);
    }
  }

  #renderSuggestions(suggestions, onSelect) {
    if (!this.#elements.memeContainer) return;
    const container = document.createElement("div");
    container.className = "did-you-mean-container";
    container.innerHTML = "Did you mean: ";

    suggestions.slice(0, 3).forEach((item, index, arr) => {
      const link = document.createElement("span");
      link.className = "did-you-mean-link";
      link.textContent = item.display;
      link.onclick = () => onSelect(item.text);
      container.appendChild(link);
      if (index < arr.length - 1)
        container.appendChild(document.createTextNode(", "));
    });

    this.#elements.memeContainer.appendChild(container);
  }

  /**
   * Renders pagination controls.
   * @param {number} totalItems - Total number of items in the filtered set.
   * @param {number} currentPage - Current page number.
   * @param {Function} onPageChange - Callback for page changes.
   */
  renderPagination(totalItems, currentPage, onPageChange) {
    // Store callback and state
    this.#paginationCallback = onPageChange;
    this.#currentPage = currentPage; // Sync internal state

    const el = this.#elements;
    if (el.pagination) {
      el.pagination.dataset.currentPage = currentPage;
    }

    const maxPage = Math.ceil(totalItems / Config.ROWS_PER_PAGE);

    if (el.paginationNumbers) el.paginationNumbers.innerHTML = "";
    el.pagination?.classList.toggle("hidden", maxPage <= 1);

    if (maxPage <= 1) return;

    if (el.prevBtn) {
      el.prevBtn.disabled = currentPage === 1;
      // Direct binding - Simple and robust
      el.prevBtn.onclick = () => {
        if (currentPage > 1) onPageChange(currentPage - 1);
      };
    }

    if (el.nextBtn) {
      // Ensure strict comparison and type safety
      el.nextBtn.disabled = currentPage >= maxPage;
      // Direct binding - Simple and robust
      el.nextBtn.onclick = () => {
        if (currentPage < maxPage) onPageChange(currentPage + 1);
      };
    }

    const fragment = document.createDocumentFragment();
    for (let i = 1; i <= maxPage; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      btn.className = `page-btn ${i === currentPage ? "active" : ""}`;
      // Direct binding for numbers
      btn.onclick = () => {
        if (i !== currentPage) onPageChange(i);
      };
      fragment.appendChild(btn);
    }
    el.paginationNumbers?.appendChild(fragment);
  }

  /**
   * Toggles the loading state (skeletons or fade out).
   * @param {boolean} isLoading - True to show loaders, false to hide.
   */
  setLoading(isLoading) {
    if (isLoading) {
      this.#renderSkeletons();
    } else {
      // Hide full page loader if it exists
      if (
        this.#elements.loader &&
        !this.#elements.loader.classList.contains("fade-out")
      ) {
        this.#elements.loader.classList.add("fade-out");
        setTimeout(() => {
          this.#elements.loader.classList.add("hidden");
        }, 500); // Match CSS transition duration
      }
    }
  }

  #renderSkeletons() {
    this.#elements.tableBody.innerHTML = Array(5)
      .fill(
        `
            <tr class="skeleton-row">
                <td><div class="skeleton-box subject"></div></td>
                <td><div class="skeleton-box time"></div></td>
                <td><div class="skeleton-box doctor"></div></td>
                <td><div class="skeleton-box group"></div></td>
                <td><div class="skeleton-box"></div></td>
            </tr>
        `,
      )
      .join("");
  }

  /**
   * Initializes the view switcher logic.
   * @param {Function} onSwitch - Callback when view changes (optional).
   */
  initViewSwitcher(onSwitch) {
    const switcher = document.getElementById("view-switcher");
    if (!switcher) return;

    const buttons = switcher.querySelectorAll(".toggle-btn");

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const view = btn.dataset.view;
        this.switchView(view);
        if (onSwitch) onSwitch(view);
      });
    });
  }

  /**
   * Switches between 'schedule' and 'live' views.
   * @param {string} viewName - 'schedule' or 'live'.
   */
  switchView(viewName) {
    const scheduleView = document.getElementById("schedule-view");
    const liveView = document.getElementById("live-dashboard-view");
    const controls = document.querySelector(".controls"); // Contains filters/search
    const stats = document.querySelector(".stats"); // Result count

    const buttons = document.querySelectorAll(".toggle-btn");

    // Update Buttons
    buttons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === viewName);
    });

    // Update Switcher State for CSS Animation
    const switcher = document.getElementById("view-switcher");
    if (switcher) {
      switcher.className = "view-switcher"; // Reset base class
      switcher.classList.add(
        viewName === "live" ? "active-live" : "active-schedule",
      );
    }

    // Update Visibility
    if (viewName === "live") {
      scheduleView?.classList.add("hidden");
      controls?.classList.add("hidden");
      stats?.classList.add("hidden");
      liveView?.classList.remove("hidden");
      window.location.hash = "live";
    } else {
      scheduleView?.classList.remove("hidden");
      controls?.classList.remove("hidden");
      stats?.classList.remove("hidden");
      liveView?.classList.add("hidden");
      window.location.hash = ""; // or 'schedule'

      // Allow searching again if needed
      // this.elements.searchInput.focus();
    }
  }
}
