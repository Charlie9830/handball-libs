import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';
import 'firebase/functions';
let auth = null;
let firestore = null;
let functions = null;
var isSetup = false;


// Exports
export function getFirestore() {
    if (isSetup === false) {
        throw "Firestore has not been Setup yet. Call setupFirestore() with either development or production mode first";
    }

    else {
        return firestore;
    }
}

export function getAuth() {
    if (isSetup === false) {
        throw "Firebase has not been Setup yet. Call setupFirestore() with either development or production mode first"
    }

    else {
        return auth;
    }
}

export function getFunctions() {
    if (isSetup === false) {
        throw "Firebase has not been Setup yet. Call setupFirestore() with either development or production mode first"
    }

    else {
        return functions;
    }
}

export function setupFirebase(mode) {
    if (mode === "development") {
        // Development Database.
        var config = {
            apiKey: "AIzaSyBjzZE8FZ0lBvUIj52R_10eHm70aKsT0Hw",
            authDomain: "halo-todo.firebaseapp.com",
            databaseURL: "https://halo-todo.firebaseio.com",
            projectId: "halo-todo",
            storageBucket: "halo-todo.appspot.com",
            messagingSenderId: "801359392837"
        };

        firebase.initializeApp(config);

        firestore = firebase.firestore();
        auth = firebase.auth();
        functions = firebase.functions();

        // Settings.
        const settings = { timestampsInSnapshots: true};
        firestore.settings(settings);
        firestore.enablePersistence();

        isSetup = true;
    }

    if (mode === "production") {
        // Production DB 2.
        var config = {
            apiKey: "AIzaSyCXdE8p5AXpaqQ_RhcJp8TUwHOqSYPcYnU",
            authDomain: "pounder-production2.firebaseapp.com",
            databaseURL: "https://pounder-production2.firebaseio.com",
            projectId: "pounder-production2",
            storageBucket: "pounder-production2.appspot.com",
            messagingSenderId: "553455457889"
          };

        firebase.initializeApp(config);

        firestore = firebase.firestore();
        auth = firebase.auth();
        functions = firebase.functions();

        // Settings.
        const settings = { timestampsInSnapshots: true};
        firestore.settings(settings);
        firestore.enablePersistence();

        isSetup = true;
    }
}

// Account Config Fallback Value.
export const AccountConfigFallback = {
    favouriteProjectId: -1,
}

// Firestore Collection Paths.
let userUid = "";

export function setUserUid(uid) {
    userUid = uid;
}

export function getUserUid() {
    return userUid;
}
