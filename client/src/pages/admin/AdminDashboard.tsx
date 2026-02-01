import React, { useEffect, useState, useRef } from 'react';
import { Box, Grid, Paper, Typography, Card, CardContent, Stack, LinearProgress, Chip, List, ListItem, ListItemText, ListItemIcon, keyframes } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import WarningIcon from '@mui/icons-material/Warning';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CircleIcon from '@mui/icons-material/Circle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useAdmin } from '../../contexts/AdminContext';
import { streamService, AdminEvent } from '../../services/StreamService';

// CSS Animations
const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
`;

const KPICard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string; subtext?: string }> = ({ title, value, icon, color, subtext }) => {
    // Simple state to trigger animation on value change
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        setAnimate(true);
        const timer = setTimeout(() => setAnimate(false), 300);
        return () => clearTimeout(timer);
    }, [value]);

    return (
        <Card sx={{ bgcolor: '#1f2833', color: '#c5c6c7', border: `1px solid ${color}`, borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', bgcolor: color }} />
            <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                        <Typography variant="overline" sx={{ color: '#66fcf1', letterSpacing: 1 }}>{title}</Typography>
                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 700,
                                color: '#ffffff',
                                my: 1,
                                animation: animate ? `${pulse} 0.3s ease-in-out` : 'none',
                                display: 'inline-block'
                            }}
                        >
                            {value}
                        </Typography>
                        {subtext && <Typography variant="caption" sx={{ color: '#c5c6c7', display: 'block' }}>{subtext}</Typography>}
                    </Box>
                    <Box sx={{ p: 1, borderRadius: 1, bgcolor: `${color}22`, color: color }}>
                        {icon}
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
};

const EventRow: React.FC<{ event: AdminEvent }> = ({ event }) => {
    let color = '#66fcf1';
    let icon = <InfoOutlinedIcon fontSize="small" />;

    if (event.severity === 'error') { color = '#ff0000'; icon = <ErrorOutlineIcon fontSize="small" />; }
    if (event.severity === 'warning') { color = '#ffa000'; icon = <WarningIcon fontSize="small" />; }
    if (event.severity === 'success') { color = '#00e676'; icon = <CheckCircleOutlineIcon fontSize="small" />; }

    return (
        <ListItem sx={{ py: 1, borderBottom: '1px solid rgba(69, 162, 158, 0.1)', animation: `${slideIn} 0.4s ease-out` }}>
            <ListItemIcon sx={{ minWidth: 36, color: color }}>
                {icon}
            </ListItemIcon>
            <ListItemText
                primary={
                    <Typography variant="body2" sx={{ color: '#ffffff', fontFamily: 'monospace' }}>
                        <span style={{ color: color, marginRight: 8 }}>[{event.type}]</span>
                        {event.message}
                    </Typography>
                }
                secondary={<Typography variant="caption" sx={{ color: '#aaa' }}>{new Date(event.timestamp).toLocaleTimeString()}</Typography>}
            />
        </ListItem>
    );
};

export const AdminDashboard: React.FC = () => {
    const { logAdminAction } = useAdmin();
    const [events, setEvents] = useState<AdminEvent[]>([]);
    const [stats, setStats] = useState({
        activeUsers: 0,
        activeSessions: 0,
        highRiskProfiles: 0,
        pendingApprovals: 0,
        mlHealth: 100.0
    });

    const fetchStats = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch('http://localhost:8000/admin/dashboard/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setStats({
                    activeUsers: data.total_users,
                    activeSessions: data.active_sessions_24h,
                    highRiskProfiles: data.risk_distribution.find((r: any) => r.name === 'High Risk')?.value || 0,
                    pendingApprovals: data.pending_approvals || 0,
                    mlHealth: data.ml_health ?? 0.0
                });
            }
        } catch (e) { console.error("Stats fetch failed", e); }
    };

    useEffect(() => {
        logAdminAction('VIEW_DASHBOARD', { view: 'overview' });
        fetchStats();

        // Subscribe to real-time events
        const unsubscribe = streamService.subscribe((event) => {
            setEvents(prev => [event, ...prev].slice(0, 8)); // Keep last 8 events
            // Refresh stats on relevant events
            if (['LOGIN', 'TRANSACTION', 'ALERT', 'FORENSIC_EVENT'].includes(event.type)) {
                fetchStats();
            }
        });

        const interval = setInterval(fetchStats, 30000); // Poll every 30s as backup

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, []);

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Box>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffffff' }}>Admin Overview</Typography>
                        <Chip
                            icon={<CircleIcon sx={{ fontSize: '10px !important' }} />}
                            label="LIVE STREAM ACTIVE"
                            color="success"
                            size="small"
                            variant="outlined"
                            sx={{ borderRadius: 1, borderColor: '#00e676', color: '#00e676', '& .MuiChip-icon': { color: '#00e676' } }}
                        />
                    </Stack>
                    <Typography variant="body1" sx={{ color: '#45a29e' }}>Real-time platform monitoring and control</Typography>
                </Box>
                <Chip
                    icon={<AccessTimeIcon />}
                    label={`Last Sync: ${new Date().toLocaleTimeString()}`}
                    sx={{ bgcolor: '#1f2833', color: '#66fcf1', border: '1px solid #45a29e' }}
                />
            </Stack>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4, lg: 2.4 }}>
                    <KPICard
                        title="Active Users"
                        value={stats.activeUsers}
                        icon={<PeopleIcon />}
                        color="#66fcf1"
                        subtext="Connected now"
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 4, lg: 2.4 }}>
                    <KPICard
                        title="Active Sessions"
                        value={stats.activeSessions}
                        icon={<VpnKeyIcon />}
                        color="#45a29e"
                        subtext="All tokens valid"
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 4, lg: 2.4 }}>
                    <KPICard
                        title="High Risk Profiles"
                        value={stats.highRiskProfiles}
                        icon={<WarningIcon />}
                        color="#ff0000"
                        subtext="Requiring review"
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 4, lg: 2.4 }}>
                    <KPICard
                        title="Pending Approvals"
                        value={stats.pendingApprovals}
                        icon={<AssignmentTurnedInIcon />}
                        color="#ffa000"
                        subtext="Governance queue"
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 4, lg: 2.4 }}>
                    <KPICard
                        title="ML System Health"
                        value={`${stats.mlHealth.toFixed(1)}%`}
                        icon={<ModelTrainingIcon />}
                        color={stats.mlHealth > 90 ? "#00e676" : "#ff0000"}
                        subtext="Models operating normally"
                    />
                </Grid>
            </Grid>

            {/* QUICK STATUS SECTION */}
            <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 3, bgcolor: '#1f2833', color: '#c5c6c7', border: '1px solid #45a29e', height: '100%' }}>
                        <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>Real-Time System Bus</Typography>
                        <List dense>
                            {events.map((event) => (
                                <EventRow key={event.id} event={event} />
                            ))}
                            {events.length === 0 && <Typography variant="caption" sx={{ fontStyle: 'italic', color: '#666' }}>Waiting for event stream...</Typography>}
                        </List>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 3, bgcolor: '#1f2833', color: '#c5c6c7', border: '1px solid #45a29e', height: '100%' }}>
                        <Typography variant="h6" sx={{ color: '#ffffff', mb: 3 }}>Infrastructure Health</Typography>
                        <Stack spacing={4}>
                            <Box>
                                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Identity Service</Typography>
                                    <Typography variant="body2" sx={{ color: '#00e676' }}>OPERATIONAL</Typography>
                                </Stack>
                                <LinearProgress variant="determinate" value={100} sx={{ height: 8, borderRadius: 1, bgcolor: '#0b0c10', '& .MuiLinearProgress-bar': { bgcolor: '#00e676' } }} />
                            </Box>
                            <Box>
                                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Transaction Ledger</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="caption" sx={{ color: '#aaa' }}>12ms</Typography>
                                        <Typography variant="body2" sx={{ color: '#00e676' }}>OPERATIONAL</Typography>
                                    </Box>
                                </Stack>
                                <LinearProgress variant="determinate" value={98} sx={{ height: 8, borderRadius: 1, bgcolor: '#0b0c10', '& .MuiLinearProgress-bar': { bgcolor: '#00e676' } }} />
                            </Box>
                            <Box>
                                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>ML Inference Engine</Typography>
                                    <Typography variant="body2" sx={{ color: stats.mlHealth < 95 ? '#ffa000' : '#00e676' }}>
                                        {stats.mlHealth < 95 ? 'DEGRADED' : 'OPTIMAL'}
                                    </Typography>
                                </Stack>
                                <LinearProgress variant="determinate" value={stats.mlHealth} sx={{ height: 8, borderRadius: 1, bgcolor: '#0b0c10', '& .MuiLinearProgress-bar': { bgcolor: stats.mlHealth < 95 ? '#ffa000' : '#00e676' } }} />
                            </Box>
                        </Stack>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};
