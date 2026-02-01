import React, { useState } from 'react';
import { Box, Paper, Typography, Button, TextField, Select, MenuItem, Slider, Grid, Stack, Alert, FormControl, InputLabel, Divider, Card, CardContent, LinearProgress } from '@mui/material';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ReferenceLine } from 'recharts';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SaveIcon from '@mui/icons-material/Save';
import GetAppIcon from '@mui/icons-material/GetApp';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ThunderstormIcon from '@mui/icons-material/Thunderstorm';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SpeedIcon from '@mui/icons-material/Speed';

// --- MOCK SCENARIO DATA ---
const baselineData = [
    { time: '09:00', backlog: 120, capacity: 500, slaBreach: 0 },
    { time: '10:00', backlog: 240, capacity: 500, slaBreach: 0 },
    { time: '11:00', backlog: 380, capacity: 500, slaBreach: 2 },
    { time: '12:00', backlog: 150, capacity: 500, slaBreach: 0 },
    { time: '13:00', backlog: 180, capacity: 500, slaBreach: 0 },
];

// Dynamically generate stress data based on multiplier
const generateStressData = (multiplier: number) => {
    return baselineData.map(d => ({
        ...d,
        backlog: Math.floor(d.backlog * multiplier),
        slaBreach: Math.floor(d.backlog * multiplier > 500 ? (d.backlog * multiplier - 500) * 0.2 : 0)
    }));
}

const impactDistribution = [
    { status: 'Auto-Reconciled', baseline: 85, stress: 45 },
    { status: 'Ops Review', baseline: 12, stress: 35 },
    { status: 'High Risk', baseline: 3, stress: 20 },
];

export const StressTesting: React.FC = () => {
    const [scenario, setScenario] = useState('VOLUME_SURGE');
    const [volumeMult, setVolumeMult] = useState<number>(2);
    const [isRunning, setIsRunning] = useState(false);
    const [resultsVisible, setResultsVisible] = useState(false);

    // Derived state
    const stressData = generateStressData(volumeMult);
    const maxBacklog = Math.max(...stressData.map(d => d.backlog));
    const totalBreaches = stressData.reduce((acc, curr) => acc + curr.slaBreach, 0);

    const handleRun = () => {
        setIsRunning(true);
        setTimeout(() => {
            setIsRunning(false);
            setResultsVisible(true);
        }, 1500);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>

            {/* 1. Scenario Definition Panel */}
            <Paper sx={{ p: 3, border: '1px solid #333', bgcolor: '#121212' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h6" fontWeight={600} display="flex" alignItems="center" gap={1}>
                        <ThunderstormIcon color="error" /> STRESS TEST SCENARIO BUILDER
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                        Environment: SIMULATION_SANDBOX (Isolated) • Model: v4.2
                    </Typography>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '3fr 5fr 4fr' }, gap: 4 }}>
                    <Box>
                        <FormControl fullWidth size="small">
                            <InputLabel>Scenario Type</InputLabel>
                            <Select value={scenario} label="Scenario Type" onChange={(e) => setScenario(e.target.value)}>
                                <MenuItem value="VOLUME_SURGE">Volume Surge (Flash Crash)</MenuItem>
                                <MenuItem value="FX_VOLATILITY">FX Volatility Spike</MenuItem>
                                <MenuItem value="OPS_CAPACITY">Ops Capacity Reduction</MenuItem>
                                <MenuItem value="CYBER_EVENT">Late Arrival / Cyber Event</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>

                    <Box>
                        <Typography gutterBottom variant="caption">Transaction Volume Multiplier (x{volumeMult})</Typography>
                        <Slider
                            value={volumeMult}
                            min={1}
                            max={10}
                            step={0.5}
                            onChange={(_, v) => setVolumeMult(v as number)}
                            valueLabelDisplay="auto"
                            marks={[{ value: 1, label: '1x' }, { value: 5, label: '5x' }, { value: 10, label: '10x' }]}
                        />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', alignItems: 'center' }}>
                        <Button variant="outlined" startIcon={<SaveIcon />}>Save Config</Button>
                        <Button
                            variant="contained"
                            color="error"
                            size="large"
                            startIcon={<PlayArrowIcon />}
                            onClick={handleRun}
                            disabled={isRunning}
                        >
                            {isRunning ? 'Simulating...' : 'Execute Simulation'}
                        </Button>
                    </Box>
                </Box>

                {isRunning && <LinearProgress color="error" sx={{ mt: 3 }} />}
            </Paper>

            {resultsVisible ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, flex: 1 }}>

                    {/* 2. System Impact (Left) */}
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>IMPACT: OPS QUEUE & SLA BREACHES</Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={stressData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                                <XAxis dataKey="time" stroke="#666" fontSize={12} />
                                <YAxis stroke="#666" fontSize={12} />
                                <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#333' }} />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                                <Area type="monotone" dataKey="backlog" stroke="#f44336" fill="rgba(244, 67, 54, 0.2)" name="Backlog (Stress)" />
                                <ReferenceLine y={500} label="Max Capacity" stroke="white" strokeDasharray="3 3" />
                            </AreaChart>
                        </ResponsiveContainer>
                        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                            <Alert severity="error" sx={{ flex: 1, bgcolor: 'rgba(211, 47, 47, 0.1)' }}>
                                Peak Backlog: {maxBacklog} Items ({(maxBacklog / 500 * 100).toFixed(0)}% Capacity)
                            </Alert>
                            <Alert severity="warning" sx={{ flex: 1, bgcolor: 'rgba(237, 108, 2, 0.1)' }}>
                                Projected SLA Breaches: {totalBreaches}
                            </Alert>
                        </Box>
                    </Paper>

                    {/* 3. Decision Stability (Right) */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Paper sx={{ p: 2, flex: 1 }}>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>RECONCILIATION OUTCOME SHIFT</Typography>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={impactDistribution} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#333" />
                                    <XAxis type="number" stroke="#666" fontSize={10} />
                                    <YAxis dataKey="status" type="category" stroke="#666" fontSize={12} width={100} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e1e1e' }} cursor={{ fill: 'transparent' }} />
                                    <Legend />
                                    <Bar dataKey="baseline" name="Baseline %" fill="#666" barSize={15} />
                                    <Bar dataKey="stress" name="Stress %" fill="#f44336" barSize={15} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Paper>

                        <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>DECISION STABILITY INDEX</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, py: 2 }}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h3" color="success.main" fontWeight={700}>98</Typography>
                                    <Typography variant="caption" color="textSecondary">Baseline</Typography>
                                </Box>
                                <TrendingUpIcon sx={{ fontSize: 40, color: '#666' }} />
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h3" color="error.main" fontWeight={700}>64</Typography>
                                    <Typography variant="caption" color="textSecondary">Stress Scenario</Typography>
                                </Box>
                            </Box>
                            <Typography variant="body2" color="textSecondary" align="center">
                                Model confidence degrades significantly under {volumeMult}x volume load.
                            </Typography>
                        </Paper>

                        <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                            <Button variant="contained" startIcon={<GetAppIcon />} color="primary">Export Regulatory Pack</Button>
                        </Box>
                    </Box>
                </Box>
            ) : (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #444', borderRadius: 2 }}>
                    <Box sx={{ textAlign: 'center', opacity: 0.5 }}>
                        <SpeedIcon sx={{ fontSize: 60, mb: 2 }} />
                        <Typography variant="h6">Ready for Simulation</Typography>
                        <Typography variant="body2">Configure parameters and click Execute to view impact analysis.</Typography>
                    </Box>
                </Box>
            )}
        </Box>
    );
};
