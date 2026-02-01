export type AdminEvent = {
    id: string;
    type: 'LOGIN' | 'TRANSACTION' | 'ALERT' | 'SYSTEM' | 'ML_DRIFT' | 'SYSTEM_HEARTBEAT' | 'FORENSIC_EVENT';
    message: string;
    timestamp: string;
    severity: 'info' | 'warning' | 'error' | 'success';
    // Optional fields for System Heartbeats
    system_code?: string;
    status?: string;
    latency?: number;
};

class StreamService {
    private listeners: ((event: AdminEvent) => void)[] = [];
    private ws: WebSocket | null = null;
    private interval: NodeJS.Timer | null = null;

    constructor() {
        this.connect();
        this.startSyntheticStream();
    }

    private connect() {
        try {
            this.ws = new WebSocket('ws://localhost:8000/ws/admin');

            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.emit(data);
            };

            this.ws.onclose = () => {
                setTimeout(() => this.connect(), 5000); // Retry connection
            };
        } catch (e) {
            console.warn("WebSocket connection failed, relying on synthetic stream");
        }
    }

    private startSyntheticStream() {
        // [REAL-TIME ENFORCEMENT]
        // Synthetic events disabled requested by User.
        // Pure WebSocket stream only.
        console.log("Real-Time Stream: Synthetic events disabled. Listening for backend events only.");
    }

    public subscribe(callback: (event: AdminEvent) => void) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    private emit(event: AdminEvent) {
        this.listeners.forEach(cb => cb(event));
    }
}

export const streamService = new StreamService();
