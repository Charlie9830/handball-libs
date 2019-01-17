import Dexie from 'dexie';
import BuiltInThemes from '../pounder-themes';

let db = null;
let isSetup = false;
const storeName = 'pounder-config';

export function getDexie() {
    if (!isSetup) {
        throw "Dexie isn't Initialized, ensure you call initializeDexie() first"
    }

    else {
        return db;
    }
}

export function initializeDexie() {
    db = new Dexie(storeName);
    
    db.version(1).stores({
        cssConfig: "id, propertyName, value",
        generalConfig: "id, value"
    })

    db.version(2).stores({
        muiThemes: 'id',
    }).upgrade(tx => {
        setBuiltInThemes(tx);
    })

    db.on("populate", () => {
        db.generalConfig.put({id: 0, value: { isFirstTimeBoot: true }});
        setBuiltInThemes(db);
    });

    isSetup = true;
}

function setBuiltInThemes(db) {
    db.muiThemes.bulkPut(BuiltInThemes);
}


// Fallback Values.
export const generalConfigFallback = { 
    startInFullscreen: false,
    startLocked: false,
    selectedMuiThemeId: 'default',
}