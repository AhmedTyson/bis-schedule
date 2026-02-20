import { ScheduleProcessor } from "../modules/utils/ScheduleProcessor.js";

// --- MOCK DATA ---
const mockData = [
  { subject: "Early Bird", time: "08:00 AM – 10:00 AM", day: "Monday" },
  { subject: "Lunch Learn", time: "12:00 PM – 01:00 PM", day: "Monday" },
  { subject: "Late Night", time: "06:00 PM – 08:00 PM", day: "Monday" },
  { subject: "Tuesday Class", time: "10:00 AM – 12:00 PM", day: "Tuesday" },
];

// --- TEST HELPER ---
function runTest(testName, mockNow, expectedActive, expectedUpcoming) {
  console.log(`\n--- TEST: ${testName} ---`);
  console.log(
    `Mock Time: ${mockNow.toLocaleTimeString()} on ${mockNow.toLocaleDateString("en-US", { weekday: "long" })}`,
  );

  const { active, upcoming } = ScheduleProcessor.getActiveClasses(
    mockData,
    mockNow,
  );

  console.log(
    "Active Classes:",
    active.map((a) => a.subject),
  );
  console.log(
    "Upcoming Classes:",
    upcoming.map((u) => `${u.subject} (starts in ${u.startsIn}m)`),
  );

  // ASSERTIONS
  let passed = true;

  // Check Active
  if (active.length !== expectedActive.length) {
    console.error(
      `FAIL: Expected ${expectedActive.length} active, got ${active.length}`,
    );
    passed = false;
  } else {
    const activeNames = active.map((a) => a.subject);
    if (!expectedActive.every((e) => activeNames.includes(e))) {
      console.error(
        `FAIL: Active mismatch. Expected ${expectedActive.join(", ")}`,
      );
      passed = false;
    }
  }

  // Check Upcoming
  if (upcoming.length !== expectedUpcoming.length) {
    console.error(
      `FAIL: Expected ${expectedUpcoming.length} upcoming, got ${upcoming.length}`,
    );
    passed = false;
  } else {
    const upcomingNames = upcoming.map((u) => u.subject);
    if (!expectedUpcoming.every((e) => upcomingNames.includes(e))) {
      console.error(
        `FAIL: Upcoming mismatch. Expected ${expectedUpcoming.join(", ")}`,
      );
      passed = false;
    }

    // Check Sort Order (Ascending startsIn)
    for (let i = 0; i < upcoming.length - 1; i++) {
      if (upcoming[i].startsIn > upcoming[i + 1].startsIn) {
        console.error("FAIL: Upcoming not sorted by time!");
        passed = false;
      }
    }
  }

  if (passed) console.log("✅ PASSED");
  else console.log("❌ FAILED");
}

// --- SETUP DATES (Monday is usually day 1 in JS getDay() but let's force it) ---
// We need a specific Monday date. Jan 1, 2024 was a Monday.
const baseDate = new Date("2024-01-01T00:00:00"); // Monday

// SCENARIO 1: 07:50 AM (Morning, nothing active, Early Bird upcoming)
const timeEarly = new Date(baseDate);
timeEarly.setHours(7, 50);
runTest(
  "Scenario 1: 10 mins before first class",
  timeEarly,
  [],
  ["Early Bird"],
);

// SCENARIO 2: 08:30 AM (During Early Bird)
const timeActive = new Date(baseDate);
timeActive.setHours(8, 30);
runTest("Scenario 2: During Early Bird", timeActive, ["Early Bird"], []);

// SCENARIO 3: 11:50 AM (10 mins before Lunch Learn)
const timeBeforeLunch = new Date(baseDate);
timeBeforeLunch.setHours(11, 50);
runTest(
  "Scenario 3: 10 mins before Lunch",
  timeBeforeLunch,
  [],
  ["Lunch Learn"],
);

// SCENARIO 4: 01:05 PM (After Lunch, nothing upcoming yet)
const timeAfterLunch = new Date(baseDate);
timeAfterLunch.setHours(13, 5);
runTest("Scenario 4: After Lunch", timeAfterLunch, [], []);

// SCENARIO 5: 05:45 PM (15 mins before Late Night)
const timeBeforeLate = new Date(baseDate);
timeBeforeLate.setHours(17, 45); // 05:45 PM is exactly 15 mins before 06:00 PM
runTest(
  "Scenario 5: 15 mins before Late Night",
  timeBeforeLate,
  [],
  ["Late Night"],
);

// SCENARIO 6: Tuesday (Different Day)
const tuesdayDate = new Date("2024-01-02T10:30:00"); // Tuesday 10:30
runTest("Scenario 6: Tuesday Class Active", tuesdayDate, ["Tuesday Class"], []);

console.log("\n--- TESTS COMPLETED ---");
