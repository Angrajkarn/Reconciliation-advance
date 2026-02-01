import React from 'react';
import { Paper, Typography, Box, Divider, List, ListItem, ListItemText, Chip, Tooltip as MuiTooltip } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import WarningIcon from '@mui/icons-material/Warning';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

// --- ENTERPRISE MOCK DATA ---
const kpis = [
    { label: 'Transactions (Today)', value: '142,893', unit: 'Vol', trend: '+12%', status: 'neutral' },
    { label: 'Auto-Reconciled', value: '98.4', unit: '%', trend: '+0.1%', status: 'good' },
    { label: 'Ops Review Backlog', value: '412', unit: 'Txn', trend: '-5%', status: 'warning' },
    { label: 'High-Risk Exceptions', value: '18', unit: 'Txn', trend: '+2', status: 'critical' },
    { label: 'SLA Breaches (Pred)', value: '02', unit: 'Txn', trend: 'T-18m', status: 'critical' },
];

const throughputData = Array.from({ length: 12 }, (_, i) => ({
    hour: `${i + 8}:00`,
    matched: Math.floor(Math.random() * 5000) + 10000,
    exceptions: Math.floor(Math.random() * 500) + 100,
}));

const agingData = [
    { bucket: '<1h', count: 250, fill: '#66bb6a' },
    { bucket: '1-4h', count: 120, fill: '#ffa726' },
    { bucket: '>4h', count: 42, fill: '#f44336' },
];

const riskData = [
    { name: 'Low Risk', value: 320, color: '#4caf50' },
    { name: 'Medium Risk', value: 74, color: '#ff9800' },
    { name: 'High Risk', value: 18, color: '#f44336' },
];

const alerts = [
    { id: 1, time: '11:42', msg: 'Large FX variance detected (>15%) on Trade T-9932', type: 'critical' },
    { id: 2, time: '11:30', msg: 'SLA Breach predicted for APAC Settlement Batch', type: 'warning' },
    { id: 3, time: '11:15', msg: 'Model Confidence Drift detected in EUR/USD lane', type: 'info' },
    { id: 4, time: '10:55', msg: 'Gateway B reconnection successful', type: 'success' },
];

const systemHealth = [
    { label: 'Ingestion Latency', value: '45ms', status: 'good' },
    { label: 'Event Queue Lag', value: '0', status: 'good' },
    { label: 'ML Inference', value: '120ms', status: 'warning' },
    { label: 'Data Drift', value: 'Stable', status: 'good' },
];

// --- COMPONENTS ---

// --- COMPONENTS ---

