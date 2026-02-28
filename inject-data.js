const fs = require("fs");

async function fetchData(url, filename) {
  if (!url) {
    console.log(`No URL provided for ${filename}. Proceeding with demo data.`);
    return false;
  }

  console.log(`Fetching real data for ${filename} from Gist...`);
  try {
    const res = await fetch(url);
    const text = await res.text();

    if (!res.ok) {
      console.error(
        `❌ Failed to fetch ${url}: HTTP ${res.status} ${res.statusText}`,
      );
      return false;
    }

    if (text.trim().startsWith("<")) {
      console.error(
        `❌ Expected JSON but received HTML for ${filename}. Check Gist accessibility.`,
      );
      return false;
    }

    const parsed = JSON.parse(text);
    fs.writeFileSync(filename, JSON.stringify(parsed, null, 2));
    console.log(`✅ ${filename} injected successfully from Gist.`);
    return true;
  } catch (e) {
    console.error(`❌ Error injecting ${filename}:`, e.message);
    return false;
  }
}

async function injectAll() {
  const lectureSuccess = await fetchData(
    process.env.REAL_DATA_URL,
    "schedule-data.json",
  );
  const sectionSuccess = await fetchData(
    process.env.REAL_SECTIONS_URL,
    "sections-data.json",
  );

  if (!lectureSuccess && !sectionSuccess) {
    console.log("⚠️ No real data injected. Using repository demo files.");
  }
}

injectAll();
