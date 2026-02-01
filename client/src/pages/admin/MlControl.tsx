import React, { useState } from 'react';
import { Box, Typography, Grid, Paper, Switch, FormControlLabel, Slider, Button, Stack, Chip } from '@mui/material';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

export const MlControl: React.FC = () => {
    const [threshold, setThreshold] = useState<number>(85);
    const [modelActive, setModelActive] = useState(true);
    const [status, setStatus] = useState<any>(null);

    React.useEffect(() => {
        const fetchStatus = async () => {
            try {
                const token = sessionStorage.getItem('token');
                const response = await fetch('http://localhost:8000/admin/ml/status', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) setStatus(await response.json());
            } catch (e) { console.error(e); }
        };
        fetchStatus();
    }, []);

    const lastTrained = status?.last_trained ? new Date(status.last_trained).toLocaleString() : 'Never';
    const isActive = status?.active ?? false;

    return (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffffff', mb: 3 }}>ML & Decision Control</Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 4, bgcolor: '#1f2833', border: '1px solid #45a29e' }}>
                        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                            <ModelTrainingIcon sx={{ fontSize: 40, color: isActive ? '#00e676' : '#666' }} />
                            <Box>
                                <Typography variant="h6" sx={{ color: '#ffffff' }}>Fraud Detection Model {status?.version}</Typography>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography variant="caption" sx={{ color: isActive ? '#00e676' : '#ff0000' }}>
                                        {isActive ? 'RUNNING' : 'OFFLINE'}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#aaa' }}>•</Typography>
                                    <Typography variant="caption" sx={{ color: '#c5c6c7' }}>Last Trained: {lastTrained}</Typography>
                                </Stack>
                            </Box>
                        </Stack>

                        <Box sx={{ mb: 4 }}>
                            <Typography variant="body2" sx={{ color: '#c5c6c7', mb: 1 }}>Confidence Threshold ({threshold}%)</Typography>
                            <Slider
                                value={threshold}
                                onChange={(_, v) => setThreshold(v as number)}
                                sx={{ color: '#66fcf1' }}
                                valueLabelDisplay="auto"
                            />
                            <Typography variant="caption" sx={{ color: '#aaa' }}>
                                Transactions below this score will be flagged for manual review.
                            </Typography>
                        </Box>

                        <FormControlLabel
                            control={<Switch checked={modelActive} onChange={(e) => setModelActive(e.target.checked)} color="success" />}
                            label={<Typography sx={{ color: '#c5c6c7' }}>Model Active</Typography>}
                        />
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 4, bgcolor: '#1f2833', border: '1px solid #45a29e', height: '100%' }}>
                        <Typography variant="h6" sx={{ color: '#ffffff', mb: 3 }}>Model Operations</Typography>
                        <Stack spacing={2}>
                            <Button variant="outlined" color="primary" startIcon={<RestartAltIcon />} fullWidth>
                                Retrain on Latest Batch
                            </Button>
                            <Button variant="outlined" color="warning" startIcon={<StopIcon />} fullWidth>
                                Emergency Halt
                            </Button>
                        </Stack>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};
