const fs = require("fs");
const https = require("https");

// Check if Netlify provided the real data via environment variable
const dataUrl = process.env.REAL_DATA_URL;

if (dataUrl) {
  console.log("Fetching real schedule data from Gist...");

  https
    .get(dataUrl, (res) => {
      let rawData = "";
      res.on("data", (chunk) => {
        rawData += chunk;
      });
      res.on("end", () => {
        try {
          // Ensure it's valid JSON before saving
          const parsed = JSON.parse(rawData);
          fs.writeFileSync(
            "schedule-data.json",
            JSON.stringify(parsed, null, 2),
          );
          console.log("✅ Real data injected successfully from Gist.");
        } catch (e) {
          console.error("❌ Failed to parse data from Gist:", e.message);
          process.exit(1); // Fail the build if data is corrupted
        }
      });
    })
    .on("error", (e) => {
      console.error("❌ Failed to fetch data from Gist:", e.message);
      process.exit(1);
    });
} else {
  console.log("No REAL_DATA_URL provided. Proceeding with demo data.");
}
