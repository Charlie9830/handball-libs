import Dexie from 'dexie';

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

    db.on("populate", () => {
        db.generalConfig.put({id: 0, value: { isFirstTimeBoot: true }});
    });

    isSetup = true;
}

// Fallback Values.
export const generalConfigFallback = { 
    startInFullscreen: false,
    startLocked: false,
}