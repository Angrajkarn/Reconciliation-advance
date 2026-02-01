import React, { useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Chip, Divider, Stepper, Step, StepLabel, Grid, List, ListItem, ListItemText, Alert, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import KeyIcon from '@mui/icons-material/Key';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import DownloadIcon from '@mui/icons-material/Download';
import HistoryToggleOffIcon from '@mui/icons-material/HistoryToggleOff';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PolicyIcon from '@mui/icons-material/Policy';

// --- MOCK DATA ---
const lineageSteps = [
    { label: 'Ingestion', sub: 'Swift MT103', type: 'SYSTEM' },
    { label: 'Normalization', sub: 'Std. Schema v2', type: 'SYSTEM' },
    { label: 'ML Scoring', sub: 'Model v4.2', type: 'ML' },
    { label: 'Ops Review', sub: 'J. Doe (Maker)', type: 'HUMAN' },
    { label: 'Governance', sub: 'S. Smith (Checker)', type: 'HUMAN' },
    { label: 'Final Decision', sub: 'APPROVED', type: 'SYSTEM' },
];

export const AuditLineage: React.FC = () => {
    const [searchId, setSearchId] = useState('TXN-10045');
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [autoRefresh, setAutoRefresh] = useState(true);

    const fetchLogs = () => {
        const url = searchId ? `http://localhost:8000/audit?resource=${searchId}` : 'http://localhost:8000/audit';
        fetch(url)
            .then(res => res.json())
            .then(data => setAuditLogs(data))
            .catch(err => console.error("Audit Fetch Failed", err));
    };

    // Initial Load & Polling
    React.useEffect(() => {
        fetchLogs();
        const interval = setInterval(() => {
            if (autoRefresh) fetchLogs();
        }, 5000); // 5s Real-time poll
        return () => clearInterval(interval);
    }, [searchId, autoRefresh]);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
            {/* 1. Audit Context Header (Search) */}
            <Paper sx={{ p: 2, bgcolor: '#121212', border: '1px solid #333' }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <FingerprintIcon sx={{ fontSize: 40, color: '#90caf9' }} />
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" fontWeight={600}>AUDIT & FORENSIC LINEAGE</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" color="textSecondary">Immutable Registry • Regulatory Grade</Typography>
                            <Chip label={autoRefresh ? "LIVE REFRESH (5s)" : "PAUSED"} color={autoRefresh ? "success" : "default"} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.6rem' }} />
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            size="small"
                            label="Transaction Ref ID"
                            value={searchId}
                            onChange={(e) => setSearchId(e.target.value)}
                            sx={{ width: 250 }}
                            InputProps={{ sx: { fontFamily: 'monospace' } }}
                        />
                        <Button variant="contained" startIcon={<SearchIcon />} onClick={fetchLogs}>Trace</Button>
                    </Box>
                </Box>
                <Divider sx={{ my: 2, borderColor: '#333' }} />
                <Box sx={{ display: 'flex', gap: 4 }}>
                    <Box>
                        <Typography variant="caption" color="textSecondary" display="block">Business Date</Typography>
                        <Typography variant="body2" fontWeight="bold">{new Date().toISOString().split('T')[0]}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="textSecondary" display="block">Policy Version</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PolicyIcon sx={{ fontSize: 14, color: '#bbb' }} />
                            <Typography variant="body2" fontFamily="monospace">POL-2025-v2.1</Typography>
                        </Box>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="textSecondary" display="block">Model Version</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <SmartToyIcon sx={{ fontSize: 14, color: '#bbb' }} />
                            <Typography variant="body2" fontFamily="monospace">Use_Case_Recon_v4.2</Typography>
                        </Box>
                    </Box>
                    <Box sx={{ ml: 'auto' }}>
                        <Button variant="outlined" size="small" startIcon={<DownloadIcon />} color="secondary">Export Evidence Pack</Button>
                    </Box>
                </Box>
            </Paper>

            {/* 2. Visual Lineage Flow */}
            <Paper sx={{ p: 4, overflowX: 'auto' }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mb: 3 }}>DECISION PROVENANCE GRAPH</Typography>
                <Stepper alternativeLabel activeStep={5}>
                    {lineageSteps.map((step, index) => (
                        <Step key={step.label}>
                            <StepLabel
                                StepIconProps={{
                                    sx: {
                                        color: step.type === 'ML' ? '#ffa726' : step.type === 'HUMAN' ? '#90caf9' : '#66bb6a',
                                        fontSize: 28
                                    }
                                }}
                            >
                                <Typography variant="caption" display="block" fontWeight={600} color="textPrimary">{step.label}</Typography>
                                <Typography variant="caption" color="textSecondary">{step.sub}</Typography>
                            </StepLabel>
                        </Step>
                    ))}
                </Stepper>
            </Paper>

            {/* 3. Forensic Details (Split View) */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, flex: 1 }}>

                {/* Left: Forensic Snapshot */}
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle2" fontWeight={600}><KeyIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'text-bottom' }} /> DATA SNAPSHOT (AT DECISION TIME)</Typography>
                        <Chip label="READ-ONLY REPLAY" size="small" variant="outlined" color="warning" />
                    </Box>

                    <Box sx={{ flex: 1, bgcolor: '#0f0f0f', p: 2, borderRadius: 1, border: '1px solid #333', fontFamily: 'monospace', fontSize: '0.8rem', overflow: 'auto' }}>
                        <Typography color="textSecondary" gutterBottom>## RAW INGEST (SOURCE A)</Typography>
                        <Typography color="success.main">TXN_ID: "{searchId || 'Global'}"</Typography>
                        <Typography color="success.main">AMT: 50,000.00</Typography>
                        <Typography color="success.main">CCY: "USD"</Typography>
                        <Typography color="success.main">VAL_DATE: "{new Date().toISOString().split('T')[0]}"</Typography>

                        <Divider sx={{ my: 2, borderColor: '#444' }} />

                        <Typography color="textSecondary" gutterBottom>## NORMALIZATION & ENRICHMENT</Typography>
                        <Typography>norm_amt: 50000.0</Typography>
                        <Typography>norm_ccy: "USD"</Typography>
                        <Typography>counterparty_risk: "LOW" (Enriched via RefData)</Typography>

                        <Divider sx={{ my: 2, borderColor: '#444' }} />

                        <Typography color="textSecondary" gutterBottom>## ML FEATURES</Typography>
                        <Typography>desc_similarity: 0.92</Typography>
                        <Typography>amt_delta: 0.0</Typography>
                        <Typography>date_delta: 0</Typography>
                    </Box>
                </Paper>

                {/* Right: Immutable Audit Log */}
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HistoryToggleOffIcon fontSize="small" /> IMMUTABLE AUDIT LOG
                    </Typography>

                    <List dense sx={{ flex: 1, overflow: 'auto', maxHeight: 400 }}>
                        {auditLogs.length === 0 && <Box sx={{ p: 2, color: '#666' }}>No audit history found for this identifier.</Box>}
                        {auditLogs.map((log, i) => (
                            <ListItem key={i} alignItems="flex-start" sx={{ borderLeft: '2px solid #555', ml: 1, mb: 2, pl: 2 }}>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="caption" color="primary" fontWeight="bold">{log.event_type}</Typography>
                                            <Typography variant="caption" color="textSecondary" fontFamily="monospace">{new Date(log.timestamp).toLocaleTimeString()}</Typography>
                                        </Box>
                                    }
                                    secondary={
                                        <React.Fragment>
                                            <Typography variant="caption" component="span" display="block" color="textPrimary" sx={{ mt: 0.5 }}>
                                                Actor: {log.actor_id}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                Resource: {log.resource} | Outcome: {log.outcome}
                                            </Typography>
                                        </React.Fragment>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            </Box>
        </Box>
    );
};
