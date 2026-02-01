import React, { createContext, useContext, useState, useEffect } from 'react';
import { securityService } from '../services/SecurityService';
import { API_URL, endpoints } from '../config';

// --- TYPES ---
export type UserRole = 'ADMIN' | 'OPS_ANALYST' | 'RISK_OFFICER' | 'AUDITOR';

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    mfaVerified: boolean;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    verifyMfa: (code: string) => Promise<boolean>;
    logout: () => void;
    isLoading: boolean;
    availableProfiles: any[];
    selectProfile: (profileId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [availableProfiles, setAvailableProfiles] = useState<any[]>([]);

    // Auto-logout timer
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (user) {
            timer = setTimeout(() => {
                console.log("[AUTH] Session timed out due to inactivity");
                logout();
            }, 15 * 60 * 1000); // 15 minutes
        }
        return () => clearTimeout(timer);
    }, [user]);

    useEffect(() => {
        // BYPASS LOGIN FOR DEV
        console.log("[AUTH] Dev Mode: Bypassing Credentials");
        setUser({
            id: 'dev_admin',
            email: 'admin@jpm.com',
            name: 'Dev Admin',
            role: 'ADMIN',
            mfaVerified: true
        });
        setIsLoading(false);
    }, []);

    const login = async (email: string, pass: string): Promise<boolean> => {
        setIsLoading(true);
        try {
            // Risk Calculation (Client Side)
            const risk = securityService.evaluateRisk(securityService.getDeviceFingerprint());

            const response = await fetch(endpoints.login, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password: pass,
                    device_fingerprint: securityService.getDeviceFingerprint()
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Login Failed:", errorData);
                securityService.logEvent({
                    action: 'LOGIN_ATTEMPT',
                    actor: email,
                    resource: 'AUTH_GATEWAY',
                    outcome: 'FAILURE',
                    ip: 'REAL_TIME',
                    riskScore: risk
                });
                setIsLoading(false);
                return false;
            }

            const data = await response.json();

            // Store Tokens
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('refresh_token', data.refresh_token);

            if (data.profiles && data.profiles.length > 0) {
                setAvailableProfiles(data.profiles);
                // We temporarily store the identity token if needed, or just keep session alive?
                // Actually, for simplicity, let's treat the returned token as a "Pre-Auth" token 
                // and store it, but don't set IsAuthenticated yet.
                localStorage.setItem('access_token', data.access_token);
                setIsLoading(false);
                return true; // Success, but maybe needs profile
            }

            securityService.logEvent({
                action: 'LOGIN_SUCCESS',
                actor: email,
                resource: 'AUTH_GATEWAY',
                outcome: 'SUCCESS',
                ip: 'REAL_TIME',
                riskScore: risk
            });

            setIsLoading(false);
            return true;
        } catch (error) {
            console.error("Network Error:", error);
            setIsLoading(false);
            return false;
        }
    };

    const selectProfile = async (profileId: string): Promise<boolean> => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('access_token'); // Use the pre-auth token
            if (!token) {
                console.error("No pre-auth token found for profile selection.");
                setIsLoading(false);
                return false;
            }

            const response = await fetch(endpoints.selectProfile, { // Assuming endpoints.selectProfile exists
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ profile_id: profileId }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Profile selection failed:", errorData);
                setIsLoading(false);
                return false;
            }

            const data = await response.json();
            localStorage.setItem('access_token', data.access_token); // Replace with the new system token
            localStorage.setItem('refresh_token', data.refresh_token); // Update refresh token if provided

            // Assuming the selected profile data is returned, or we can derive it
            const selectedProfile = availableProfiles.find(p => p.id === profileId);
            if (selectedProfile) {
                const fullUser: User = {
                    id: data.user_id || 'selected_user', // Get user ID from response or default
                    email: user?.email || 'unknown@example.com', // Keep original email
                    name: selectedProfile.name,
                    role: selectedProfile.role,
                    mfaVerified: false // MFA verification still needed after profile selection
                };
                setUser(fullUser);
            } else {
                // Fallback if selectedProfile not found in local state
                // In a real app, the backend would return the full user object
                setUser({
                    id: data.user_id || 'selected_user',
                    email: user?.email || 'unknown@example.com',
                    name: 'Selected User',
                    role: 'ADMIN', // Default or derive from token
                    mfaVerified: false
                });
            }

            setAvailableProfiles([]); // Clear profiles after selection
            securityService.logEvent({
                action: 'PROFILE_SELECTION',
                actor: user?.email || 'unknown',
                resource: 'AUTH_GATEWAY',
                outcome: 'SUCCESS',
                ip: 'REAL_TIME',
                riskScore: 0 // Re-evaluate risk if needed
            });
            setIsLoading(false);
            return true;
        } catch (error) {
            console.error("Network Error during profile selection:", error);
            setIsLoading(false);
            return false;
        }
    };

    const verifyMfa = async (code: string): Promise<boolean> => {
        if (!user) return false;

        // Simulate TOTP check
        if (code === '123456') {
            const fullyAuthed = { ...user, mfaVerified: true };
            setUser(fullyAuthed);
            localStorage.setItem('session_user', JSON.stringify(fullyAuthed));

            securityService.logEvent({
                action: 'MFA_CHALLENGE',
                actor: user.email,
                resource: 'MFA_PROVIDER',
                outcome: 'SUCCESS',
                ip: '192.168.1.1',
                riskScore: 0
            });
            return true;
        }
        return false;
    };

    const logout = () => {
        if (user) {
            securityService.logEvent({
                action: 'LOGOUT',
                actor: user.email,
                resource: 'SESSION_MANAGER',
                outcome: 'SUCCESS',
                ip: '192.168.1.1',
                riskScore: 0
            });
        }
        setUser(null);
        localStorage.removeItem('session_user');
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated: !!user?.mfaVerified, isLoading, user, login, logout, verifyMfa, availableProfiles, selectProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
