class FirestoreBatchPaginator {
    constructor(firestore) {

        if (firestore === undefined || firestore === null) {
            throw "An instance of the Firestore library must be provided to the contructor";
        }

        this.firestore = firestore;
        this.currentEntryCount = 0;
        this.currentBatchIndex = 0;
        this.batches = [];
        this.batches.push(this.firestore.batch());
    } 

    create(documentRef, data) {
        if (this.isBatchFull()) {
            this.createNewBatch();
        }

        this.currentEntryCount++;

        return this.batches[this.currentBatchIndex].create(documentRef, data);   
    }

    delete(documentRef, precondition) {
        if (this.isBatchFull()) {
            this.createNewBatch();
        }

        this.currentEntryCount++;

        if (precondition !== undefined) {
            return this.batches[this.currentBatchIndex].delete(documentRef, precondition);  
        }

        else {
            return this.batches[this.currentBatchIndex].delete(documentRef);  
        }

         
    }

    set(documentRef, data, options ) {
        if (this.isBatchFull()) {
            this.createNewBatch();
        }

        this.currentEntryCount++;

        return this.batches[this.currentBatchIndex].set(documentRef, data, options);   
    }

    update(documentRef, data, precondition ) {
        if (this.isBatchFull()) {
            this.createNewBatch();
        }

        this.currentEntryCount++;

        if (precondition !== undefined) {
            return this.batches[this.currentBatchIndex].update(documentRef, data, precondition); 
        }

        else {
            return this.batches[this.currentBatchIndex].update(documentRef, data); 
        }
          
    }

    commit() {
        return new Promise((resolve, reject) => {
            var requests = [];
            this.batches.forEach(batch => {
                requests.push(batch.commit());
            })

            Promise.all(requests).then(() => {
                resolve();
            }).catch(error => {
                reject(error);
            })
        })
        
    }

    createNewBatch() {
        var newIndex = this.batches.push(this.firestore.batch()) - 1;
        this.currentBatchIndex = newIndex;
        this.currentEntryCount = 0;
    }

    isBatchFull() {
        return this.currentEntryCount >= 500;
    }
}

export default FirestoreBatchPaginator;