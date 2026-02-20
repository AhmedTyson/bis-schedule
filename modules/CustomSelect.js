export class CustomSelect {
  #container;
  #trigger;
  #optionsContainer;
  #hiddenSelect;
  #onSelect;
  #id;
  #activeIndex = -1;

  #observer;

  constructor(id, onSelect) {
    this.#container = document.getElementById(id);
    if (!this.#container) {
      console.error(`CustomSelect: Container ${id} not found!`);
      return;
    }

    this.#trigger = this.#container.querySelector(".select-trigger");
    this.#optionsContainer = this.#container.querySelector(".select-options");
    this.#hiddenSelect = this.#container.parentElement.querySelector("select");
    this.#onSelect = onSelect;
    this.#id = id;

    this.#initAccessibility();
    this.#init();
  }

  #initAccessibility() {
    this.#container.setAttribute("role", "combobox");
    this.#container.setAttribute("aria-expanded", "false");
    this.#container.setAttribute("aria-haspopup", "listbox");

    // Critical: Preserve existing ID if present to ensure app.js can find it for population.
    // Only generate a new ID if one isn't already set.
    if (!this.#optionsContainer.id) {
      this.#optionsContainer.id = `${this.#id}-list`;
    }

    this.#container.setAttribute("aria-controls", this.#optionsContainer.id);
    this.#optionsContainer.setAttribute("role", "listbox");

    this.#trigger.setAttribute("tabindex", "0");

    this.#updateOptionAccessibility();

    // Watch for dynamic options
    if (this.#observer) this.#observer.disconnect();
    this.#observer = new MutationObserver(() =>
      this.#updateOptionAccessibility(),
    );
    this.#observer.observe(this.#optionsContainer, { childList: true });
  }

  #updateOptionAccessibility() {
    this.#container.querySelectorAll(".option").forEach((opt, idx) => {
      opt.setAttribute("role", "option");
      if (!opt.id) opt.id = `${this.#id}-opt-${idx}`;
    });
  }

  #boundClickHandler;
  #boundKeydownHandler;
  #boundOptionClickHandler;

  #init() {
    // Toggle Click
    this.#boundClickHandler = (e) => {
      e.stopPropagation();
      this.#toggle();
    };
    this.#trigger.addEventListener("click", this.#boundClickHandler);

    // Keyboard Navigation
    this.#boundKeydownHandler = (e) => {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        if (!this.#isOpen()) this.#toggle(true);
        else if (e.key === "Enter" || e.key === " ") this.#selectActive();
      }

      if (e.key === "Escape") this.#toggle(false);
      if (e.key === "ArrowDown") this.#moveHighlight(1);
      if (e.key === "ArrowUp") this.#moveHighlight(-1);
    };
    this.#trigger.addEventListener("keydown", this.#boundKeydownHandler);

    // Option Selection
    this.#boundOptionClickHandler = (e) => {
      const option = e.target.closest(".option");
      if (option) {
        this.select(option.dataset.value, option.textContent);
      }
    };
    this.#container.addEventListener("click", this.#boundOptionClickHandler);
  }

  #isOpen() {
    return this.#container.classList.contains("active");
  }

  #toggle(force) {
    const shouldOpen = typeof force === "boolean" ? force : !this.#isOpen();

    if (shouldOpen) {
      CustomSelect.closeAll(this.#container);
      this.#container.classList.add("active");
      this.#container.setAttribute("aria-expanded", "true");
      // Recalculate options in case they changed
      const opts = Array.from(this.#container.querySelectorAll(".option"));
      this.#activeIndex = opts.findIndex((o) =>
        o.classList.contains("selected"),
      );
      this.#updateHighlight();
    } else {
      this.#container.classList.remove("active");
      this.#container.setAttribute("aria-expanded", "false");
      this.#activeIndex = -1;
      this.#updateHighlight();
    }
  }

  #moveHighlight(direction) {
    const options = Array.from(this.#container.querySelectorAll(".option"));
    if (!options.length) return;

    this.#activeIndex =
      (this.#activeIndex + direction + options.length) % options.length;
    this.#updateHighlight();

    const activeOpt = options[this.#activeIndex];
    if (activeOpt) {
      activeOpt.scrollIntoView({ block: "nearest" });
      this.#container.setAttribute("aria-activedescendant", activeOpt.id);
    }
  }

  #updateHighlight() {
    this.#container.querySelectorAll(".option").forEach((opt, idx) => {
      opt.classList.toggle("highlighted", idx === this.#activeIndex);
    });
  }

  #selectActive() {
    const options = Array.from(this.#container.querySelectorAll(".option"));
    const activeOpt = options[this.#activeIndex];
    if (activeOpt) {
      this.select(activeOpt.dataset.value, activeOpt.textContent);
    }
  }

  select(value, text) {
    const span = this.#trigger.querySelector("span");
    if (span) span.textContent = text;

    this.#container.querySelectorAll(".option").forEach((opt) => {
      const isSelected = opt.dataset.value === value;
      opt.classList.toggle("selected", isSelected);
      opt.setAttribute("aria-selected", isSelected.toString());
    });
    if (this.#hiddenSelect) this.#hiddenSelect.value = value;
    this.#toggle(false);
    this.#onSelect?.(this.#id, value);
  }

  reset() {
    const defaultOption = this.#container.querySelector(
      '.option[data-value="all"]',
    );
    if (defaultOption) {
      this.select("all", defaultOption.textContent);
    }
  }

  rebind() {
    this.#optionsContainer = this.#container.querySelector(".select-options");
    // Re-observe
    if (this.#observer) this.#observer.disconnect();
    this.#observer = new MutationObserver(() =>
      this.#updateOptionAccessibility(),
    );
    this.#observer.observe(this.#optionsContainer, { childList: true });
    this.#updateOptionAccessibility();
  }

  destroy() {
    if (this.#observer) {
      this.#observer.disconnect();
      this.#observer = null;
    }

    if (this.#trigger) {
      if (this.#boundClickHandler)
        this.#trigger.removeEventListener("click", this.#boundClickHandler);
      if (this.#boundKeydownHandler)
        this.#trigger.removeEventListener("keydown", this.#boundKeydownHandler);
    }

    if (this.#container && this.#boundOptionClickHandler) {
      this.#container.removeEventListener(
        "click",
        this.#boundOptionClickHandler,
      );
    }
  }

  static closeAll(exceptContainer) {
    document.querySelectorAll(".custom-select").forEach((d) => {
      if (d !== exceptContainer) {
        d.classList.remove("active");
        d.setAttribute("aria-expanded", "false");
      }
    });
  }
}
