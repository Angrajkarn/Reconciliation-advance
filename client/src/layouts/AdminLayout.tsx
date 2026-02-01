import React from 'react';
import { Box, AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, IconButton, Chip, Stack, Alert } from '@mui/material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import SecurityIcon from '@mui/icons-material/Security';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PolicyIcon from '@mui/icons-material/Policy';
import GavelIcon from '@mui/icons-material/Gavel';
import RuleIcon from '@mui/icons-material/Rule';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useAdmin } from '../contexts/AdminContext';

const drawerWidth = 280;
const headerHeight = 64;

export const AdminLayout: React.FC = () => {
    const { adminRole, activeEnvironment, activeSystemContext, exitAdminMode } = useAdmin();
    const navigate = useNavigate();
    const location = useLocation();

    const handleExit = () => {
        exitAdminMode();
        navigate('/dashboard');
    };

    const menuItems = [
        { text: 'Dashboard', icon: <AdminPanelSettingsIcon />, path: '/admin' },
        { text: 'Identity & Access', icon: <SecurityIcon />, path: '/admin/identity' },
        { text: 'System Registry', icon: <PolicyIcon />, path: '/admin/systems' },
        { text: 'Governance & Approvals', icon: <GavelIcon />, path: '/admin/governance' },
        { text: 'ML & Decision Control', icon: <RuleIcon />, path: '/admin/ml-control' },
        { text: 'Audit & Lineage', icon: <HistoryEduIcon />, path: '/admin/audit' },
    ];

    return (
        <Box sx={{ display: 'flex', bgcolor: '#0b0c10', minHeight: '100vh', color: '#c5c6c7' }}>

            {/* ADMIN HEADER */}
            <AppBar position="fixed" sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px`, bgcolor: '#1f2833', boxShadow: 'none', borderBottom: '1px solid #45a29e' }}>
                <Toolbar>

                    <Stack direction="row" alignItems="center" spacing={2} sx={{ flexGrow: 1 }}>
                        <Alert severity="warning" icon={<WarningAmberIcon fontSize="inherit" />} sx={{ py: 0, px: 2, bgcolor: 'rgba(255, 160, 0, 0.1)', color: '#ffa000', border: '1px solid #ffa000' }}>
                            ADMIN MODE ENABLED - ACTIONS ARE AUDITED
                        </Alert>
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={3}>
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body2" sx={{ color: '#66fcf1', fontWeight: 600 }}>
                                {adminRole.replace('_', ' ')}
                            </Typography>
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <Typography variant="caption" sx={{ color: '#c5c6c7' }}>{activeEnvironment}</Typography>
                                <Typography variant="caption" sx={{ color: '#45a29e' }}>•</Typography>
                                <Typography variant="caption" sx={{ color: '#c5c6c7' }}>{activeSystemContext}</Typography>
                            </Stack>
                        </Box>

                        <IconButton onClick={handleExit} sx={{ color: '#c5c6c7', '&:hover': { color: '#ffffff' } }} title="Exit Admin Mode">
                            <ExitToAppIcon />
                        </IconButton>
                    </Stack>
                </Toolbar>
            </AppBar>

            {/* ADMIN SIDEBAR */}
            <Drawer
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        bgcolor: '#0b0c10',
                        color: '#c5c6c7',
                        borderRight: '1px solid #45a29e'
                    },
                }}
                variant="permanent"
                anchor="left"
            >
                <Toolbar sx={{ minHeight: headerHeight, display: 'flex', alignItems: 'center', px: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#66fcf1', letterSpacing: 1 }}>
                        RESONANT.AI
                    </Typography>
                </Toolbar>
                <Divider sx={{ borderColor: 'rgba(69, 162, 158, 0.3)' }} />

                <List sx={{ pt: 2 }}>
                    {menuItems.map((item) => (
                        <ListItem key={item.text} disablePadding>
                            <ListItemButton
                                onClick={() => navigate(item.path)}
                                selected={location.pathname === item.path}
                                sx={{
                                    '&.Mui-selected': { bgcolor: 'rgba(69, 162, 158, 0.15)', borderRight: '3px solid #66fcf1' },
                                    '&:hover': { bgcolor: 'rgba(69, 162, 158, 0.05)' }
                                }}
                            >
                                <ListItemIcon sx={{ color: location.pathname === item.path ? '#66fcf1' : '#45a29e' }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: 500 }} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>

                <Box sx={{ mt: 'auto', p: 3 }}>
                    <SecurityContextWidget />
                </Box>
            </Drawer>

            {/* MAIN CONTENT AREA */}
            <Box component="main" sx={{ flexGrow: 1, p: 3, mt: `${headerHeight}px` }}>
                <Outlet />
            </Box>
        </Box>
    );
};

const SecurityContextWidget: React.FC = () => {
    const [context, setContext] = React.useState<{ ip: string; session_id: string } | null>(null);

    React.useEffect(() => {
        const fetchContext = async () => {
            try {
                const token = sessionStorage.getItem('token');
                if (!token) return;

                const response = await fetch('http://localhost:8000/admin/context/security', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    setContext(data);
                }
            } catch (error) {
                console.error("Failed to fetch security context");
            }
        };

        fetchContext();
        // Refresh context every minute to ensure session validity is checked
        const interval = setInterval(fetchContext, 60000);
        return () => clearInterval(interval);
    }, []);

    if (!context) return <Box sx={{ p: 2, height: 80 }} />; // Skeleton placeholder

    return (
        <Box sx={{ p: 2, border: '1px dashed #45a29e', borderRadius: 1, bgcolor: 'rgba(69, 162, 158, 0.05)' }}>
            <Typography variant="caption" display="block" sx={{ color: '#45a29e', mb: 1 }}>SECURITY CONTEXT</Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>SESSION: {context.session_id}</Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>IP: {context.ip}</Typography>
        </Box>
    );
};
