import { Config } from "./Config.js";

export class Utils {
  // Cache regex patterns for performance
  static #RE_SPECIAL_CHARS = /[()\-–—.,/]/g;
  static #RE_WHITESPACE = /\s+/g;

  // Arabic normalization maps for performant replacement
  static #ARABIC_NORM_MAPS = [
    { pattern: /[أإآء]/g, replacement: "ا" },
    { pattern: /ة/g, replacement: "ه" },
    { pattern: /[ىئ]/g, replacement: "ي" },
    { pattern: /ؤ/g, replacement: "ا" },
  ];

  /**
   * Normalizes text for searching by cleaning titles, Arabic characters, and spacing.
   */
  static normalizeText(text) {
    if (!text) return "";

    let normalized = String(text).toLowerCase().trim();

    // 1. Remove Tashkeel and Tatweel (Inlined for performance/CORB fix)
    // Tashkeel: \u064B-\u065F, Tatweel: \u0640
    normalized = normalized.replace(/[\u064B-\u065F\u0640]/g, "");

    // 3. Sequential Arabic Normalization
    this.#ARABIC_NORM_MAPS.forEach(({ pattern, replacement }) => {
      normalized = normalized.replace(pattern, replacement);
    });

    // 4. Cleanup special chars and whitespace
    return normalized
      .replace(this.#RE_SPECIAL_CHARS, " ")
      .replace(this.#RE_WHITESPACE, " ")
      .trim();
  }

  /**
   * Highlights matching search terms using regex in a single pass to prevent nested markers.
   */
  static highlightText(text, term) {
    if (!term || !text) return text;

    const normalizedTerm = this.normalizeText(term);
    const tokens = normalizedTerm.split(/\s+/).filter((t) => t.length > 0);
    if (!tokens.length) return text;

    // Sort by length descending to match longest phrases first and prevent fragmentation
    const sortedTokens = [...new Set(tokens)].sort(
      (a, b) => b.length - a.length,
    );

    const patterns = sortedTokens.map((token) => {
      const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      let pattern = escaped;

      // Expand Arabic characters to match variants
      if (/[\u0600-\u06FF]/.test(token)) {
        pattern = pattern
          .replace(/ا/g, "[اأإآءؤ]")
          .replace(/ه/g, "[ههة]")
          .replace(/ي/g, "[يىئ]");
      }
      return pattern;
    });

    // Use a single regex with alternation to replace all matches in one pass
    try {
      const regex = new RegExp(`(${patterns.join("|")})`, "gi");
      return String(text).replace(regex, '<span class="highlight">$1</span>');
    } catch (e) {
      console.error("Highlighting error:", e);
      return text;
    }
  }

  /**
   * Helper for display-friendly subject names (MIS vs Management Information Systems)
   */
  static getSubjectDisplay(subject) {
    return Config.SUBJECT_ACRONYMS[subject] || subject;
  }

  /**
   * Standard debounce utility for performance-heavy inputs
   */
  static debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }
  /**
   * Generates a consistent HSL color from a string.
   * @param {string} str - Input string.
   * @param {number} s - Saturation (default 70%).
   * @param {number} l - Lightness (default 60%).
   * @returns {string} HSL color string.
   */
  static stringToHslColor(str, s = 70, l = 60) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360);
    return `hsl(${h}, ${s}%, ${l}%)`;
  }

  /**
   * Clears all application caches and local storage.
   * Useful for debugging or resetting the application state.
   */
  static async clearCache() {
    console.log("Clearing application cache and storage...");

    try {
      // 1. Clear Cache Storage
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(
          keys.map((key) =>
            caches.delete(key).then(() => console.log(`Deleted cache: ${key}`)),
          ),
        );
      }

      // 2. Clear Local & Session Storage
      localStorage.clear();
      sessionStorage.clear();
      console.log("LocalStorage and SessionStorage cleared.");

      // 3. Reload Page
      console.log("Reloading page in 1s...");
      setTimeout(() => window.location.reload(), 1000);
    } catch (e) {
      console.error("Error clearing cache:", e);
    }
  }
}
