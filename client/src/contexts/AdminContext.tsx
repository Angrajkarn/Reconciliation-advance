import React, { createContext, useContext, useState, useEffect } from 'react';

interface AdminContextType {
    isAdminMode: boolean;
    adminRole: 'SUPER_ADMIN' | 'SYSTEM_ADMIN' | 'RISK_ADMIN' | 'AUDIT_ADMIN';
    activeEnvironment: 'PROD' | 'UAT' | 'DEV';
    activeSystemContext: 'GLOBAL' | 'RECON' | 'RISK';
    enterAdminMode: () => void;
    exitAdminMode: () => void;
    logAdminAction: (action: string, details?: any) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [adminRole, setAdminRole] = useState<'SUPER_ADMIN' | 'SYSTEM_ADMIN' | 'RISK_ADMIN' | 'AUDIT_ADMIN'>('SUPER_ADMIN');
    const [activeEnvironment, setActiveEnvironment] = useState<'PROD' | 'UAT' | 'DEV'>('PROD');
    const [activeSystemContext, setActiveSystemContext] = useState<'GLOBAL' | 'RECON' | 'RISK'>('GLOBAL');

    const enterAdminMode = () => {
        setIsAdminMode(true);
        // In a real app, this would validate with backend or MFA
        console.log("Admin Mode Enabled: Audit Logging Active");
    };

    const exitAdminMode = () => {
        setIsAdminMode(false);
        console.log("Admin Mode Disabled");
    };

    const logAdminAction = (action: string, details?: any) => {
        const entry = {
            timestamp: new Date().toISOString(),
            admin: 'J.P. Morgan Admin',
            role: adminRole,
            environment: activeEnvironment,
            action,
            details,
            correlationId: crypto.randomUUID()
        };
        console.warn(`[AUDIT] ${action}`, entry);
        // Here we would push to WebSocket or API
    };

    return (
        <AdminContext.Provider value={{
            isAdminMode,
            adminRole,
            activeEnvironment,
            activeSystemContext,
            enterAdminMode,
            exitAdminMode,
            logAdminAction
        }}>
            {children}
        </AdminContext.Provider>
    );
};

export const useAdmin = () => {
    const context = useContext(AdminContext);
    if (!context) {
        throw new Error('useAdmin must be used within an AdminProvider');
    }
    return context;
};
