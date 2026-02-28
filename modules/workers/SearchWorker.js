import Fuse from "../../assets/libs/fuse.esm.js";
import { Utils } from "../Utils.js?v=7";

let fuse = null;
let suggestionsFuse = null;

self.onmessage = async (e) => {
  const { type, payload, id } = e.data;

  try {
    if (type === "INIT") {
      const start = performance.now();
      const { data } = payload;

      // 0. Pre-compute searchable text
      data.forEach((item) => {
        const subjectDisplay = Utils.getSubjectDisplay(item.subject);
        item._searchIndex = Utils.normalizeText(
          `${item.subject} ${subjectDisplay} ${item.group} ${item.doctorAr} ${item.doctorEn} ${item.day} ${item.time} ${item.originalTime || ""} ${item.code} ${item.room}`,
        );
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
          if (key === "subjectAcronym")
            return Utils.normalizeText(Utils.getSubjectDisplay(obj.subject));
          return Utils.normalizeText(obj[key]);
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

      const end = performance.now();
      console.log(`🚀 SearchWorker: INIT took ${(end - start).toFixed(2)}ms`);

      self.postMessage({ type: "READY", id });
    } else if (type === "SEARCH") {
      if (!fuse) return;
      const results = fuse.search(payload.query);
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
