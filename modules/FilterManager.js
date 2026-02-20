import { Utils } from './Utils.js';

export class FilterManager {
    #filters = { search: '', subject: 'all', group: 'all', day: 'all', time: 'all' }; // Added time for completeness logic
    
    constructor() {}

    get filters() { return { ...this.#filters }; }

    /**
     * Updates a single filter value.
     * @param {string} key - The filter key (e.g., 'search', 'subject').
     * @param {string} value - The new value.
     * @returns {boolean} True if the key was valid and updated.
     */
    update(key, value) {
        if (Object.hasOwn(this.#filters, key)) {
            this.#filters[key] = value;
            return true;
        }
        return false;
    }

    /**
     * Resets all filters to their default 'all' or empty state.
     */
    reset() {
        this.#filters = { search: '', subject: 'all', group: 'all', day: 'all', time: 'all' };
    }

    /**
     * Applies current filters to the dataset using the Logic extracted from DataService
     */
    applyFilters(data) {
        const { subject, group, day } = this.#filters;
        
        // Structure Match (Dropdowns)
        return data.filter(item => {
            return (subject === 'all' || item.subject === subject) &&
                   (group === 'all' || item.group === group) &&
                   (day === 'all' || item.day === day);
        });
    }
}
