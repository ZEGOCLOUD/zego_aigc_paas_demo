
export type TimeEndCallback = (elapsedTime: number) => void

export class Timer {
    callback: TimeEndCallback;
    interval: number;
    startTime: number;
    requestId: ReturnType<typeof setTimeout> | null = null;
    isRunning: boolean;
    count: number;
    lastElapsed: number;
    averageElapsed: number;

    constructor(callback: TimeEndCallback, interval: number) {
        this.callback = callback;
        this.interval = interval;
        this.startTime = 0;
        this.requestId = null;
        this.isRunning = false;
        this.count = 0;
        this.lastElapsed = 0;
        this.averageElapsed = 0;
    }
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.startTime = Date.now();
            this.tick(); // Call tick method to start the timer
        }
    }
    stop() {
        if (this.isRunning && this.requestId) {
            this.isRunning = false;
            clearTimeout(this.requestId);
            this.requestId = null;
        }
    }
    tick() {
        const elapsed = Date.now() - this.startTime;
        const deltaElapsed = elapsed - this.lastElapsed;
        this.lastElapsed = elapsed;
        this.averageElapsed = (this.averageElapsed * this.count + deltaElapsed) / (this.count + 1);
        this.count++;
        if ((elapsed + this.averageElapsed / 2) >= this.interval) {
            this.callback(elapsed);
            this.startTime = Date.now();
            this.count = 0;
            this.lastElapsed = 0;
            this.averageElapsed = 0;
        }
        this.requestId = setTimeout(this.tick.bind(this), 16); // 60 fps
    }
}