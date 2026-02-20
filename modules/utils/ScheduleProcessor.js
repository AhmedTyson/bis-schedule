import { TimeUtils } from "./TimeUtils.js";

export class ScheduleProcessor {
  /**
   * Filters the dataset for active and upcoming classes based on a reference time.
   * @param {Array} data - The schedule data.
   * @param {Date} date - value for "now".
   * @returns {Object} { active, upcoming }
   */
  static getActiveClasses(data, date = new Date()) {
    const today = TimeUtils.getCurrentDay(date);

    const active = [];
    const upcoming = [];

    data.forEach((item) => {
      if (item.day !== today) return;
      if (!item.time) return;

      // Handle "08:00 AM – 10:00 AM" (flexible dash and whitespace)
      const parts = item.time.split(/\s*[–\-\—]\s*/);
      if (parts.length !== 2) return;

      const [startStr, endStr] = parts;

      const status = TimeUtils.getClassStatus(startStr, endStr, 15, date);

      if (status === "ACTIVE") {
        const progress = TimeUtils.getProgress(startStr, endStr, date);
        const startMin = TimeUtils.timeToMinutes(startStr);
        const endMin = TimeUtils.timeToMinutes(endStr);
        const nowMin = TimeUtils.getCurrentMinutes(date);
        const timeLeft = endMin - nowMin;

        active.push({
          ...item,
          status,
          progress,
          timeLeft,
          startTime: startStr,
          endTime: endStr,
        });
      } else if (status === "UPCOMING" || status === "FUTURE") {
        const startMin = TimeUtils.timeToMinutes(startStr);
        const nowMin = TimeUtils.getCurrentMinutes(date);
        const startsIn = startMin - nowMin;

        upcoming.push({
          ...item,
          status,
          progress: 0,
          startsIn,
          startTime: startStr,
          endTime: endStr,
        });
      }
    });

    // Sort active by start time
    active.sort(
      (a, b) =>
        TimeUtils.timeToMinutes(a.startTime) -
        TimeUtils.timeToMinutes(b.startTime),
    );

    // Sort upcoming by time until start (ascending)
    upcoming.sort((a, b) => a.startsIn - b.startsIn);

    return { active, upcoming };
  }
}
