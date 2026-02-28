import Fuse from "../../assets/libs/fuse.esm.js";
import { Utils } from "../Utils.js?v=7";

let fuse = null;
let suggestionsFuse = null;

self.onmessage = async (e) => {
  const { type, payload, id } = e.data;

  try {
    if (type === "INIT") {
      const { data } = payload;

      // 0. Pre-compute searchable text (Moved from DataService)
      // We modify the data in-place (or rather, the worker's copy)
      data.forEach((item) => {
        item._searchIndex = Utils.normalizeText(`
                    ${item.subject} ${Utils.getSubjectDisplay(item.subject)} 
                    ${item.group} ${item.doctorAr} ${item.doctorEn} 
                    ${item.day} ${item.time} ${item.originalTime || ""} ${item.code} ${item.room}
                `);
      });

      // 1. Initialize Main Fuse
      fuse = new Fuse(data, {
        keys: [
          "subject",
          "subjectAcronym",
          "group",
          "doctorAr",
          "doctorEn",
          "day",
          "time",
          "originalTime",
          "room",
          "code",
        ],
        threshold: 0.2,
        ignoreLocation: true,
        minMatchCharLength: 3,
        findAllMatches: true,
        getFn: (obj, key) => {
          const val =
            key === "subjectAcronym"
              ? Utils.getSubjectDisplay(obj.subject)
              : obj[key];
          return Utils.normalizeText(val);
        },
      });

      // 2. Initialize Suggestions Fuse
      const uniqueValues = (key) =>
        [...new Set(data.map((d) => d[key]))].filter((v) => v && v !== "-");
      const suggestionItems = [
        ...uniqueValues("subject").map((s) => ({
          type: "subject",
          text: s,
          display: s,
        })),
        ...uniqueValues("doctorEn").map((d) => ({
          type: "doctor",
          text: d,
          display: d,
        })),
        ...uniqueValues("doctorAr").map((d) => ({
          type: "doctor",
          text: d,
          display: d,
        })),
      ];

      suggestionsFuse = new Fuse(suggestionItems, {
        keys: ["text"],
        threshold: 0.4,
        minMatchCharLength: 2,
      });

      // Send back the data (with _searchIndex added) if needed,
      // but usually DataService just needs to know we are ready.
      // Actually, DataService uses _searchIndex for its own simple filtering too?
      // FilterManager uses DataService.fuse usually?
      // Wait, FilterManager logic:
      // "const results = fuse.search(criteria.search)..."
      // "return data.filter(item => ...)"
      // FilterManager does filtering on the MAIN thread using `data`.
      // If we move Fuse to worker, FilterManager needs to change to async?
      // Or `FilterManager` delegates search to `DataService` which delegates to Worker?

      self.postMessage({ type: "READY", id });
    } else if (type === "SEARCH") {
      if (!fuse) return;
      const results = fuse.search(payload.query);
      // Return only items or indices? Returning items is easier for now.
      // Transfer overhead for large data might be an issue, but let's start simple.
      const items = results.map((r) => r.item);
      self.postMessage({ type: "SEARCH_RESULTS", payload: items, id });
    } else if (type === "SUGGEST") {
      if (!suggestionsFuse) return;
      const results = suggestionsFuse.search(payload.query);
      const items = results.map((r) => r.item).slice(0, 5);
      self.postMessage({ type: "SUGGEST_RESULTS", payload: items, id });
    }
  } catch (error) {
    self.postMessage({ type: "ERROR", payload: error.message, id });
  }
};
