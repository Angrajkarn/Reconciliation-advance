import React, { useState, useMemo, useCallback } from 'react';
import { Box, Paper, Typography, Chip, Button, Drawer, Tabs, Tab, IconButton, Divider, TextField, Stack, FormControl, InputLabel, Select, MenuItem, Alert } from '@mui/material';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, ColDef, ICellRendererParams } from 'ag-grid-community';
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import GavelIcon from '@mui/icons-material/Gavel';
import HistoryIcon from '@mui/icons-material/History';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import AssignmentIcon from '@mui/icons-material/Assignment';
import WarningIcon from '@mui/icons-material/Warning';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

import { DrawerTabPanel } from '../components/DrawerTabPanel';

// Register AG Grid Modules
ModuleRegistry.registerModules([AllCommunityModule]);


// --- MOCK DATA GENERATOR ---
// --- MOCK DATA REMOVED (Fetching from Backend) ---

export const GovernanceConsole: React.FC = () => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [tabValue, setTabValue] = useState(0);
    const [rowData, setRowData] = useState<any[]>([]);

    // --- FILTER STATE ---
    const [filters, setFilters] = useState({
        scopeMyQueue: true,
        statusPending: true,
        riskCritical: true,
        typeOverride: false
    });

    const fetchTickets = useCallback(() => {
        const params = new URLSearchParams();
        // Map UI filters to Backend Params
        if (filters.statusPending) params.append('status', 'PENDING');
        if (filters.riskCritical) params.append('min_risk', '90'); // 90+ for Critical

        fetch(`http://localhost:8000/governance/tickets?${params.toString()}`)
            .then(res => res.json())
            .then(data => {
                const formatted = data.map((t: any) => ({
                    id: `GOV-${t.id.split('-')[1] || '000'}`,
                    txnRef: t.id,
                    type: t.status === 'EXCEPTION' ? 'ESCALATION' : 'OVERRIDE',
                    risk: t.risk_score > 80 ? 'CRITICAL' : 'HIGH',
                    originalDecision: 'UNMATCHED',
                    proposedDecision: 'MATCHED',
                    maker: 'SYSTEM',
                    checker: '-',
                    slaRemaining: '4h 30m',
                    status: t.status === 'EXCEPTION' || t.status === 'OPS_REVIEW' ? 'PENDING_APPROVAL' : t.status,
                }));
                setRowData(formatted);
            })
            .catch(err => console.error("Governance Fetch Failed", err));
    }, [filters]);

    React.useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    const toggleFilter = (key: keyof typeof filters) => {
        setFilters(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const [detailData, setDetailData] = useState<any>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [history, setHistory] = useState<any[]>([]);

    const onRowClicked = useCallback(async (event: any) => {
        setSelectedItem(event.data);
        setDrawerOpen(true);
        setDetailLoading(true);
        setDetailData(null);
        setHistory([]); // Reset history

        try {
            // Parallel Fetch: Details + History
            const [detailsRes, historyRes] = await Promise.all([
                fetch(`http://localhost:8000/transactions/${event.data.txnRef}/details`),
                fetch(`http://localhost:8000/governance/tickets/${event.data.txnRef}/history`)
            ]);

            if (detailsRes.ok) {
                const data = await detailsRes.json();
                setDetailData(data);
            }
            if (historyRes.ok) {
                const hist = await historyRes.json();
                setHistory(hist);
            }
        } catch (e) {
            console.error("Failed to load details/history", e);
        } finally {
            setDetailLoading(false);
        }
    }, []);

    const closeDrawer = () => setDrawerOpen(false);

    const [reviewComment, setReviewComment] = useState('');

    const handleAction = async (decision: 'APPROVE' | 'REJECT' | 'ESCALATE') => {
        if (!selectedItem) return;

        try {
            const res = await fetch(`http://localhost:8000/governance/tickets/${selectedItem.txnRef}/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: decision,
                    comments: reviewComment || (decision === 'ESCALATE' ? "Escalated to Compliance" : "Manual decision via Governance Console")
                })
            });

            if (res.ok) {
                const data = await res.json();

                // 1. Update Drawer State to "Finalized" view
                setSelectedItem((prev: any) => ({
                    ...prev,
                    status: data.new_state
                }));

                // 2. Refresh Audit Trail & Details
                const [detailsRes, historyRes] = await Promise.all([
                    fetch(`http://localhost:8000/transactions/${selectedItem.txnRef}/details`),
                    fetch(`http://localhost:8000/governance/tickets/${selectedItem.txnRef}/history`)
                ]);

                if (detailsRes.ok) setDetailData(await detailsRes.json());
                if (historyRes.ok) setHistory(await historyRes.json());

                // 3. Refresh Grid (Item might disappear from Pending list, which is correct)
                fetchTickets();

                // Clear comment
                setReviewComment('');

                // Optional: Switch to "Decision" tab to show result if not already there
                if (tabValue !== 3) setTabValue(3);
            }
        } catch (e) {
            console.error("Governance Action Failed", e);
        }
    };

    // Helper to find determiner
    const finalizer = useMemo(() => {
        if (!history || history.length === 0) return selectedItem?.checker || 'System';
        const lastAction = history.find((h: any) => h.event_type.includes('GOVERNANCE'));
        return lastAction ? lastAction.actor_id : 'Unknown';
    }, [history, selectedItem]);

    // --- AG GRID DEFINITIONS ---
    const columnDefs: ColDef[] = useMemo(() => [
        { field: 'id', headerName: 'Ticket Ref', pinned: 'left', width: 120, cellStyle: { fontWeight: 'bold', color: '#90caf9', cursor: 'pointer' } as any },
        { field: 'txnRef', headerName: 'Transaction', width: 120 },
        {
            field: 'type',
            headerName: 'Decision Type',
            width: 140,
            cellRenderer: (params: ICellRendererParams) => (
                <Chip label={params.value} size="small" variant="outlined" sx={{ height: 24, fontSize: '0.7rem', borderColor: '#777' }} />
            )
        },
        {
            field: 'risk',
            headerName: 'Risk Level',
            width: 120,
            cellRenderer: (params: ICellRendererParams) => {
                const color = params.value === 'CRITICAL' ? '#f44336' : '#ffa726';
                return <Box sx={{ color: color, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {params.value === 'CRITICAL' && <WarningIcon sx={{ fontSize: 14 }} />} {params.value}
                </Box>;
            }
        },
        { field: 'originalDecision', headerName: 'Original', width: 120, cellStyle: { color: '#aaa' } as any },
        { field: 'proposedDecision', headerName: 'Proposed', width: 120, cellStyle: { color: '#fff', fontWeight: 'bold' } as any },
        { field: 'maker', headerName: 'Maker', width: 110 },
        { field: 'checker', headerName: 'Checker', width: 110 },
        {
            field: 'status',
            headerName: 'Approval Status',
            width: 160,
            cellRenderer: (params: ICellRendererParams) => {
                const color = params.value === 'APPROVED' ? 'success' : params.value === 'REJECTED' ? 'error' : 'warning';
                return <Chip label={params.value.replace('_', ' ')} color={color as any} size="small" sx={{ fontWeight: 600, height: 24, fontSize: '0.7rem' }} />;
            }
        },
        { field: 'slaRemaining', headerName: 'SLA', width: 100 },
    ], []);

    const defaultColDef = useMemo(() => ({
        sortable: true,
        filter: true,
        resizable: true,
        cellStyle: { display: 'flex', alignItems: 'center', borderRight: '1px solid rgba(255,255,255,0.05)' }
    }), []);

    return (
        <Box sx={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
            {/* 1. Governance Header */}
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)', bgcolor: '#121212' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>GOVERNANCE & APPROVALS</Typography>
                        <Typography variant="caption" color="textSecondary">Active Policies: V2.4 (2025) • Role: SENIOR_RISK_MANAGER</Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                        <Button startIcon={<FilterListIcon />} variant="outlined" size="small">Audit Filters</Button>
                        <Button variant="contained" size="small" color="secondary">Compliance Export</Button>
                    </Stack>
                </Box>

                {/* Global Filters */}
                <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
                    <Chip
                        label="Scope: MY_QUEUE"
                        onClick={() => toggleFilter('scopeMyQueue')}
                        color={filters.scopeMyQueue ? "primary" : "default"}
                        variant={filters.scopeMyQueue ? "filled" : "outlined"}
                        onDelete={filters.scopeMyQueue ? () => toggleFilter('scopeMyQueue') : undefined}
                    />
                    <Chip
                        label="Status: PENDING"
                        onClick={() => toggleFilter('statusPending')}
                        color={filters.statusPending ? "warning" : "default"}
                        variant={filters.statusPending ? "filled" : "outlined"}
                        onDelete={filters.statusPending ? () => toggleFilter('statusPending') : undefined}
                    />
                    <Chip
                        label="Risk: CRITICAL"
                        onClick={() => toggleFilter('riskCritical')}
                        color={filters.riskCritical ? "error" : "default"}
                        variant={filters.riskCritical ? "filled" : "outlined"}
                        onDelete={filters.riskCritical ? () => toggleFilter('riskCritical') : undefined}
                    />
                    <Chip
                        label="Type: OVERRIDE"
                        onClick={() => toggleFilter('typeOverride')}
                        color={filters.typeOverride ? "default" : "default"}
                        variant={filters.typeOverride ? "filled" : "outlined"}
                        onDelete={filters.typeOverride ? () => toggleFilter('typeOverride') : undefined}
                    />
                </Stack>
            </Box>

            {/* 2. Main Grid */}
            <Box className="ag-theme-alpine-dark" sx={{ flex: 1, width: '100%' }}>
                <AgGridReact
                    rowData={rowData}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    rowHeight={40}
                    headerHeight={40}
                    onRowClicked={onRowClicked}
                    loadingOverlayComponent={() => <Box sx={{ p: 3 }}>Loading Governance Tickets...</Box>}
                />
            </Box>

            {/* 3. Footer */}
            <Box sx={{ p: 1, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'flex-end', gap: 3 }}>
                <Typography variant="caption">Pending My Action: 12</Typography>
                <Typography variant="caption">Total Tickets: 250</Typography>
                <Typography variant="caption">Audit Log: SYNCED</Typography>
            </Box>

            {/* 4. Right Drawer */}
            <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={closeDrawer}
                PaperProps={{ sx: { width: 500, bgcolor: '#1e1e1e', borderLeft: '1px solid #333' } }}
            >
                {selectedItem && (
                    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        {/* Header */}
                        <Box sx={{ p: 2, borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Typography variant="subtitle1" fontWeight={700}>{selectedItem.id}</Typography>
                                <Typography variant="caption" color="textSecondary">Created by {selectedItem.maker}</Typography>
                            </Box>
                            <IconButton onClick={closeDrawer}><CloseIcon /></IconButton>
                        </Box>

                        {/* Tabs */}
                        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} variant="fullWidth" sx={{ borderBottom: '1px solid #333', minHeight: 40 }}>
                            <Tab icon={<AssignmentIcon sx={{ fontSize: 16 }} />} label="Summary" sx={{ minHeight: 40, fontSize: '0.75rem' }} />
                            <Tab icon={<FactCheckIcon sx={{ fontSize: 16 }} />} label="Evidence" sx={{ minHeight: 40, fontSize: '0.75rem' }} />
                            <Tab icon={<HistoryIcon sx={{ fontSize: 16 }} />} label="Chain" sx={{ minHeight: 40, fontSize: '0.75rem' }} />
                            <Tab icon={<GavelIcon sx={{ fontSize: 16 }} />} label="Decision" sx={{ minHeight: 40, fontSize: '0.75rem' }} />
                        </Tabs>

                        {/* Content */}
                        <Box sx={{ flex: 1, overflow: 'auto' }}>
                            {/* Summary Tab */}
                            <DrawerTabPanel value={tabValue} index={0}>
                                <Typography variant="subtitle2" gutterBottom>DECISION CONTEXT</Typography>
                                {detailLoading ? (
                                    <Box sx={{ p: 3, textAlign: 'center' }}><Typography color="textSecondary">Loading Real-Time Context...</Typography></Box>
                                ) : (detailData ? (
                                    <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', mb: 2 }}>
                                        <Stack spacing={1}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="textSecondary">Transaction:</Typography>
                                                <Typography variant="body2">{detailData.transaction.id}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="textSecondary">System Status:</Typography>
                                                <Typography variant="body2" color="error">{detailData.transaction.status}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="textSecondary">AI Recommendation:</Typography>
                                                <Typography variant="body2" color={detailData.candidate ? "success.main" : "warning.main"} fontWeight="bold">
                                                    {detailData.candidate ? "MATCH AVAILABLE" : "NO MATCH"}
                                                </Typography>
                                            </Box>
                                            {detailData.candidate && (
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="body2" color="textSecondary">Confidence:</Typography>
                                                    <Typography variant="body2">{Math.round(detailData.candidate.score)}%</Typography>
                                                </Box>
                                            )}
                                            <Divider />
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="textSecondary">Risk Score:</Typography>
                                                <Chip label={detailData.transaction.risk_score} size="small" color={detailData.transaction.risk_score > 80 ? 'error' : 'warning'} />
                                            </Box>
                                        </Stack>
                                    </Paper>
                                ) : (
                                    <Alert severity="error">Failed to load decision context.</Alert>
                                ))}

                                <Alert severity="warning" sx={{ mb: 2 }}>
                                    High Risk Item: Requires Level-2 Manager Approval or Compliance Sign-off.
                                </Alert>
                            </DrawerTabPanel>

                            {/* Evidence Tab */}
                            <DrawerTabPanel value={tabValue} index={1}>
                                <Typography variant="subtitle2" gutterBottom>AI EXPLAINABILITY</Typography>
                                {detailData && detailData.explainability ? (
                                    <Paper variant="outlined" sx={{ p: 2, mb: 2, borderColor: '#444' }}>
                                        {detailData.explainability.map((reason: string, i: number) => (
                                            <Typography key={i} variant="caption" display="block" color="textSecondary" gutterBottom>• {reason}</Typography>
                                        ))}
                                        {detailData.delta !== 0 && (
                                            <Typography variant="caption" display="block" color="error" sx={{ mt: 1 }}>
                                                • Monetary Discrepancy: {detailData.delta} {detailData.transaction.currency}
                                            </Typography>
                                        )}
                                    </Paper>
                                ) : <Typography variant="caption">Loading evidence...</Typography>}

                                <Typography variant="subtitle2" gutterBottom>MAKER JUSTIFICATION</Typography>
                                <Paper variant="outlined" sx={{ p: 2, borderColor: '#444' }}>
                                    <Typography variant="caption" color="textSecondary" display="block" gutterBottom>Reason Code: CLIENT_CONFIRMED (RC-102)</Typography>
                                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                        "Client confirmed via email (attached to case #9921) that the discrepancy is due to a lifting fee. Transaction is valid."
                                    </Typography>
                                </Paper>
                            </DrawerTabPanel>

                            {/* Chain Tab */}
                            <DrawerTabPanel value={tabValue} index={2}>
                                <Typography variant="subtitle2" gutterBottom>AUDIT TRAIL</Typography>
                                {history.length > 0 ? (
                                    <Box sx={{ position: 'relative', pl: 2, borderLeft: '2px solid #333', ml: 1 }}>
                                        {history.map((log, i) => (
                                            <Box key={i} sx={{ mb: 3, position: 'relative' }}>
                                                <Box sx={{ position: 'absolute', left: -21, top: 0, width: 10, height: 10, borderRadius: '50%', bgcolor: i === 0 ? '#4caf50' : '#555' }} />
                                                <Typography variant="caption" display="block" color="textSecondary">{new Date(log.timestamp).toLocaleString()}</Typography>
                                                <Typography variant="body2" fontWeight={500} color={log.event_type.includes('FAIL') ? 'error' : 'primary'}>{log.actor_id}</Typography>
                                                <Typography variant="body2">{log.event_type} - {log.outcome}</Typography>
                                                {log.details && <Typography variant="caption" color="textSecondary">{log.details}</Typography>}
                                            </Box>
                                        ))}
                                    </Box>
                                ) : (
                                    <Typography variant="caption" color="textSecondary">No audit history found.</Typography>
                                )}
                            </DrawerTabPanel>

                            {/* Decision Tab (Role Aware) */}
                            <DrawerTabPanel value={tabValue} index={3}>
                                {selectedItem.status === 'PENDING_APPROVAL' ? (
                                    <>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                            <VerifiedUserIcon color="primary" />
                                            <Typography variant="subtitle1">Your Role: CHECKER</Typography>
                                        </Box>
                                        <Typography variant="body2" paragraph>
                                            You are approving a <b>{selectedItem.risk}</b> risk override proposed by {selectedItem.maker}. This action will be logged.
                                        </Typography>

                                        <Stack spacing={2}>
                                            <TextField
                                                label="Review Comments"
                                                multiline
                                                rows={3}
                                                fullWidth
                                                placeholder="Mandatory for rejection..."
                                                size="small"
                                                value={reviewComment}
                                                onChange={(e) => setReviewComment(e.target.value)}
                                            />

                                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                                <Button
                                                    variant="contained"
                                                    color="success"
                                                    fullWidth
                                                    size="large"
                                                    startIcon={<FactCheckIcon />}
                                                    onClick={() => handleAction('APPROVE')}
                                                >
                                                    Approve & Commit
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    fullWidth
                                                    size="large"
                                                    onClick={() => handleAction('REJECT')}
                                                >
                                                    Reject
                                                </Button>
                                            </Box>

                                            <Button
                                                variant="text"
                                                color="secondary"
                                                onClick={() => handleAction('ESCALATE')}
                                            >
                                                Escalate to Compliance Head
                                            </Button>
                                        </Stack>
                                    </>
                                ) : (
                                    <Box sx={{ textAlign: 'center', py: 4, opacity: 0.7 }}>
                                        <VerifiedUserIcon sx={{ fontSize: 40, color: selectedItem.status === 'APPROVED' ? 'success.main' : 'error.main', mb: 1 }} />
                                        <Typography variant="h6">{selectedItem.status}</Typography>
                                        <Typography variant="caption">Finalized by {finalizer}</Typography>
                                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>Decision locked in immutable ledger.</Typography>
                                    </Box>
                                )}
                            </DrawerTabPanel>
                        </Box>
                    </Box>
                )}
            </Drawer>
        </Box>
    );
};