// KPI Tile
const KpiTile = ({ data }: { data: any }) => {
    const borderColor = data.status === 'critical' ? '#f44336' : data.status === 'warning' ? '#ffa726' : data.status === 'good' ? '#66bb6a' : '#555';

    return (
        <Paper sx={{ p: 2, height: '100%', borderLeft: `4px solid ${borderColor}`, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 1 }}>
            <Typography variant="caption" color="textSecondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                {data.label}
            </Typography>
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>{data.value}</Typography>
                <Typography variant="body2" color="textSecondary">{data.unit}</Typography>
            </Box>
            <Typography variant="caption" sx={{ color: data.status === 'critical' ? 'error.main' : 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                {data.status === 'critical' && <WarningIcon fontSize="inherit" />}
                {data.trend}
            </Typography>
        </Paper>
    );
};

export const Dashboard: React.FC = () => {
    const [stats, setStats] = React.useState<any>(null);
    const [health, setHealth] = React.useState<any>({ status: 'Connecting...', next_batch_min: '--' }); // Real-time Health
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Stats
                const statsRes = await fetch('http://localhost:8000/admin/dashboard/stats');
                if (statsRes.ok) setStats(await statsRes.json());

                // 2. Fetch Health (Real-time)
                const healthRes = await fetch('http://localhost:8000/health');
                if (healthRes.ok) setHealth(await healthRes.json());

            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();

        // Refresh Health every 30s
        const interval = setInterval(() => {
            fetch('http://localhost:8000/health')
                .then(res => res.json())
                .then(data => setHealth(data))
                .catch(err => console.error("Health poll failed", err));
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    // Merge Real Data with Mocks (for chart visuals)
    const realKpis = [
        { label: 'Total Users', value: stats?.total_users || '0', unit: 'Users', trend: 'Stable', status: 'good' },
        { label: 'Active Sessions (24h)', value: stats?.active_sessions_24h || '0', unit: 'Logins', trend: 'Live', status: 'good' },
        { label: 'Ops Review Backlog', value: stats?.ops_backlog || '0', unit: 'Txn', trend: 'Live', status: 'warning' },
        { label: 'High-Risk Exceptions', value: stats?.high_risk_count || '0', unit: 'Txn', trend: 'Critical', status: (stats?.high_risk_count || 0) > 0 ? 'critical' : 'good' },
        { label: 'SLA Breaches (Pred)', value: stats?.sla_breaches || '0', unit: 'Txn', trend: 'Overdue', status: (stats?.sla_breaches || 0) > 0 ? 'critical' : 'good' },
    ];

    const displayAlerts = stats?.recent_alerts || alerts;
    const displayThroughput = stats?.throughput || throughputData;
    const displayRisk = stats?.risk_distribution || riskData;
    const displayAging = stats?.queue_aging || agingData;
    const displayHealth = stats?.system_health || systemHealth;


    return (
        <Box sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>

            {/* 1. Header & Context */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>OPERATIONS CONTROL_ROOM</Typography>
                    <Typography variant="caption" color="textSecondary">Global Reconciliation • Live View • {new Date().toLocaleDateString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Chip
                        icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                        label={health.status}
                        color={health.status === 'System Healthy' ? "success" : "warning"}
                        size="small"
                        variant="outlined"
                    />
                    <Chip
                        icon={<AccessTimeIcon sx={{ fontSize: 16 }} />}
                        label={`Next Batch: ${health.next_batch_min} mins`}
                        size="small"
                        variant="outlined"
                    />
                </Box>
            </Box>

            {/* 2. KPI STRIP */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(5, 1fr)' }, gap: 2 }}>
                {realKpis.map((kpi, idx) => <KpiTile key={idx} data={kpi} />)}
            </Box>

            {/* 3. MAIN CONTENT GRID (2/3 Left, 1/3 Right) */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2.5fr 1fr' }, gap: 2, flex: 1 }}>

                {/* LEFT: Ops Activity */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Throughput Chart */}
                    <Paper sx={{ p: 2, flex: 1, minHeight: 300 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="subtitle2" fontWeight={600}>RECONCILIATION THROUGHPUT (24H)</Typography>
                            <Typography variant="caption" color="textSecondary">Matches vs Exceptions</Typography>
                        </Box>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={displayThroughput} margin={{ top: 5, right: 30, left: 0, bottom: 5 }} barSize={20}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="hour" stroke="#666" fontSize={12} tickLine={false} />
                                <YAxis stroke="#666" fontSize={12} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#333', fontSize: '12px' }}
                                    itemStyle={{ padding: 0 }}
                                />
                                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                <Bar dataKey="matched" name="Auto-Matched" stackId="a" fill="#4caf50" />
                                <Bar dataKey="exceptions" name="Exceptions" stackId="a" fill="#f44336" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>

                    {/* Bottom Left: Alerts & Queue Aging */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 2, height: 250 }}>
                        {/* Alerts Feed */}
                        <Paper sx={{ p: 2, overflow: 'auto' }}>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>CRITICAL ALERTS FEED</Typography>
                            <List dense disablePadding>
                                {displayAlerts.map((alert: any) => (
                                    <ListItem key={alert.id} sx={{ borderBottom: '1px solid #333', px: 0 }}>
                                        <ListItemText
                                            primary={
                                                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {alert.type === 'critical' ? <ErrorOutlineIcon color="error" fontSize="small" /> : <WarningIcon color="warning" fontSize="small" />}
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{alert.msg}</Typography>
                                                </Box>
                                            }
                                            secondary={alert.time}
                                            secondaryTypographyProps={{ sx: { ml: 3.5, fontSize: '0.7rem' } }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>

                        {/* Queue Aging */}
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>QUEUE AGING (SLA RISK)</Typography>
                            <ResponsiveContainer width="100%" height="80%">
                                <BarChart data={displayAging} layout="vertical" margin={{ left: 20 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="bucket" type="category" width={40} tick={{ fontSize: 12, fill: '#aaa' }} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#222' }} />
                                    <Bar dataKey="count" barSize={15}>
                                        {displayAging.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Box>
                </Box>

                {/* RIGHT: Risk & Stability */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                    {/* Stability Index */}
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" fontWeight={600} color="textSecondary">DECISION STABILITY INDEX</Typography>
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                            <Typography variant="h2" color="primary" sx={{ fontWeight: 700 }}>98.2</Typography>
                            <Typography variant="caption" color="textSecondary">Models performing within expected drift parameters.</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1 }}>
                            <Typography variant="caption">Override Rate: <span style={{ color: '#66bb6a' }}>0.4%</span></Typography>
                            <Typography variant="caption">Drift: <span style={{ color: '#66bb6a' }}>Low</span></Typography>
                        </Box>
                    </Paper>

                    {/* Risk Chart */}
                    <Paper sx={{ p: 2, flex: 1, minHeight: 250 }}>
                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>EXCEPTION RISK PROFILE</Typography>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={displayRisk}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {displayRisk.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                <Tooltip contentStyle={{ backgroundColor: '#222', borderRadius: 4 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>

                    {/* System Health */}
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>SYSTEM HEALTH</Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            {displayHealth.map((item: any, idx: number) => (
                                <Box key={idx} sx={{ bgcolor: 'rgba(255,255,255,0.03)', p: 1, borderRadius: 1 }}>
                                    <Typography variant="caption" display="block" color="textSecondary">{item.label}</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: item.status === 'warning' ? '#ff9800' : '#66bb6a' }}>
                                        {item.value}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Paper>
                </Box>
            </Box>
        </Box>
    );
};
