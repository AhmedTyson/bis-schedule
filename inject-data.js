const fs = require("fs");

// Detect environments
const IS_NETLIFY = process.env.NETLIFY === "true" || !!process.env.BUILD_ID;
const IS_GITHUB_ACTIONS = process.env.GITHUB_ACTIONS === "true";

// Load .env manually if it exists (don't require external libs)
if (!IS_NETLIFY && !IS_GITHUB_ACTIONS && fs.existsSync(".env")) {
  const envFile = fs.readFileSync(".env", "utf8");
  envFile.split("\n").forEach((line) => {
    const [key, ...value] = line.split("=");
    if (key && value) {
      process.env[key.trim()] = value
        .join("=")
        .trim()
        .replace(/^['"]|['"]$/g, "");
    }
  });
}

/**
 * Fetches data from a URL and saves it to a file.
 */
async function fetchData(url, filename, envVarName) {
  // 1. GitHub Actions Protection: Never inject real data in public CI
  if (IS_GITHUB_ACTIONS) {
    console.log(
      `🛡️ GitHub Actions detected. Skipping real data for ${filename} to protect privacy.`,
    );
    return false;
  }

  // 2. Netlify Enforcement: Build must fail if real data is missing
  if (IS_NETLIFY && !url) {
    console.error(`❌ CRITICAL ERROR: ${envVarName} is NOT set on Netlify.`);
    console.error(
      `   The build MUST fail to prevent demo data from being published.`,
    );
    process.exit(1);
  }

  // 3. Local / Other Environments: Fallback to demo data if no URL
  if (!url) {
    console.warn(
      `⚠️ Warning: ${envVarName} is NOT set. Using demo data for ${filename}.`,
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
    console.log("🌐 Build Environment: Netlify (Production/Staging)");
  } else if (IS_GITHUB_ACTIONS) {
    console.log("🛡️ Build Environment: GitHub Actions (Public CI)");
  } else {
    console.log("💻 Build Environment: Local development");
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
