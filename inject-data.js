const fs = require("fs");

// Check if Netlify provided the real data via environment variable
const realData = process.env.REAL_SCHEDULE_DATA;

if (realData) {
  console.log("Injecting real schedule data from environment variable...");
  try {
    // Parse securely to ensure it's valid JSON before writing
    const parsed = JSON.parse(realData);
    fs.writeFileSync("schedule-data.json", JSON.stringify(parsed, null, 2));
    console.log("✅ Real data injected successfully.");
  } catch (e) {
    console.error(
      "❌ Failed to parse real data from environment variable:",
      e.message,
    );
    process.exit(1); // Fail the build if data is corrupted
  }
} else {
  console.log("No real data provided. Proceeding with demo data.");
}
