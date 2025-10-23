import {State} from "./state";
import {BagEntry} from "./types";
import item_db from "../lib/plaza/util/item_db.json";

export class BagEditor {
    private state: State;
    private changes: Map<string, any> = new Map();
    private filteredItems: Array<{id: string, data: any}> = [];

    constructor(state: State) {
        this.state = state;
    }

    init(bagEditorDiv: HTMLDivElement) {
        bagEditorDiv.style.display = '';

        this.renderBagItems();
        this.setupEventListeners();
    }

    private renderBagItems(): void {
        const bagItemsContainer = document.getElementById('bag-items') as HTMLTableSectionElement;
        if (!bagItemsContainer) return;

        bagItemsContainer.innerHTML = '';

        // Get all items from the bag
        const bagEntries = this.state.save_data.bag.entries;

        Object.entries(bagEntries).forEach(([itemId, entry]) => {
            const itemData = (item_db as any)[itemId];
            if (!itemData) return;

            const row = this.createBagItemRow(itemId, itemData, entry);
            bagItemsContainer.appendChild(row);
        });

        // Store all items for filtering
        this.updateFilteredItems();
    }

    private createBagItemRow(itemId: string, itemData: any, entry: BagEntry): HTMLTableRowElement {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <span class="me-2">${itemData.english_ui_name}</span>
                    <small class="text-muted">(#${itemId})</small>
                </div>
            </td>
            <td>
                <input type="number" class="form-control form-control-sm quantity-input" 
                       value="${entry.quantity}" min="0" max="999" 
                       data-item-id="${itemId}">
            </td>
        `;

        return row;
    }

    private updateFilteredItems(): void {
        this.filteredItems = [];
        const bagEntries = this.state.save_data.bag.entries;

        Object.entries(bagEntries).forEach(([itemId, entry]) => {
            const itemData = (item_db as any)[itemId];
            if (itemData) {
                this.filteredItems.push({
                    id: itemId,
                    data: itemData
                });
            }
        });
    }

    private setupEventListeners(): void {
        // Quantity input changes
        document.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            if (target.classList.contains('quantity-input')) {
                const itemId = target.getAttribute('data-item-id');
                const newQuantity = parseInt(target.value);

                if (itemId && !isNaN(newQuantity)) {
                    if (newQuantity !== this.state.save_data.bag.entries[itemId].quantity) {
                        this.changes.set(`bag_${itemId}`, newQuantity);
                    } else {
                        this.changes.delete(`bag_${itemId}`);
                    }
                }
            }
        });

        // Search functionality
        const searchInput = document.getElementById('bag-search') as HTMLInputElement;
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = (e.target as HTMLInputElement).value.toLowerCase();
                this.filterBagItems(searchTerm);
            });
        }
    }

    private filterBagItems(searchTerm: string): void {
        const bagItemsContainer = document.getElementById('bag-items') as HTMLTableSectionElement;
        if (!bagItemsContainer) return;

        const rows = bagItemsContainer.getElementsByTagName('tr');

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const itemName = row.cells[0].textContent?.toLowerCase() || '';
            const shouldShow = itemName.includes(searchTerm);
            row.style.display = shouldShow ? '' : 'none';
        }
    }

    private getItemOptions(): string {
        let options = '';
        Object.entries(item_db).forEach(([itemId, itemData]) => {
            options += `<option value="${itemId}">${(itemData as any).english_ui_name} (#${itemId})</option>`;
        });
        return options;
    }


    public getChanges(): Map<string, any> {
        return new Map(this.changes);
    }

    public hasChanges(): boolean {
        return this.changes.size > 0;
    }
}
