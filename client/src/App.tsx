import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme/theme';
import { GlobalLayout } from './layouts/GlobalLayout';
import { Dashboard } from './pages/Dashboard';
import { TransactionWorkbench } from './pages/TransactionWorkbench';
import { TransactionDetail } from './pages/TransactionDetail';
import { GovernanceConsole } from './pages/GovernanceConsole';
import { MlMonitoring } from './pages/MlMonitoring';
import { AuditLineage } from './pages/AuditLineage';
import { StressTesting } from './pages/StressTesting';
import { AdminControl } from './pages/AdminControl';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { IdentityAccess } from './pages/admin/IdentityAccess';
import { SystemRegistry } from './pages/admin/SystemRegistry';
import { AdminGovernance } from './pages/admin/AdminGovernance';
import { MlControl } from './pages/admin/MlControl';
import { AdminAudit } from './pages/admin/AdminAudit';
import { AdminProvider } from './contexts/AdminContext';

import { LandingPage } from './pages/LandingPage';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) return <div>Loading Security Context...</div>;

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
                <AdminProvider>
                    <BrowserRouter>
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            <Route path="/login" element={<LoginPage />} />

                            {/* Protected Routes - Standard User */}
                            <Route path="/dashboard" element={<ProtectedRoute><GlobalLayout><Dashboard /></GlobalLayout></ProtectedRoute>} />
                            <Route path="/transactions" element={<ProtectedRoute><GlobalLayout><TransactionWorkbench /></GlobalLayout></ProtectedRoute>} />
                            <Route path="/transactions/:id" element={<ProtectedRoute><GlobalLayout><TransactionDetail /></GlobalLayout></ProtectedRoute>} />
                            <Route path="/governance" element={<ProtectedRoute><GlobalLayout><GovernanceConsole /></GlobalLayout></ProtectedRoute>} />
                            <Route path="/monitoring" element={<ProtectedRoute><GlobalLayout><MlMonitoring /></GlobalLayout></ProtectedRoute>} />
                            <Route path="/audit" element={<ProtectedRoute><GlobalLayout><AuditLineage /></GlobalLayout></ProtectedRoute>} />
                            <Route path="/stress" element={<ProtectedRoute><GlobalLayout><StressTesting /></GlobalLayout></ProtectedRoute>} />

                            {/* Protected Routes - Admin Control Center */}
                            {/* Protected Routes - Admin Control Center */}
                            <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                                <Route index element={<AdminDashboard />} />
                                <Route path="identity" element={<IdentityAccess />} />
                                <Route path="systems" element={<SystemRegistry />} />
                                <Route path="governance" element={<AdminGovernance />} />
                                <Route path="ml-control" element={<MlControl />} />
                                <Route path="audit" element={<AdminAudit />} />
                                <Route path="*" element={<Navigate to="/admin" replace />} />
                            </Route>
                        </Routes>
                    </BrowserRouter>
                </AdminProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
