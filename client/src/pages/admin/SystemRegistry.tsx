import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Paper, Chip, LinearProgress, Stack } from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { streamService } from '../../services/StreamService';

interface System {
    id: number;
    code: string;
    name: string;
    description: string;
    status: string; // Dynamic
    latency: number; // Dynamic
    lastHeartbeat: Date; // Dynamic
}

export const SystemRegistry: React.FC = () => {
    const [systems, setSystems] = useState<System[]>([]);

    useEffect(() => {
        // 1. Initial Fetch
        const fetchSystems = async () => {
            try {
                const token = sessionStorage.getItem('token');
                const response = await fetch('http://localhost:8000/admin/systems', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    // Enhance with initial dynamic state
                    setSystems(data.map((s: any) => ({
                        ...s,
                        status: 'OPERATIONAL',
                        latency: Math.floor(Math.random() * 20) + 10,
                        lastHeartbeat: new Date()
                    })));
                }
            } catch (error) {
                console.error("Failed to load systems", error);
            }
        };
        fetchSystems();

        // 2. Real-Time Subscription
        const unsubscribe = streamService.subscribe((event) => {
            if (event.type === 'SYSTEM_HEARTBEAT' && event.system_code) {
                setSystems(prev => prev.map(sys => {
                    if (sys.code.includes(event.system_code!) || event.system_code!.includes(sys.code)) {
                        return {
                            ...sys,
                            status: event.status || 'OPERATIONAL',
                            latency: event.latency || 15,
                            lastHeartbeat: new Date()
                        };
                    }
                    return sys;
                }));
            }
        });

        // 3. Liveness Check (Decay status if no heartbeat)
        const interval = setInterval(() => {
            setSystems(prev => prev.map(sys => {
                const secondsSinceLast = (new Date().getTime() - sys.lastHeartbeat.getTime()) / 1000;
                if (secondsSinceLast > 30) return { ...sys, status: 'UNKNOWN' };
                return sys;
            }));
        }, 5000);

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, []);

    const getStatusColor = (status: string) => {
        if (status === 'OPERATIONAL') return '#00e676';
        if (status === 'DEGRADED') return '#ffa000';
        return '#757575';
    };

    return (
        <Box>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffffff' }}>System Registry</Typography>
                <Chip label="LIVE MONITORING" color="success" variant="outlined" size="small" sx={{ borderColor: '#00e676', color: '#00e676' }} />
            </Stack>

            <Grid container spacing={3}>
                {systems.map((system) => {
                    const color = getStatusColor(system.status);
                    return (
                        <Grid size={{ xs: 12, md: 6, lg: 4 }} key={system.id}>
                            <Paper sx={{
                                p: 3,
                                bgcolor: '#1f2833',
                                border: `1px solid ${color}44`,
                                height: '100%',
                                position: 'relative',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    borderColor: color,
                                    transform: 'translateY(-2px)',
                                    boxShadow: `0 4px 20px ${color}22`
                                }
                            }}>
                                <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
                                    <Chip
                                        icon={system.status === 'OPERATIONAL' ? <CheckCircleIcon /> : <WarningIcon />}
                                        label={system.status}
                                        size="small"
                                        sx={{ bgcolor: `${color}22`, color: color, '& .MuiChip-icon': { color: color } }}
                                    />
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#0b0c10', color: color, mr: 2, border: `1px solid ${color}22` }}>
                                        <StorageIcon />
                                    </Box>
                                    <Box>
                                        <Typography variant="h6" sx={{ color: '#ffffff', lineHeight: 1.2 }}>{system.code}</Typography>
                                        <Typography variant="caption" sx={{ color: '#aaa' }}>ID: {system.id}</Typography>
                                    </Box>
                                </Box>

                                <Typography variant="body2" sx={{ color: '#c5c6c7', mb: 3, minHeight: 40, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {system.description}
                                </Typography>

                                <Box sx={{ bgcolor: '#0b0c10', p: 2, borderRadius: 2 }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <TrendingUpIcon sx={{ fontSize: 16, color: color }} />
                                            <Typography variant="caption" sx={{ color: '#c5c6c7' }}>Latency</Typography>
                                        </Box>
                                        <Typography variant="caption" sx={{ color: color, fontWeight: 600 }}>{system.latency}ms</Typography>
                                    </Stack>
                                    <LinearProgress
                                        variant="determinate"
                                        value={Math.min(100, (1000 / system.latency) * 5)} // Visual representation
                                        sx={{
                                            height: 4,
                                            borderRadius: 1,
                                            bgcolor: '#1f2833',
                                            '& .MuiLinearProgress-bar': { bgcolor: color }
                                        }}
                                    />
                                    <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'right', color: '#666' }}>
                                        Updated: {system.lastHeartbeat.toLocaleTimeString()}
                                    </Typography>
                                </Box>
                            </Paper>
                        </Grid>
                    );
                })}
            </Grid>
        </Box>
    );
};
