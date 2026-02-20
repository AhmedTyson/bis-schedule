import { Config } from "../Config.js";

/**
 * Utility functions for time manipulation and schedule logic.
 */
export class TimeUtils {
  /**
   * Converts a 12-hour time string (e.g., "10:00 AM") to minutes from midnight.
   * @param {string} timeStr - The time string to parse.
   * @returns {number} Minutes from midnight.
   */
  static timeToMinutes(timeStr) {
    if (!timeStr) return -1;
    // Use regex for split to handle potential double spaces or tabs
    const [time, modifier] = timeStr.trim().split(/\s+/);
    if (!time) return -1;

    let [hours, minutes] = time.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return -1;

    if (hours === 12) hours = 0;
    if (modifier === "PM") hours += 12;

    return hours * 60 + minutes;
  }

  /**
   * Gets the current time in minutes from midnight.
   * @param {Date} date - Optional date to use as "now".
   * @returns {number} Current minutes from midnight.
   */
  static getCurrentMinutes(date = new Date()) {
    const now = date;
    return now.getHours() * 60 + now.getMinutes();
  }

  /**
   * Gets the current day name in English (e.g., "Monday").
   * @param {Date} date - Optional date to use as "today".
   * @returns {string} The current day name.
   */
  static getCurrentDay(date = new Date()) {
    return date.toLocaleDateString("en-US", { weekday: "long" });
  }

  /**
   * Calculates the progress percentage of a current event.
   * @param {string} startStr - Start time (e.g., "10:00 AM").
   * @param {string} endStr - End time (e.g., "11:00 AM").
   * @param {Date} date - Optional date.
   * @returns {number} Percentage (0-100).
   */
  static getProgress(startStr, endStr, date = new Date()) {
    const start = this.timeToMinutes(startStr);
    const end = this.timeToMinutes(endStr);
    const now = this.getCurrentMinutes(date);

    if (now < start) return 0;
    if (now > end) return 100;

    const totalDuration = end - start;
    const elapsed = now - start;

    return Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
  }

  /**
   * Determines the status of a class relative to the current time.
   * @param {string} startStr - Start time.
   * @param {string} endStr - End time.
   * @param {number} upcomingWindow - Minutes to look ahead.
   * @param {Date} date - Optional date.
   * @returns {'ACTIVE' | 'UPCOMING' | 'FINISHED' | 'FUTURE'} Status.
   */
  static getClassStatus(
    startStr,
    endStr,
    upcomingWindow = 15,
    date = new Date(),
  ) {
    const start = this.timeToMinutes(startStr);
    const end = this.timeToMinutes(endStr);
    const now = this.getCurrentMinutes(date);

    if (now >= start && now < end) return "ACTIVE";
    if (now < start && start - now <= upcomingWindow) return "UPCOMING";
    if (now >= end) return "FINISHED";
    return "FUTURE";
  }
  /**
   * Determines the current academic week status.
   * @param {Date} date - Optional date.
   * @returns {Object|null} { week, location, event }
   */
  static getAcademicStatus(date = new Date()) {
    const calendar = Config.ACADEMIC_CALENDAR;
    if (!calendar) return null;

    const now = date.getTime();

    for (let i = 0; i < calendar.WEEKS.length; i++) {
      const week = calendar.WEEKS[i];
      const start = new Date(week.start).getTime();
      const end = new Date(week.end).getTime();

      // Add a buffer to end date because new Date("2026-02-12") is midnight
      // We want to cover the whole day of the end date.
      const endOfDay = end + 24 * 60 * 60 * 1000 - 1;

      if (now >= start && now <= endOfDay) {
        const weekNumber = i + 1;
        const location =
          week.locationOverride ||
          (weekNumber % 2 !== 0
            ? calendar.ROTATION.ODD
            : calendar.ROTATION.EVEN);
        return {
          week: weekNumber,
          location: location,
          event: week.event,
        };
      }
    }
    return null;
  }
}
