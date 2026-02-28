import { Config } from "./Config.js";
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
    this.#worker.onerror = (e) => {
      console.error("SearchWorker crashed:", e);
      this.#pendingRequests.forEach(({ reject }) => reject(e));
      this.#pendingRequests.clear();
    };
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
      let fetchUrl = Config.DATA_URL + "?v=2";

      // WPO Phase 2: Consume Pre-Fetched Data Promise
      // If index.html already fired the request, consume it instantly
      let dataResponse;

      // Environment-specific URL resolution
      if (
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
      ) {
        console.log("🔧 Local Dev: Using local datasets.");
        // URL is already local in Config, but we ensure it matches the pattern
        fetchUrl = fetchUrl.replace(/^https:\/\/.*?\/raw\//, "");
      }

      // If we are on production and the global promise exists, use it
      if (window.__DATA_PROMISE__ && fetchUrl.includes(Config.DATA_URL)) {
        dataResponse = await window.__DATA_PROMISE__;
      } else {
        const response = await fetch(fetchUrl);
        if (!response.ok)
          throw new Error(`HTTP ${response.status} at ${fetchUrl}`);
        dataResponse = await response.json();
      }

      this.#data = dataResponse;

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
   * Switches the data source to a different JSON file (e.g., lectures vs sections).
   * @param {string} url - The URL of the new data source.
   * @returns {Promise<Array>} The newly loaded data.
   */
  async switchDataSource(url) {
    try {
      let fetchUrl = url + "?v=2";

      if (
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
      ) {
        fetchUrl = url.replace(/^https:\/\/.*?\/raw\//, "") + "?v=2";
      }

      const response = await fetch(fetchUrl);
      if (!response.ok)
        throw new Error(`HTTP ${response.status} at ${fetchUrl}`);
      this.#data = await response.json();

      // Apply Ramadan Mode mapping if enabled
      if (Config.RAMADAN_MODE?.ENABLED) {
        this.#data = this.#data.map((item) => {
          if (Config.RAMADAN_MODE.TIME_MAP[item.time]) {
            return {
              ...item,
              originalTime: item.time,
              time: Config.RAMADAN_MODE.TIME_MAP[item.time],
            };
          }
          return item;
        });
      }

      // Reinitialize Worker with new data
      await this.#sendToWorker("INIT", { data: this.#data });

      return this.#data;
    } catch (error) {
      console.error("DataService switchDataSource Error:", error);
      throw error;
    }
  }

  /**
   * Retrieves classes that are currently active or starting within the next 15 minutes.
   * @returns {Array} Array of enriched class objects with status and progress.
   */
  getActiveClasses() {
    return ScheduleProcessor.getActiveClasses(this.#data);
  }

  // --- Worker Communication ---

  #sendToWorker(type, payload, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      const id = this.#requestIdCounter++;
      const timer = setTimeout(() => {
        this.#pendingRequests.delete(id);
        reject(new Error(`Worker timeout on ${type}`));
      }, timeoutMs);

      this.#pendingRequests.set(id, {
        resolve: (v) => {
          clearTimeout(timer);
          resolve(v);
        },
        reject: (e) => {
          clearTimeout(timer);
          reject(e);
        },
      });
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
