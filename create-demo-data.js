const fs = require("fs");

const data = JSON.parse(fs.readFileSync("schedule-data.json", "utf8"));

let docIndex = 1;
const doctorMapEn = {};
const doctorMapAr = {};

const mockCodes = "abcdefghijklmnopqrstuvwxyz0123456789";

function generateCode() {
  let code = "";
  for (let i = 0; i < 7; i++) {
    code += mockCodes[Math.floor(Math.random() * mockCodes.length)];
  }
  return code;
}

data.forEach((item) => {
  // Map original names to mock names systematically
  if (item.doctorEn && !doctorMapEn[item.doctorEn]) {
    doctorMapEn[item.doctorEn] = `Dr. Professor ${docIndex}`;
    doctorMapAr[item.doctorAr] = `د. أستاذ ${docIndex}`;
    docIndex++;
  }

  if (item.doctorEn) {
    item.doctorEn = doctorMapEn[item.doctorEn];
    item.doctorAr = doctorMapAr[item.doctorAr];
  }

  // Scramble Teams code
  if (item.code && item.code !== "N/A" && item.code !== "Drop") {
    item.code = generateCode();
  }
});

fs.writeFileSync("schedule-data-demo.json", JSON.stringify(data, null, 2));
console.log("✅ Created schedule-data-demo.json with anonymized data.");
