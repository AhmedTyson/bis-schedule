import { Utils } from "../Utils.js";
import { Icons } from "../Icons.js";

export class ScheduleTable {
  #tbody;
  #currentFrame;
  #renderId = 0;

  constructor() {
    this.#tbody = document.getElementById("table-body");
  }

  render(data, searchTerm) {
    if (!this.#tbody) return;

    const currentRenderId = ++this.#renderId;

    // 1. Cancel any pending render to prevent duplication
    if (this.#currentFrame) {
      cancelAnimationFrame(this.#currentFrame);
      this.#currentFrame = null;
    }

    // 2. Clear table state
    this.#tbody.innerHTML = "";
    if (!data || data.length === 0) return;

    let index = 0;
    const CHUNK_SIZE = 15; // Optimize TBT by yielding the main thread

    const renderChunk = () => {
      if (currentRenderId !== this.#renderId) return;

      const fragment = document.createDocumentFragment();
      const end = Math.min(index + CHUNK_SIZE, data.length);

      for (; index < end; index++) {
        const tr = document.createElement("tr");
        tr.innerHTML = this.#getRowTemplate(data[index], searchTerm);
        fragment.appendChild(tr);
      }

      this.#tbody.appendChild(fragment);

      if (index < data.length) {
        this.#currentFrame = requestAnimationFrame(renderChunk);
      } else {
        this.#currentFrame = null;
      }
    };

    // FIX: Render the first chunk SYNCHRONOUSLY to eliminate the
    // 1-frame empty-table flash. Without this, innerHTML="" clears the
    // table, but new rows only appear in the NEXT animation frame (~16ms).
    // Subsequent chunks still use rAF to keep the main thread responsive.
    renderChunk();

    // If there's more data beyond the first chunk, schedule the rest via rAF
    if (index < data.length) {
      this.#currentFrame = requestAnimationFrame(renderChunk);
    }
  }

  #getRowTemplate(item, searchTerm) {
    const subjectDisplay = Utils.getSubjectDisplay(item.subject);
    const highlight = (text) => Utils.highlightText(text, searchTerm);

    return `
            <td class="subject-cell" data-label="Subject">${highlight(subjectDisplay)}</td>
            <td class="group-cell" data-label="Group">${highlight(item.group)}</td>
            <td class="doctor-cell" data-label="Doctor">
                <div class="doctor-stack">
                    <span class="doctor-ar">${highlight(item.doctorAr)}</span>
                    <span class="doctor-en">${highlight(item.doctorEn)}</span>
                </div>
            </td>
            <td data-label="Day">${highlight(item.day)}</td>
            <td data-label="Time">${highlight(item.time)}</td>
            <td data-label="Room">${highlight(item.room)}</td>
            <td data-label="Code">
                <div class="code-wrapper">
                    <span class="code-cell">${highlight(item.code)}</span>
                    <button class="copy-btn" title="Copy Code" aria-label="Copy Code" data-code="${item.code}">
                        <span class="icon-wrapper">${Icons.copy}</span>
                    </button>
                </div>
            </td>
        `;
  }
}
