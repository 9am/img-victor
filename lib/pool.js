class Task {
    constructor(getWorker) {
        this._waitForWorker = getWorker
            ? getWorker
            : () => new Promise(resolve => {
                this.addWorker = resolve;
            });
        this.run = this.run.bind(this);
    }

    async run(data, free) {
        return this._waitForWorker().then(worker => {
            return new Promise((resolve, reject) => {
                worker.onmessage = result => {
                    resolve(result.data);
                    free(worker);
                };
                worker.onerror = err => {
                    reject(err);
                    free(worker);
                };
                worker.postMessage(data);
            });
        });
    }
}

class Pool {
    constructor({ url = '', size = 1 }) {
        this._url = url;
        this._size = size;
        this._running = 0;
        this._workers = [];
        this._taskQueue = [];
        this._getWorker = this._getWorker.bind(this);
        this._freeWorker = this._freeWorker.bind(this);
    }

    addTask(data) {
        const hasFreeWorker = this._workers.length || this._running < this._size;
        const task = new Task(hasFreeWorker ? this._getWorker : null);
        if (!hasFreeWorker) {
            this._taskQueue.push(task);
        }
        return task.run(data, this._freeWorker);
    }

    async _getWorker() {
        return new Promise(resolve => {
            if (this._workers.length) {
                this._running++;
                resolve(this._workers.pop());
            }
            if (this._running < this._size) {
                this._running++;
                resolve(new Worker(new URL(this._url, import.meta.url)));
                // resolve(new this._url());
            }
            reject(`max worker: ${this._size}`);
        });
    }

    _freeWorker(worker) {
        if (this._taskQueue.length) {
            this._taskQueue.shift().addWorker(worker);
            return;
        }
        this._running--;
        this._workers.push(worker);
    }
}

export default Pool;
