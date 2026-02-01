import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, TextField, Button, Chip, Stack, Alert, Grid, Step, StepLabel, Stepper, Fade } from '@mui/material';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import SearchIcon from '@mui/icons-material/Search';
import KeyIcon from '@mui/icons-material/Key';
import CodeIcon from '@mui/icons-material/Code';
import DownloadIcon from '@mui/icons-material/Download';
import HistoryIcon from '@mui/icons-material/History';
import { streamService, AdminEvent } from '../../services/StreamService';

// Forensic Ledger Entry
interface LedgerEntry {
    id: string;
    txn_id: string;
    event_type: string;
    stage: string;
    actor: string;
    timestamp: string;
    payload_hash: string;
    previous_hash: string;
    metadata_json: string;
}

export const AdminAudit: React.FC = () => {
    const [txnSearch, setTxnSearch] = useState('');
    const [ledger, setLedger] = useState<LedgerEntry[]>([]);
    const [liveEvents, setLiveEvents] = useState<AdminEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial load: Try to load a demo transaction
    useEffect(() => {
        // Optional: Auto-load a recent one if local storage has one or just leave blank
        handleTrace("TXN-10045"); // Demo default
    }, []);

    // Streaming
    useEffect(() => {
        return streamService.subscribe((event) => {
            if (event.type === 'FORENSIC_EVENT') {
                setLiveEvents(prev => [event, ...prev].slice(0, 5));
            }
        });
    }, []);

    const handleTrace = async (id: string) => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch(`http://localhost:8000/admin/audit/trace/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.length === 0) {
                    setError("No forensic history found for this ID.");
                    setLedger([]);
                } else {
                    setLedger(data);
                }
            } else {
                setError("Trace failed.");
            }
        } catch (e) {
            setError("Network error.");
        } finally {
            setLoading(false);
        }
    };

    const getStageStep = (stage: string) => {
        if (stage.includes("INGEST")) return 0;
        if (stage.includes("PREP") || stage.includes("NORM")) return 1;
        if (stage.includes("SCORING") || stage.includes("DECISION")) return 2;
        if (stage.includes("REVIEW")) return 3;
        if (stage.includes("GOVERNANCE") || stage.includes("FINAL")) return 4;
        return -1;
    };

    const activeStep = ledger.length > 0
        ? Math.max(...ledger.map(l => getStageStep(l.stage))) + 1
        : 0;

    const steps = ['Ingestion', 'Normalization', 'ML Scoring', 'Ops Review', 'Final Decision'];

    return (
        <Box>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
                <FingerprintIcon sx={{ fontSize: 40, color: '#66fcf1' }} />
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffffff' }}>AUDIT & FORENSIC LINEAGE</Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Typography variant="caption" sx={{ color: '#aaa' }}>Immutable Registry • Regulatory Grade</Typography>
                        <Chip label="LIVE REFRESH (5s)" size="small" variant="outlined" sx={{ color: '#00e676', borderColor: '#00e676', height: 20, fontSize: '0.65rem' }} />
                    </Stack>
                </Box>
                <Box sx={{ flexGrow: 1 }} />

                {/* Search Bar */}
                <Paper sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', bgcolor: '#1f2833', border: '1px solid #45a29e', width: 300 }}>
                    <TextField
                        sx={{ ml: 1, flex: 1, input: { color: '#fff' } }}
                        placeholder="Transaction Ref ID (e.g. TXN-10045)"
                        variant="standard"
                        InputProps={{ disableUnderline: true }}
                        value={txnSearch}
                        onChange={(e) => setTxnSearch(e.target.value)}
                    />
                    <Button onClick={() => handleTrace(txnSearch)} sx={{ minWidth: 'auto', p: 1, color: '#45a29e' }}>
                        <SearchIcon />
                    </Button>
                </Paper>
            </Stack>

            {/* Error / Status */}
            {error && <Alert severity="warning" sx={{ mb: 3, bgcolor: '#ff980022', color: '#ff9800' }}>{error}</Alert>}

            {/* MAIN CONTENT GRID */}
            <Grid container spacing={3}>

                {/* 1. DECISION PROVENANCE GRAPH */}
                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 4, bgcolor: '#0b0c10', border: '1px solid #1f2833' }}>
                        <Typography variant="subtitle2" sx={{ color: '#45a29e', mb: 3, textTransform: 'uppercase', letterSpacing: 1 }}>Decision Provenance Graph</Typography>
                        <Stepper activeStep={activeStep} alternativeLabel>
                            {steps.map((label) => (
                                <Step key={label}>
                                    <StepLabel
                                        StepIconProps={{
                                            sx: { '&.Mui-active': { color: '#66fcf1' }, '&.Mui-completed': { color: '#45a29e' } }
                                        }}
                                    >
                                        <span style={{ color: '#c5c6c7' }}>{label}</span>
                                    </StepLabel>
                                </Step>
                            ))}
                        </Stepper>
                    </Paper>
                </Grid>

                {/* 2. DATA SNAPSHOT (READ ONLY) */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 3, bgcolor: '#1f2833', height: '100%', borderTop: '4px solid #ffa000' }}>
                        <Stack direction="row" justifyContent="space-between" mb={2}>
                            <Typography variant="h6" color="white" fontWeight={600}>
                                <KeyIcon sx={{ fontSize: 18, mr: 1, verticalAlign: 'text-bottom' }} />
                                DATA SNAPSHOT (AT DECISION TIME)
                            </Typography>
                            <Chip label="READ-ONLY REPLAY" color="warning" size="small" variant="outlined" />
                        </Stack>

                        <Box sx={{ fontFamily: 'monospace', bgcolor: '#000', p: 2, borderRadius: 1, color: '#00e676', fontSize: '0.85rem', overflowX: 'auto' }}>
                            {ledger.length > 0 ? (
                                <pre>{JSON.stringify(JSON.parse(ledger[ledger.length - 1].metadata_json), null, 2)}</pre>
                            ) : (
                                <Typography color="#666">No snapshot available.</Typography>
                            )}
                        </Box>
                    </Paper>
                </Grid>

                {/* 3. IMMUTABLE AUDIT LOG */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 3, bgcolor: '#1f2833', height: '100%', borderTop: '4px solid #66fcf1' }}>
                        <Stack direction="row" justifyContent="space-between" mb={2}>
                            <Typography variant="h6" color="white" fontWeight={600}>
                                <HistoryIcon sx={{ fontSize: 18, mr: 1, verticalAlign: 'text-bottom' }} />
                                IMMUTABLE AUDIT LOG
                            </Typography>
                        </Stack>

                        <Stack spacing={2}>
                            {ledger.map((entry) => (
                                <Box key={entry.id} sx={{ p: 1.5, borderLeft: '2px solid #66fcf1', bgcolor: 'rgba(102, 252, 241, 0.05)' }}>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography variant="caption" color="#45a29e">{entry.event_type}</Typography>
                                        <Typography variant="caption" color="#aaa">{new Date(entry.timestamp).toLocaleTimeString()}</Typography>
                                    </Stack>
                                    <Typography variant="body2" color="white">{entry.actor}</Typography>
                                    <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#666', display: 'block', mt: 0.5 }}>
                                        HASH: {entry.payload_hash.substring(0, 16)}...
                                    </Typography>
                                </Box>
                            ))}
                            {ledger.length === 0 && <Typography color="textSecondary">Search a Transaction ID to trace history.</Typography>}
                        </Stack>
                    </Paper>
                </Grid>

                {/* 4. LIVE STREAM WIDGET */}
                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 2, bgcolor: '#000', border: '1px dashed #45a29e' }}>
                        <Typography variant="caption" sx={{ color: '#45a29e', mb: 1, display: 'block' }}>LIVE LEDGER EVENTS</Typography>
                        <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 1 }}>
                            {liveEvents.map((evt) => (
                                <Fade in key={evt.id}>
                                    <Chip
                                        icon={<CodeIcon />}
                                        label={`${evt.message} - ${new Date(evt.timestamp).toLocaleTimeString()}`}
                                        variant="outlined"
                                        sx={{ color: '#c5c6c7', borderColor: '#333' }}
                                    />
                                </Fade>
                            ))}
                            {liveEvents.length === 0 && <Typography variant="caption" color="#666">Waiting for events...</Typography>}
                        </Stack>
                    </Paper>
                </Grid>

            </Grid>
        </Box>
    );
};
