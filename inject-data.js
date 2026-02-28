const fs = require("fs");

/**
 * Fetches data from a URL and saves it to a file.
 * Exits the process with error code 1 if a required URL is provided but fetch fails.
 */
async function fetchData(url, filename, envVarName) {
  if (!url) {
    console.warn(`⚠️ Warning: Environment variable ${envVarName} is NOT set.`);
    console.warn(
      `   Skipping injection for ${filename}. Repository demo data will be used.`,
    );
    return false;
  }

  // Mask sensitive URL for logging (show first 15 chars)
  const maskedUrl = url.substring(0, 15) + "...";
  console.log(
    `📡 Fetching real data for ${filename} from ${envVarName} (${maskedUrl})`,
  );

  try {
    const res = await fetch(url);
    const text = await res.text();

    if (!res.ok) {
      console.error(
        `❌ ERROR: Failed to fetch ${filename}. HTTP ${res.status} ${res.statusText}`,
      );
      process.exit(1);
    }

    if (text.trim().startsWith("<")) {
      console.error(
        `❌ ERROR: Expected JSON but received HTML for ${filename}.`,
      );
      console.error(
        `   Check if ${envVarName} points to the 'RAW' Gist URL and is publicly accessible.`,
      );
      process.exit(1);
    }

    try {
      const parsed = JSON.parse(text);
      fs.writeFileSync(filename, JSON.stringify(parsed, null, 2));
      console.log(`✅ SUCCESS: ${filename} injected successfully.`);
      return true;
    } catch (parseError) {
      console.error(
        `❌ ERROR: Failed to parse JSON for ${filename}: ${parseError.message}`,
      );
      process.exit(1);
    }
  } catch (e) {
    console.error(
      `❌ ERROR: Network error while injecting ${filename}:`,
      e.message,
    );
    process.exit(1);
  }
}

async function injectAll() {
  console.log("🛠️ Starting Data Injection Process...");

  const lectureSuccess = await fetchData(
    process.env.REAL_DATA_URL,
    "schedule-data.json",
    "REAL_DATA_URL",
  );

  const sectionSuccess = await fetchData(
    process.env.REAL_SECTIONS_URL,
    "sections-data.json",
    "REAL_SECTIONS_URL",
  );

  if (!lectureSuccess && !sectionSuccess) {
    console.log(
      "ℹ️ No environment variables found. Build will proceed with repository demo data.",
    );
  } else {
    console.log("✨ Data injection phase completed.");
  }
}

injectAll().catch((err) => {
  console.error("❌ UNEXPECTED ERROR in script:", err);
  process.exit(1);
});
