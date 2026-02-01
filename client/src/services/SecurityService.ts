export interface AuditLogEntry {
    id: string;
    timestamp: string;
    action: string;
    actor: string;
    resource: string;
    outcome: 'SUCCESS' | 'FAILURE' | 'DENIED';
    ip: string;
    riskScore: number;
}

class SecurityService {
    private static instance: SecurityService;
    private auditLog: AuditLogEntry[] = [];

    private constructor() { }

    public static getInstance(): SecurityService {
        if (!SecurityService.instance) {
            SecurityService.instance = new SecurityService();
        }
        return SecurityService.instance;
    }

    /**
     * Generates a realistic-looking SHA-256 hash for passwords (simulation).
     * In production, this would use window.crypto.subtle.
     */
    public async hashPassword(password: string): Promise<string> {
        const msgBuffer = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Simulates device fingerprinting based on User Agent and Screen resolution.
     */
    public getDeviceFingerprint(): string {
        const ua = navigator.userAgent;
        const screenRes = `${window.screen.width}x${window.screen.height}`;
        return btoa(`${ua}-${screenRes}`).slice(0, 16);
    }

    /**
     * Calculates a risk score (0-100) based on context.
     * High score = High risk.
     */
    public evaluateRisk(fingerprint: string): number {
        // Simulation: Random risk fluctuation + check known fingerprint
        // In real app: compare against stored known_devices
        const baseRisk = Math.floor(Math.random() * 20);
        return baseRisk;
    }

    /**
     * Logs a security event to the immutable ledger (simulated).
     */
    public logEvent(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
        const fullEntry: AuditLogEntry = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            ...entry
        };
        this.auditLog.push(fullEntry);
        console.log(`[AUDIT_LEDGER] ${fullEntry.timestamp} | ${fullEntry.action} | ${fullEntry.outcome} | Risk: ${fullEntry.riskScore}`);

        // Persist to local storage for demo purposes
        localStorage.setItem('audit_ledger', JSON.stringify(this.auditLog));
    }

    public getAuditLogs(): AuditLogEntry[] {
        return this.auditLog;
    }
}

export const securityService = SecurityService.getInstance();
