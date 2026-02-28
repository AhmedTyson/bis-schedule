const fs = require("fs");

// Detect if we are running in a CI environment like Netlify
const IS_NETLIFY = process.env.NETLIFY === "true" || !!process.env.BUILD_ID;

/**
 * Fetches data from a URL and saves it to a file.
 * Exits the process with error code 1 if a required URL is missing on CI or fetch fails.
 */
async function fetchData(url, filename, envVarName) {
  if (!url) {
    if (IS_NETLIFY) {
      console.error(
        `❌ CRITICAL ERROR: Environment variable ${envVarName} is NOT set on Netlify.`,
      );
      console.error(
        `   The build MUST fail to prevent demo data from being published.`,
      );
      console.error(
        `   Please add ${envVarName} to your Netlify Site Settings.`,
      );
      process.exit(1);
    }
    console.warn(
      `⚠️ Warning: ${envVarName} is NOT set. Using repository demo data for ${filename}.`,
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
        `❌ ERROR: JSON syntax error in ${filename}: ${parseError.message}`,
      );
      process.exit(1);
    }
  } catch (e) {
    console.error(`❌ ERROR: Network failure for ${filename}:`, e.message);
    process.exit(1);
  }
}

async function injectAll() {
  console.log("🛠️ Starting Data Injection Process...");
  if (IS_NETLIFY) {
    console.log("🌐 Build Environment: Netlify detected.");
  } else {
    console.log("💻 Build Environment: Local development.");
  }

  // Diagnostic: Log all 'REAL_' variables (masked) to help debug presence
  const realKeys = Object.keys(process.env).filter((k) =>
    k.startsWith("REAL_"),
  );
  if (realKeys.length > 0) {
    console.log(
      "🔍 Detected REAL_* variables in environment:",
      realKeys.join(", "),
    );
  } else {
    console.warn("🔍 No REAL_* environment variables detected!");
  }

  // Actually attempt to fetch data
  await fetchData(
    process.env.REAL_DATA_URL,
    "schedule-data.json",
    "REAL_DATA_URL",
  );
  await fetchData(
    process.env.REAL_SECTIONS_URL,
    "sections-data.json",
    "REAL_SECTIONS_URL",
  );

  console.log("✨ Data injection phase completed.");
}

injectAll().catch((err) => {
  console.error("❌ UNEXPECTED ERROR in injection script:", err);
  process.exit(1);
});
