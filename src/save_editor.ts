import {State} from "./state";
import {Gender, Language} from "./types";

export class SaveEditor {
    private state: State;
    private changes: Map<string, any> = new Map();

    constructor(state: State) {
        this.state = state;
    }

    init(seDiv: HTMLDivElement) {
        seDiv.style.display = '';
        seDiv.classList.add("d-flex");

        // Set up gender select options
        const genderSelect = document.getElementById('trainer-gender') as HTMLSelectElement;
        this.populateEnumSelect(genderSelect, Gender);
        genderSelect.value = String(this.state.save_data.core.gender);
        genderSelect.addEventListener('change', (e) => {
            const target = e.target as HTMLSelectElement;
            const newValue = parseInt(target.value) as Gender;
            if (newValue !== this.state.save_data.core.gender) {
                this.changes.set('gender', newValue);
            } else {
                this.changes.delete('gender');
            }
        });

        // Set up language select options
        const languageSelect = document.getElementById('trainer-language') as HTMLSelectElement;
        this.populateEnumSelect(languageSelect, Language);
        languageSelect.value = String(this.state.save_data.core.language);
        languageSelect.addEventListener('change', (e) => {
            const target = e.target as HTMLSelectElement;
            const newValue = parseInt(target.value) as Language;
            if (newValue !== this.state.save_data.core.language) {
                this.changes.set('language', newValue);
            } else {
                this.changes.delete('language');
            }
        });

        // Set up trainer name input
        const nameInput = document.getElementById('trainer-name') as HTMLInputElement;
        nameInput.value = this.state.save_data.core.name;
        nameInput.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            const newValue = target.value;
            if (newValue !== this.state.save_data.core.name) {
                this.changes.set('name', newValue);
            } else {
                this.changes.delete('name');
            }
        });

        // Set up trainer ID input
        const idInput = document.getElementById('trainer-id') as HTMLInputElement;
        idInput.value = String(this.state.save_data.core.tid);
        idInput.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            const value = parseInt(target.value);
            if (!isNaN(value) && value >= 0 && value < 4294967296) {
                if (value !== this.state.save_data.core.tid) {
                    this.changes.set('tid', value);
                } else {
                    this.changes.delete('tid');
                }
            }
        });
    }

    private populateEnumSelect(select: HTMLSelectElement, enumObj: any): void {
        const keys = Object.keys(enumObj).filter(key => isNaN(Number(key)));
        keys.forEach(key => {
            const option = document.createElement('option');
            option.value = String(enumObj[key]);
            option.textContent = key;
            select.appendChild(option);
        });
    }

    public getChanges(): Map<string, any> {
        return new Map(this.changes);
    }

    public hasChanges(): boolean {
        return this.changes.size > 0;
    }
}