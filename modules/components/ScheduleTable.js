import { Utils } from '../Utils.js';
import { Icons } from '../Icons.js';

export class ScheduleTable {
    #container;
    #tbody;
    
    constructor() {
        this.#tbody = document.getElementById('table-body');
    }

    render(data, searchTerm) {
        if (!this.#tbody) return;
        this.#tbody.innerHTML = '';
        
        const fragment = document.createDocumentFragment();
        data.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = this.#getRowTemplate(item, searchTerm);
            fragment.appendChild(tr);
        });
        this.#tbody.appendChild(fragment);
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
