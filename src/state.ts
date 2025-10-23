import {ParseResponse} from "./types";
import {SaveEditor} from "./save_editor";
import {BagEditor} from "./bag_editor";
import {ModifySave} from "./modify";

export class State {
    public save_data: ParseResponse;
    public se: SaveEditor;
    public be: BagEditor;
    public ms: ModifySave;

    constructor() {
        this.se = new SaveEditor(this);
        this.be = new BagEditor(this);
        this.ms = new ModifySave(this);
    }
}