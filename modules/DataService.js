import { Config } from "./Config.js";
import { TimeUtils } from "./utils/TimeUtils.js";
import { ScheduleProcessor } from "./utils/ScheduleProcessor.js";

export class DataService {
  #data = [];
  #worker = null;
  #pendingRequests = new Map();
  #requestIdCounter = 0;

  constructor() {
    this.#worker = new Worker("modules/workers/SearchWorker.js?v=2", {
      type: "module",
    });
    this.#worker.onmessage = this.#handleWorkerMessage.bind(this);
  }

  /**
   * Returns the full dataset currently loaded in memory.
   * @returns {Array} The complete data array.
   */
  getAllData() {
    return this.#data;
  }

  /**
   * Fetches data from the configured URL and initializes the search worker.
   * @returns {Promise<Array>} The fetched data.
   */
  async fetchData() {
    try {
      // Aggressive Cache Busting: Append unique timestamp to URL
      const bustCache = `?t=${new Date().getTime()}`;
      const response = await fetch(Config.DATA_URL + bustCache, {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      this.#data = await response.json();

      // Apply Ramadan Mode mapping if enabled
      if (Config.RAMADAN_MODE?.ENABLED) {
        this.#data = this.#data.map((item) => {
          if (Config.RAMADAN_MODE.TIME_MAP[item.time]) {
            return {
              ...item,
              originalTime: item.time, // Preserve for reference if needed
              time: Config.RAMADAN_MODE.TIME_MAP[item.time],
            };
          }
          return item;
        });
      }

      // Initialize Worker
      await this.#sendToWorker("INIT", { data: this.#data });

      return this.#data;
    } catch (error) {
      console.error("DataService Error:", error);
      throw error;
    }
  }

  /**
   * Searches the dataset using the Web Worker.
   * @param {string} query - The search query.
   * @returns {Promise<Array>} The search results.
   */
  async search(query) {
    if (!query || query.length < 2) return this.#data;
    return this.#sendToWorker("SEARCH", { query });
  }

  /**
   * Gets search suggestions based on the query.
   * @param {string} query - The search query.
   * @returns {Promise<Array>} Array of suggestion objects.
   */
  async getSuggestions(query) {
    if (!query || query.length < 2) return [];
    return this.#sendToWorker("SUGGEST", { query });
  }

  /**
   * Retrieves unique values for a specific key, sorted appropriately.
   * @param {string} key - The data key to extract (e.g., 'subject', 'day').
   * @returns {Array} Sorted array of unique values.
   */
  getUniqueValues(key) {
    const values = [
      ...new Set(this.#data.map((item) => item[key]).filter(Boolean)),
    ];

    if (key === "day") {
      const dayOrder = {
        Saturday: 1,
        Sunday: 2,
        Monday: 3,
        Tuesday: 4,
        Wednesday: 5,
        Thursday: 6,
        Friday: 7,
      };
      return values.sort((a, b) => (dayOrder[a] || 99) - (dayOrder[b] || 99));
    }

    if (key === "time") {
      return values.sort((a, b) => {
        const parseTime = (t) => {
          const [time, modifier] = t.split(" ");
          let [hours, minutes] = time.split(":").map(Number);
          if (hours === 12) hours = 0;
          if (modifier === "PM") hours += 12;
          return hours * 60 + minutes;
        };
        return parseTime(a) - parseTime(b);
      });
    }

    return values.sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
    );
  }

  /**
   * Retrieves classes that are currently active or starting within the next 15 minutes.
   * @returns {Array} Array of enriched class objects with status and progress.
   */
  getActiveClasses() {
    return ScheduleProcessor.getActiveClasses(this.#data);
  }

  // --- Worker Communication ---

  #sendToWorker(type, payload) {
    return new Promise((resolve, reject) => {
      const id = this.#requestIdCounter++;
      this.#pendingRequests.set(id, { resolve, reject });
      this.#worker.postMessage({ type, payload, id });
    });
  }

  #handleWorkerMessage(e) {
    const { type, payload, id } = e.data;

    if (type === "READY") {
      const req = this.#pendingRequests.get(id);
      if (req) {
        req.resolve();
        this.#pendingRequests.delete(id);
      }
      return;
    }

    if (this.#pendingRequests.has(id)) {
      const { resolve, reject } = this.#pendingRequests.get(id);
      if (type === "ERROR") {
        reject(payload);
      } else {
        resolve(payload);
      }
      this.#pendingRequests.delete(id);
    }
  }
}
