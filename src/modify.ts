import {State} from "./state";

export class ModifySave {
    private state: State;
    private resultDiv: HTMLDivElement;

    constructor(state: State) {
        this.state = state;
        this.resultDiv = document.getElementById("result") as HTMLDivElement;
    }

    public async apply_handler(): Promise<void> {
        if (!this.state.se.hasChanges() && !this.state.be.hasChanges()) {
            console.log('No changes to apply');
            return;
        }

        try {
            const changes = this.collectChanges();

            // Send to API
            this.showLoading('Modifying save file...');

            const response = await fetch('/modify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    changes: changes,
                    save_data_ref: this.state.save_data.ref_id
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                console.log('Changes applied successfully');
                this.handleSuccess(result);
            } else {
                this.handleError(result.error || 'Unknown error occurred');
            }

        } catch (error) {
            console.error('Failed to apply changes:', error);
            this.handleError(error.message);
        }
    }

    private collectChanges(): object {
        const coreChanges = Object.fromEntries(this.state.se.getChanges());
        const bagChanges = Object.fromEntries(this.state.be.getChanges());

        return {
            core: coreChanges,
            bag: bagChanges
        };
    }

    private handleSuccess(result: any): void {
        this.showResult("success", "", result["download_url"], "main");

        this.state.se.getChanges().clear();
        this.state.be.getChanges().clear();
    }

    private handleError(error: string): void {
        this.showResult("error", error)
    }

    showLoading(message) {
        this.resultDiv.innerHTML = `
            <div id="loading">
                <div class="d-flex justify-content-center">
                    <div class="spinner-border" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
                ${message}
            </div>
        `;
    }

    showResult(type, message, downloadUrl = null, filename = null) {
        let html = message;

        if (downloadUrl) {
            html += `<br><a href="${downloadUrl}" class="download-btn" download="${filename}">Download Modified File</a>`;
        }

        this.resultDiv.innerHTML = html;
    }
}