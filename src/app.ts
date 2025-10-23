import {ThemeSwitcher} from "./theme";
import {SaveFileRepair} from "./file_upload";
import {State} from "./state";
import {ModifySave} from "./modify";

class App {
    private state: State;
    private modifySave: ModifySave;

    constructor() {
        this.init();
    }

    private init(): void {
        const appContainer = document.getElementById('app');
        if (!appContainer) return;

        this.state = new State();
        this.modifySave = new ModifySave(this.state);

        new ThemeSwitcher();
        new SaveFileRepair(this.state);

        this.setupApplyButton();
    }

    private setupApplyButton(): void {
        const applyBtn = document.getElementById('apply-btn');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                this.modifySave.apply_handler().then(r => {});
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});