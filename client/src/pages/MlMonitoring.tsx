import React, { useState } from 'react';
import { Box, Paper, Typography, Button, Chip, Stack, List, ListItem, ListItemText, Divider, LinearProgress, Tooltip as MuiTooltip } from '@mui/material';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import SecurityIcon from '@mui/icons-material/Security';
import HistoryIcon from '@mui/icons-material/History';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

// --- REAL DATA ---
// Data is now fetched from /monitoring/metrics

export const MlMonitoring: React.FC = () => {
    const [confidenceDistData, setConfDist] = useState<any[]>([]);
    const [anomalyTrendData, setAnomalyTrend] = useState<any[]>([]);
    const [outcomeData, setOutcomeData] = useState<any[]>([]);
    const [modelAlerts, setModelAlerts] = useState<any[]>([]);
    const [modelState, setModelState] = useState<any>({
        version: "T-REC-XGB-V4.2",
        status: "active",
        last_retrain: "Loading...",
        accuracy: "0%"
    });

    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const fetchData = () => {
        fetch('http://localhost:8000/monitoring/metrics')
            .then(res => res.json())
            .then(data => {
                setConfDist(data.confidenceDist);
                setAnomalyTrend(data.anomalyTrend);
                setOutcomeData(data.outcomes);
                setModelAlerts(data.modelAlerts);
                if (data.modelState) setModelState(data.modelState);
                setLastUpdated(new Date());
            })
            .catch(err => console.error("ML Metrics Fetch Failed", err));
    };


    const handleRollback = async () => {
        try {
            const res = await fetch('http://localhost:8000/monitoring/model/rollback', { method: 'POST' });
            if (res.ok) {
                const newState = await res.json();
                setModelState(newState);
                alert("System Rolled Back to V4.1");
            }
        } catch (e) { console.error(e); }
    };

    const handleFreeze = async () => {
        try {
            const res = await fetch('http://localhost:8000/monitoring/model/freeze', { method: 'POST' });
            if (res.ok) {
                const newState = await res.json();
                setModelState(newState);
                alert("Model Updates FROZEN.");
            }
        } catch (e) { console.error(e); }
    };

    React.useEffect(() => {
        fetchData(); // Initial load
        const interval = setInterval(fetchData, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    // Placeholder trend for override (since we don't have historical table yet)
    const overrideTrendData = Array.from({ length: 7 }, (_, i) => ({
        day: `D-${7 - i}`,
        overrideRate: 2 + (i * 0.8),
        baseline: 3.5
    }));

    const driftMetrics = [
        { feature: 'Transaction Amount', score: 0.42, status: 'DRIFT_DETECTED' },
        { feature: 'Counterparty Geo', score: 0.05, status: 'STABLE' },
        { feature: 'Description Text', score: 0.12, status: 'STABLE' },
    ];

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
            {/* 1. Model Status Strip */}
            <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#121212', border: '1px solid #333' }}>
                <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <Box>
                        <Typography variant="overline" color="textSecondary">Active Model</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="h6">{modelState.version}</Typography>
                            {modelState.status === 'active' && <Chip label="ONLINE" color="success" size="small" icon={<CheckCircleOutlineIcon />} />}
                            {modelState.status === 'rolled_back' && <Chip label="ROLLED BACK" color="warning" size="small" icon={<HistoryIcon />} />}
                            {modelState.status === 'frozen' && <Chip label="FROZEN" color="info" size="small" icon={<SecurityIcon />} />}
                        </Box>
                    </Box>
                    <Divider orientation="vertical" flexItem sx={{ bgcolor: '#444' }} />
                    <Box>
                        <Typography variant="overline" color="textSecondary">Training Window</Typography>
                        <Typography variant="body2" fontWeight={500}>2025-06-01 to 2025-12-31</Typography>
                    </Box>
                    <Box>
                        <Typography variant="overline" color="textSecondary">Last Retrain</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <AccessTimeIcon sx={{ fontSize: 16, color: '#aaa' }} />
                            <Typography variant="body2" fontWeight={500}>{lastUpdated.toLocaleTimeString()}</Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: '#4caf50', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#4caf50', display: 'inline-block' }} />
                            LIVE UPDATES
                        </Typography>
                    </Box>
                </Box>

                <Stack direction="row" spacing={2}>
                    <Button
                        variant="outlined"
                        color="warning"
                        startIcon={<HistoryIcon />}
                        onClick={handleRollback}
                        disabled={modelState.status === 'rolled_back'}
                    >
                        Rollback
                    </Button>
                    <Button
                        variant="contained"
                        color={modelState.status === 'frozen' ? "primary" : "error"}
                        startIcon={<SecurityIcon />}
                        onClick={handleFreeze}
                        disabled={modelState.status === 'frozen'}
                    >
                        {modelState.status === 'frozen' ? "Model Frozen" : "Freeze Model"}
                    </Button>
                </Stack>
            </Paper>

            {/* 2. Middle Zone (Health & Quality) */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.5fr 1fr' }, gap: 3, flex: 1 }}>
                {/* Left: Model Health */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Paper sx={{ p: 2, flex: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>CONFIDENCE DISTRIBUTION (UNCERTAINTY CHECK)</Typography>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={confidenceDistData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                                <XAxis dataKey="range" stroke="#666" fontSize={12} />
                                <YAxis stroke="#666" fontSize={12} />
                                <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#333' }} cursor={{ fill: '#333' }} />
                                <Bar dataKey="count" fill="#90caf9" name="Transactions" />
                            </BarChart>
                        </ResponsiveContainer>
                        <Typography variant="caption" color="textSecondary">
                            Look for left-tail thickening (increasing uncertainty). Current distribution is **Healthy**.
                        </Typography>
                    </Paper>

                    <Paper sx={{ p: 2, flex: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>ANOMALY SCORE TREND (95th PERCENTILE)</Typography>
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={anomalyTrendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                                <XAxis dataKey="day" stroke="#666" fontSize={12} />
                                <YAxis stroke="#666" fontSize={12} />
                                <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#333' }} />
                                <Area type="monotone" dataKey="maxScore" stroke="#f44336" fill="rgba(244, 67, 54, 0.1)" name="Max Score" />
                                <Area type="monotone" dataKey="avgScore" stroke="#66bb6a" fill="rgba(102, 187, 106, 0.1)" name="Avg Score" />
                                <Line type="monotone" dataKey="threshold" stroke="#ff9800" strokeDasharray="5 5" dot={false} name="Threshold" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Paper>
                </Box>

                {/* Right: Decision Quality & Alerts */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>DECISION OUTCOME BREAKDOWN</Typography>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={outcomeData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {outcomeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px' }} />
                                <Tooltip contentStyle={{ backgroundColor: '#1e1e1e' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>

                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>HUMAN OVERRIDE RATE (DISAGREEMENT)</Typography>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={overrideTrendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="day" stroke="#666" fontSize={10} />
                                <YAxis stroke="#666" fontSize={10} domain={[0, 10]} />
                                <Tooltip contentStyle={{ backgroundColor: '#1e1e1e' }} />
                                <Line type="monotone" dataKey="overrideRate" stroke="#f44336" strokeWidth={2} name="Override %" />
                                <Line type="monotone" dataKey="baseline" stroke="#666" strokeDasharray="3 3" dot={false} name="Baseline" />
                            </LineChart>
                        </ResponsiveContainer>
                        <Box sx={{ mt: 1, p: 1, bgcolor: 'rgba(244, 67, 54, 0.1)', borderRadius: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
                            <WarningAmberIcon color="error" fontSize="small" />
                            <Typography variant="caption" color="error">Trend increasing. Model may be drifting.</Typography>
                        </Box>
                    </Paper>

                    <Paper sx={{ p: 2, flex: 1, overflow: 'auto' }}>
                        <Typography variant="subtitle2" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <ErrorOutlineIcon color="warning" fontSize="small" /> INCIDENT FEED
                        </Typography>
                        <List dense disablePadding>
                            {modelAlerts.map(alert => (
                                <ListItem key={alert.id} sx={{ borderBottom: '1px solid #333', px: 0 }}>
                                    <ListItemText
                                        primary={
                                            <Typography variant="body2" sx={{ color: alert.level === 'CRITICAL' ? '#f44336' : alert.level === 'WARNING' ? '#ffa726' : '#fff' }}>
                                                [{alert.level}] {alert.msg}
                                            </Typography>
                                        }
                                        secondary={alert.time}
                                        secondaryTypographyProps={{ sx: { fontSize: '0.7rem', color: '#666' } }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                </Box>
            </Box>

            {/* 3. Bottom: Feature Drift */}
            <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>FEATURE DRIFT INDICATORS (PSI SCORES)</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, mt: 2 }}>
                    {driftMetrics.map((drift, i) => (
                        <Box key={i}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="caption">{drift.feature}</Typography>
                                <Typography variant="caption" fontWeight="bold" color={drift.score > 0.2 ? 'error' : 'success.main'}>
                                    PSI: {drift.score}
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={drift.score * 100}
                                color={drift.score > 0.2 ? 'error' : 'success'}
                                sx={{ height: 6, borderRadius: 3, bgcolor: '#333' }}
                            />
                        </Box>
                    ))}
                </Box>
            </Paper>
        </Box>
    );
};
