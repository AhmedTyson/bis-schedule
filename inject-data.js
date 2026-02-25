const fs = require("fs");

async function injectData() {
  const dataUrl = process.env.REAL_DATA_URL;

  if (!dataUrl) {
    console.log("No REAL_DATA_URL provided. Proceeding with demo data.");
    return;
  }

  console.log("Fetching real schedule data from Gist...");
  try {
    const res = await fetch(dataUrl);
    const text = await res.text();

    if (!res.ok) {
      console.error(
        `❌ Failed to fetch REAL_DATA_URL: HTTP ${res.status} ${res.statusText}`,
      );
      process.exit(1);
    }

    // GitHub often returns HTML (like a 404 page) if the URL is wrong/private
    if (text.trim().startsWith("<")) {
      console.error(
        `❌ Expected JSON but received HTML. Check if REAL_DATA_URL points to the 'Raw' gist and is publicly accessible.`,
      );
      process.exit(1);
    }

    const parsed = JSON.parse(text);
    fs.writeFileSync("schedule-data.json", JSON.stringify(parsed, null, 2));
    console.log("✅ Real data injected successfully from Gist.");
  } catch (e) {
    console.error("❌ Error injecting data:", e.message);
    process.exit(1);
  }
}

injectData();
