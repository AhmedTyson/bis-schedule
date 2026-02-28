# Google AI Studio Extraction Prompt

Copy the entire block below and paste it into [Google AI Studio](https://aistudio.google.com/) after uploading your two PDF files.

---

### Master Prompt for Level 3 Section Data

**Role:** Expert Data Extraction Assistant
**Task:** Extract the **Section (Tutorial/Practical)** schedule for **Level 3 BIS** second term and map them to their corresponding Microsoft Teams codes.

#### 1. Context & Setup

You are provided with two PDF files:

- `جدول المستوي الثاني والثالث والرابع BIS second term.pdf` (The Schedule)
- `Section Codes Level 1,2,3,4.pdf` (The Teams Codes)

#### 2. Target Subjects (Level 3 ONLY)

Focus exclusively on these 6 subjects:

1. Auditing
2. Management Information Systems (MIS)
3. Advanced Database
4. Internet Applications
5. Operations Research
6. Economics of Information

#### 3. Extraction Steps

**Step A: Extract Schedule Data**
Scan the schedule PDF. Look for entries labeled "Sec" or "Section". For each Level 3 subject, extract:

- **Subject Name** (English)
- **Group Number** (e.g., G1, G15, G24)
- **TA/Instructor Name** (Arabic, usually starts with أ.)
- **Day** (e.g., Saturday, Sunday, Monday, etc.)
- **Time Window** (e.g., 08:00 AM – 10:00 AM)
- **Room/Hall/Lab** (e.g., Hall 6, Lab 3)

**Step B: Map Teams Codes**
Scan the Codes PDF. Locate the "Level 3" section. Match the Subject and Group from Step A to find the unique **7-character Teams Code** (e.g., `i3l0908`).

#### 4. Formatting Instructions

Produce the final output as a clean Markdown table with these columns:

| Subject | Group | TA Name (Arabic) | Day | Time | Room | Teams Code |
| :------ | :---- | :--------------- | :-- | :--- | :--- | :--------- |

#### 5. Critical Constraints

- **IMPORTANT:** "Sec" (Section) entries are distinct from "Lec" (Lecture). Do NOT extract Lectures (Lec/د.).
- **Mapping:** Ensure every group matches its specific code. If a code is missing in the PDF, write "N/A".
- **Names:** Keep Arabic TA names exactly as written in the PDF.
- **Completeness Check:** Check for fragmentation. For subjects like "Economics of Information", ensure you capture all groups up to G24.
- **Empty Subjects:** If a subject (like Auditing) has no "Sec" entries in the PDF, list the subject but state "No section entries found in schedule".

---
