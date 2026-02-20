export class DOMUtils {
    /**
     * Creates an element with class, text, and attributes.
     * @param {string} tag - HTML tag
     * @param {object} options - { className, text, html, dataset, attributes, events }
     */
    static createElement(tag, options = {}) {
        const el = document.createElement(tag);
        if (options.className) el.className = options.className;
        if (options.text) el.textContent = options.text;
        if (options.html) el.innerHTML = options.html;
        
        if (options.dataset) {
            Object.entries(options.dataset).forEach(([key, val]) => el.dataset[key] = val);
        }
        
        if (options.attributes) {
            Object.entries(options.attributes).forEach(([key, val]) => el.setAttribute(key, val));
        }

        if (options.events) {
            Object.entries(options.events).forEach(([event, handler]) => el.addEventListener(event, handler));
        }
        
        return el;
    }

    /**
     * Clears and populates a container with options.
     * @param {HTMLElement} container 
     * @param {Array} items - Array of strings or objects {value, label}
     * @param {Function} renderItem - Optional custom renderer
     */
    static populateContainer(container, items, renderItem = null) {
        if (!container) return;
        container.innerHTML = '';
        
        items.forEach(item => {
            const el = renderItem ? renderItem(item) : this.createOption(item);
            container.appendChild(el);
        });
    }

    static createOption(value, label = value, isSelected = false) {
        return this.createElement('div', {
            className: `option ${isSelected ? 'selected' : ''}`,
            dataset: { value },
            text: label
        });
    }
}
