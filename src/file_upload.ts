import {State} from "./state";
import {ParseResponse} from "./types";

export class SaveFileRepair {
    private dropZone: HTMLElement;
    private fileInput: HTMLInputElement;
    private resultDiv: HTMLElement;
    private state: State;
    private seDiv: HTMLElement;


    constructor(state: State) {
        this.dropZone = document.getElementById('drop-zone')!;
        this.fileInput = document.getElementById('file-input')! as HTMLInputElement;
        this.resultDiv = document.getElementById('result_upload')!;
        this.seDiv = document.getElementById('save-editor')!;
        this.state = state;

        this.initEventListeners();
    }

    initEventListeners() {
        this.fileInput.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            if (target.files.length > 0) {
                this.handleFile(target.files?.item(0)).catch();
            }
        });


        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('dragover');
        });

        this.dropZone.addEventListener('dragleave', () => {
            this.dropZone.classList.remove('dragover');
        });

        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('dragover');

            if (e.dataTransfer.files.length > 0) {
                this.handleFile(e.dataTransfer.files[0]).catch();
            }
        });
    }

    async handleFile(file) {
        this.showLoading('Parsing save file...');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/parse', {
                method: 'POST',
                body: formData
            });

            const result = await response.json() as ParseResponse;

            if (result.success) {
                document.getElementById("loading").style.display = "hidden";
                this.dropZone.classList.remove('d-flex');
                this.dropZone.style.display = 'none';
                this.dropZone.parentElement.classList.remove('h-100');
                this.dropZone.parentElement.classList.add('h-0');
                this.state.save_data = result;
                this.setupEditors()
            } else {
                this.showResult('error', result["log"] || 'Repair failed');
            }
        } catch (error) {
            this.showResult('error', 'Network error: ' + error.message);
        }
    }

    private setupEditors(): void {
        const saveEditorDiv = document.getElementById('save-editor') as HTMLDivElement;
        const bagEditorDiv = document.getElementById('bag-editor') as HTMLDivElement;
        const buttonContainer = document.getElementById('button-container') as HTMLDivElement;

        if (saveEditorDiv && bagEditorDiv && buttonContainer) {
            this.state.se.init(saveEditorDiv);
            this.state.be.init(bagEditorDiv);

            buttonContainer.style.display = 'flex';
        }
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
            html += `<br><a href="${downloadUrl}" class="download-btn" download="${filename}">Download Repaired File</a>`;
        }

        this.resultDiv.innerHTML = html;
    }
}

