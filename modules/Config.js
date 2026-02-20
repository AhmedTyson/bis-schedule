export const Config = {
  DATA_URL: "schedule-data.json",
  DESKTOP_WIDTH: 1200,
  FRIDAY_MEME_COUNT: 5,
  SUBJECT_ACRONYMS: {
    "Management Information Systems": "MIS",
    "Operations Research": "OR",
    "Advanced Database": "Adv. Database",
    "Economics of Information": "Econ. of Info",
    "Internet Applications": "Internet Apps",
  },

  // Ramadan Mode - Temporary schedule shifts for the holy month
  RAMADAN_MODE: {
    ENABLED: true, // Set to true to activate shifts
    TIME_MAP: {
      "08:00 AM – 10:00 AM": "08:30 AM – 10:00 AM",
      "10:00 AM – 12:00 PM": "10:00 AM – 11:30 AM",
      "12:00 PM – 02:00 PM": "11:30 AM – 01:00 PM",
      "02:00 PM – 04:00 PM": "01:00 PM – 02:30 PM",
      "04:00 PM – 06:00 PM": "02:30 PM – 04:00 PM",
    },
  },

  // Academic Calendar - Bi-weekly rotation between Online and On-Campus
  ACADEMIC_CALENDAR: {
    SEMESTER_START: "2026-02-07", // Week 1 Start
    ROTATION: {
      ODD: "Online",
      EVEN: "On Campus",
    },
    WEEKS: [
      { start: "2026-02-07", end: "2026-02-12", event: "Add & Drop" },
      { start: "2026-02-14", end: "2026-02-19", event: "Add & Drop" },
      { start: "2026-02-21", end: "2026-02-26", event: "Drop Only" },
      { start: "2026-02-28", end: "2026-03-05", event: "Drop Only" },
      { start: "2026-03-07", end: "2026-03-12", event: "" },
      {
        start: "2026-03-14",
        end: "2026-03-19",
        event: "",
        locationOverride: "Online",
      }, // Last week of Ramadan exception
      { start: "2026-03-21", end: "2026-03-26", event: "" },
      { start: "2026-03-28", end: "2026-04-02", event: "Midterm Exam" },
      { start: "2026-04-04", end: "2026-04-09", event: "" },
      { start: "2026-04-11", end: "2026-04-16", event: "" },
      { start: "2026-04-18", end: "2026-04-23", event: "" },
      { start: "2026-04-25", end: "2026-04-30", event: "" },
      { start: "2026-05-02", end: "2026-05-07", event: "" },
    ],
  },

  /**
   * Dynamically calculates how many rows fit on the screen.
   * Logic optimized for the 1200px viewport scaling used on mobile.
   */
  // Cache for the calculated rows
  _rowsPerPage: 24,

  init() {
    this.updateRowsPerPage();

    let resizeTimeout;
    window.addEventListener("resize", () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.updateRowsPerPage();
      }, 200);
    });
  },

  updateRowsPerPage() {
    const { innerWidth: width, innerHeight: height } = window;

    if (width >= this.DESKTOP_WIDTH) {
      this._rowsPerPage = 24;
      return;
    }

    // Effective height calculation for the scaled-out mobile viewport
    const effectiveHeight = (height / width) * this.DESKTOP_WIDTH;

    // Layout constants
    const UI_CHROME_HEIGHT = 450;
    const ROW_HEIGHT = 73;

    const availableHeight = effectiveHeight - UI_CHROME_HEIGHT;
    const calculatedRows = Math.floor(availableHeight / ROW_HEIGHT);

    // Clamp between 24 and 100, adding a 5-row buffer for overflow
    this._rowsPerPage = Math.min(Math.max(calculatedRows + 5, 24), 100);
  },

  /**
   * Returns the cached number of rows that fit on the screen.
   */
  get ROWS_PER_PAGE() {
    return this._rowsPerPage;
  },
};
