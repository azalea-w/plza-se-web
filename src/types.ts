export enum Gender {
    MALE,
    FEMALE
}

export enum Language {
    KANA ,
    KANJI,
    ENGLISH,
    FRENCH,
    ITALIAN,
    GERMAN,
    SPANISH,
    KOREAN,
    SIMP_CH,
    TRAD_CH,
}

export class BagEntry {
    category: number
    quantity: number
}

export class BagData {
    entries: { [key: string]: BagEntry }
}

export class DexEntry {
    capture_flag: number
    battle_flag: number
    shiny_flag: number
    mega_flag: number
}

export class DexData {
    entries: { [key: string]: DexEntry }
}

export class CoreData {
    name: string
    gender: Gender
    tid: number
    language: Language
}

export class ParseResponse {
    success: boolean
    ref_id: string
    core: CoreData
    bag: BagData
    dex: DexData

    constructor(obj: ParseResponse) {
        this.bag = obj.bag
        this.dex = obj.dex
        this.success = obj.success
        this.ref_id = obj.ref_id
        this.core = obj.core
    }
}