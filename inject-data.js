const fs = require("fs");
const https = require("https");

// Check if Netlify provided the real data via environment variable
const dataUrl = process.env.REAL_DATA_URL;

function fetchUrl(url) {
  https
    .get(url, (res) => {
      // Handle redirects (GitHub gist raw URLs redirect to githubusercontent)
      if (res.statusCode === 301 || res.statusCode === 302) {
        console.log(`Following redirect to: ${res.headers.location}`);
        return fetchUrl(res.headers.location);
      }

      if (res.statusCode !== 200) {
        console.error(
          `❌ Failed to fetch data. Status code: ${res.statusCode}`,
        );
        process.exit(1);
      }

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
          console.error(
            "❌ Failed to parse data from Gist. Received: " +
              rawData.substring(0, 100) +
              "...",
          );
          process.exit(1); // Fail the build if data is corrupted
        }
      });
    })
    .on("error", (e) => {
      console.error("❌ Failed to fetch data from Gist:", e.message);
      process.exit(1);
    });
}

if (dataUrl) {
  console.log("Fetching real schedule data from Gist...");
  fetchUrl(dataUrl);
} else {
  console.log("No REAL_DATA_URL provided. Proceeding with demo data.");
}
