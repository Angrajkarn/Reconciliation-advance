import React, { useState, useMemo, useCallback } from 'react';
import { Box, Paper, Typography, Chip, Button, Drawer, Tabs, Tab, IconButton, Divider, TextField, Stack, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { AgGridReact } from 'ag-grid-react';
// import 'ag-grid-community/styles/ag-grid.css'; // New versions might differ, but standard is this
// import 'ag-grid-community/styles/ag-theme-alpine.css'; // We will use a custom dark theme or balham
import { ModuleRegistry, AllCommunityModule, ColDef, ICellRendererParams } from 'ag-grid-community';
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HistoryIcon from '@mui/icons-material/History';
import GavelIcon from '@mui/icons-material/Gavel';
import AnalyticsIcon from '@mui/icons-material/Analytics';

import { DrawerTabPanel } from '../components/DrawerTabPanel';

// Register AG Grid Modules
ModuleRegistry.registerModules([AllCommunityModule]);

export const TransactionWorkbench: React.FC = () => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedTxn, setSelectedTxn] = useState<any>(null);
    const [tabValue, setTabValue] = useState(0);
    const [rowData, setRowData] = useState<any[]>([]);

    // --- FILTER STATE ---
    const [filters, setFilters] = useState({
        riskHigh: true, // Default ON based on screenshot
        statusException: true,
        slaRisk: true,
        sourceSwift: false,
        amountHigh: false
    });

    const fetchTransactions = useCallback(() => {
        const params = new URLSearchParams();
        if (filters.statusException) params.append('status', 'EXCEPTION');
        if (filters.riskHigh) params.append('min_risk', '80');
        if (filters.sourceSwift) params.append('source', 'SWIFT');
        if (filters.amountHigh) params.append('min_amount', '10000');
        if (filters.slaRisk) params.append('sla_risk', 'true');

        fetch(`http://localhost:8000/transactions?${params.toString()}`)
            .then(res => res.json())
            .then(data => setRowData(data))
            .catch(err => console.error("Failed to load transactions", err));
    }, [filters]);

    React.useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const toggleFilter = (key: keyof typeof filters) => {
        setFilters(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const [detailLoading, setDetailLoading] = useState(false);
    const [detailData, setDetailData] = useState<any>(null);

    const fetchDetails = useCallback(async (id: string) => {
        setDetailLoading(true);
        setDetailData(null); // Clear previous data to show loading state
        try {
            const res = await fetch(`http://localhost:8000/transactions/${id}/details`);
            if (!res.ok) throw new Error("Failed to fetch details");
            const data = await res.json();
            setDetailData(data);
        } catch (err) {
            console.error(err);
        } finally {
            setDetailLoading(false);
        }
    }, []);

    const onRowClicked = useCallback((event: any) => {
        setSelectedTxn(event.data);
        setDrawerOpen(true);
        fetchDetails(event.data.id); // Trigger real-time fetch
    }, [fetchDetails]);

    const closeDrawer = () => {
        setDrawerOpen(false);
        setDetailData(null);
    };

    // --- AG GRID DEFINITIONS ---
    // define columnDefs here
    const columnDefs: ColDef[] = useMemo(() => [
        { field: 'id', headerName: 'Ref ID', pinned: 'left', width: 130, cellStyle: { fontWeight: 'bold', color: '#90caf9', cursor: 'pointer' } },
        { field: 'source', headerName: 'Source Sys', width: 140 },
        {
            field: 'amount',
            headerName: 'Amount',
            type: 'rightAligned',
            width: 140,
            valueFormatter: (p) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(Number(p.value))
        },
        { field: 'currency', headerName: 'Ccy', width: 80 },
        {
            field: 'match_confidence', // snake_case from backend
            headerName: 'Match %',
            width: 120,
            cellRenderer: (params: ICellRendererParams) => (
                <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                    <Box sx={{ width: '100%', mr: 1, bgcolor: '#333', borderRadius: 1, height: 6 }}>
                        <Box sx={{ width: `${params.value}%`, bgcolor: params.value > 90 ? '#66bb6a' : params.value > 70 ? '#ffa726' : '#f44336', height: '100%', borderRadius: 1 }} />
                    </Box>
                    <Typography variant="caption">{Math.round(params.value)}%</Typography>
                </Box>
            )
        },
        {
            field: 'risk_score', // snake_case
            headerName: 'Risk',
            width: 100,
            cellRenderer: (params: ICellRendererParams) => {
                const color = params.value > 80 ? '#f44336' : params.value > 50 ? '#ffa726' : '#66bb6a';
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', color: color, fontWeight: 'bold' }}>
                        {params.value}
                    </Box>
                )
            }
        },
        {
            field: 'created_at',
            headerName: 'SLA Time',
            width: 120,
            cellRenderer: (params: ICellRendererParams) => {
                if (!params.value) return <span />;
                // Calculate SLA (Mock T+4 hours window)
                const created = new Date(params.value);
                const deadline = new Date(created.getTime() + 4 * 60 * 60 * 1000); // +4 hours
                const now = new Date();
                const diffMs = deadline.getTime() - now.getTime();

                // Expired
                if (diffMs < 0) {
                    return <Chip label="BREACHED" size="small" color="error" variant="filled" sx={{ height: 20, fontSize: '0.65rem' }} />;
                }

                const diffHrs = Math.floor(diffMs / 3600000);
                const diffMins = Math.round(((diffMs % 3600000) / 60000));

                return (
                    <Chip
                        icon={<AccessTimeIcon sx={{ fontSize: 13 }} />}
                        label={`${diffHrs}h ${diffMins}m`}
                        size="small"
                        variant="outlined"
                        color={diffHrs < 1 ? 'warning' : 'default'}
                        sx={{ borderColor: '#555', borderRadius: 1, height: 24, fontSize: '0.75rem' }}
                    />
                );
            }
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 160,
            cellRenderer: (params: ICellRendererParams) => {
                const color = params.value === 'AUTO_RECONCILED' ? 'success' : params.value === 'EXCEPTION' ? 'error' : 'warning';
                return <Chip label={params.value ? params.value.replace('_', ' ') : 'PENDING'} color={color as any} size="small" sx={{ fontWeight: 600, height: 24, fontSize: '0.7rem' }} />;
            }
        },
        {
            field: 'created_at',
            headerName: 'Timestamp',
            width: 180,
            sort: 'desc',
            valueFormatter: (p: any) => p.value ? new Date(p.value).toLocaleString() : ''
        },
    ], []);

    const defaultColDef = useMemo(() => ({
        sortable: true,
        filter: true,
        resizable: true,
        cellStyle: { display: 'flex', alignItems: 'center', borderRight: '1px solid rgba(255,255,255,0.05)' }
    }), []);

    const handleAction = async (newStatus: 'AUTO_RECONCILED' | 'REJECTED') => {
        if (!selectedTxn) return;

        try {
            const res = await fetch(`http://localhost:8000/transactions/${selectedTxn.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: newStatus,
                    reason_code: 'R2', // Defaulting for simple flow
                    justification: 'Manual Decision from Workbench'
                })
            });

            if (res.ok) {
                // Refresh Grid
                const updatedRowData = rowData.map(row =>
                    row.id === selectedTxn.id ? { ...row, status: newStatus } : row
                );
                setRowData(updatedRowData);
                setDrawerOpen(false);
                alert(`Transaction ${selectedTxn.id} marked as ${newStatus}`);
            }
        } catch (err) {
            console.error("Governance Action Failed", err);
        }
    };

    return (
        <Box sx={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
            {/* 1. Header & Filters */}
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)', bgcolor: '#121212' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>TRANSACTION WORKBENCH</Typography>
                        <Typography variant="caption" color="textSecondary">Business Date: {new Date().toISOString().split('T')[0]} • Env: PRODUCTION</Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                        <Button startIcon={<FilterListIcon />} variant="outlined" size="small">Advanced Filter</Button>
                        <Button variant="contained" size="small">Export CSV</Button>
                    </Stack>
                </Box>

                {/* Global Filter Chips */}
                <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
                    <Chip
                        label="Risk: HIGH"
                        onClick={() => toggleFilter('riskHigh')}
                        color={filters.riskHigh ? "error" : "default"}
                        variant={filters.riskHigh ? "filled" : "outlined"}
                        onDelete={filters.riskHigh ? () => toggleFilter('riskHigh') : undefined}
                    />
                    <Chip
                        label="Status: EXCEPTION"
                        onClick={() => toggleFilter('statusException')}
                        color={filters.statusException ? "error" : "default"}
                        variant={filters.statusException ? "filled" : "outlined"}
                        onDelete={filters.statusException ? () => toggleFilter('statusException') : undefined}
                    />
                    <Chip
                        label="SLA: < 4h (Risk)"
                        onClick={() => toggleFilter('slaRisk')}
                        color={filters.slaRisk ? "warning" : "default"}
                        variant={filters.slaRisk ? "filled" : "outlined"}
                        onDelete={filters.slaRisk ? () => toggleFilter('slaRisk') : undefined}
                    />
                    <Chip
                        label="Source: SWIFT"
                        onClick={() => toggleFilter('sourceSwift')}
                        color={filters.sourceSwift ? "primary" : "default"}
                        variant={filters.sourceSwift ? "filled" : "outlined"}
                        onDelete={filters.sourceSwift ? () => toggleFilter('sourceSwift') : undefined}
                    />
                    <Chip
                        label="Amount: > 10k"
                        onClick={() => toggleFilter('amountHigh')}
                        color={filters.amountHigh ? "info" : "default"}
                        variant={filters.amountHigh ? "filled" : "outlined"}
                        onDelete={filters.amountHigh ? () => toggleFilter('amountHigh') : undefined}
                    />
                </Stack>
            </Box>

            {/* 2. Main Grid */}
            <Box className="ag-theme-alpine-dark" sx={{ flex: 1, width: '100%' }}>
                {/* Note: In a real app we'd load CSS properly. For specific theme support ensure index.css has imports or use style injection */}
                <AgGridReact
                    rowData={rowData}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    rowHeight={40}
                    headerHeight={40}
                    rowSelection="multiple"
                    onRowClicked={onRowClicked}
                    loadingOverlayComponent={() => <Box sx={{ p: 3 }}>Loading Enterprise Data...</Box>}
                />
            </Box>

            {/* 3. Footer */}
            <Box sx={{ p: 1, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'flex-end', gap: 3 }}>
                <Typography variant="caption">Total Rows: {rowData.length}</Typography>
                <Typography variant="caption">Selected: {selectedTxn ? 1 : 0}</Typography>
                <Typography variant="caption">Server Latency: 45ms</Typography>
            </Box>

            {/* 4. Right Drawer */}
            <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={closeDrawer}
                PaperProps={{ sx: { width: 500, bgcolor: '#1e1e1e', borderLeft: '1px solid #333' } }}
            >
                {selectedTxn && (
                    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        {/* Drawer Header - Always Visible */}
                        <Box sx={{ p: 2, borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Typography variant="subtitle1" fontWeight={700}>{selectedTxn.id}</Typography>
                                <Chip label={selectedTxn.status} size="small" color={selectedTxn.status === 'EXCEPTION' ? 'error' : 'success'} sx={{ mt: 0.5, height: 20, fontSize: '0.65rem' }} />
                            </Box>
                            <IconButton onClick={closeDrawer}><CloseIcon /></IconButton>
                        </Box>

                        {/* Loading State */}
                        {detailLoading && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                                <Typography color="textSecondary">Loading Real-Time match...</Typography>
                            </Box>
                        )}

                        {/* Error or No Data State */}
                        {!detailLoading && (!detailData || !detailData.transaction) && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', flex: 1, p: 3, textAlign: 'center' }}>
                                <WarningAmberIcon color="error" sx={{ fontSize: 40, mb: 2 }} />
                                <Typography color="error">Failed to load details</Typography>
                                <Button onClick={() => fetchDetails(selectedTxn.id)} sx={{ mt: 2 }} size="small" variant="outlined">Retry</Button>
                            </Box>
                        )}

                        {/* Succcess State */}
                        {!detailLoading && detailData && detailData.transaction && (
                            <>
                                {/* Drawer Tabs */}
                                <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} variant="fullWidth" sx={{ borderBottom: '1px solid #333', minHeight: 40 }}>
                                    <Tab icon={<AnalyticsIcon sx={{ fontSize: 16 }} />} label="Summary" sx={{ minHeight: 40, fontSize: '0.75rem' }} />
                                    <Tab icon={<WarningAmberIcon sx={{ fontSize: 16 }} />} label="Explain" sx={{ minHeight: 40, fontSize: '0.75rem' }} />
                                    <Tab icon={<HistoryIcon sx={{ fontSize: 16 }} />} label="History" sx={{ minHeight: 40, fontSize: '0.75rem' }} />
                                    <Tab icon={<GavelIcon sx={{ fontSize: 16 }} />} label="Action" sx={{ minHeight: 40, fontSize: '0.75rem' }} />
                                </Tabs>

                                {/* Tab Content */}
                                <Box sx={{ flex: 1, overflow: 'auto' }}>
                                    <DrawerTabPanel value={tabValue} index={0}>
                                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>TRANSACTION DETAILS</Typography>
                                        <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)' }}>
                                            <Stack spacing={1}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="body2" color="textSecondary">Source A:</Typography>
                                                    <Typography variant="body2">{detailData.transaction.source}</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="body2" color="textSecondary">Source B:</Typography>
                                                    <Typography variant="body2">{detailData.candidate?.source || 'NO MATCH'}</Typography>
                                                </Box>
                                                <Divider sx={{ my: 1 }} />
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="body2" color="textSecondary">Amount A:</Typography>
                                                    <Typography variant="body2">{detailData.transaction.amount} {detailData.transaction.currency}</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="body2" color="textSecondary">Amount B:</Typography>
                                                    <Typography variant="body2" sx={{ color: 'error.main' }}>
                                                        {detailData.candidate ? detailData.candidate.amount : '---'} {detailData.transaction.currency}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="body2" color="textSecondary">Delta:</Typography>
                                                    <Typography variant="body2" color="error" fontWeight="bold">{detailData.delta} {detailData.transaction.currency}</Typography>
                                                </Box>
                                            </Stack>
                                        </Paper>
                                    </DrawerTabPanel>

                                    <DrawerTabPanel value={tabValue} index={1}>
                                        <Typography variant="subtitle2" gutterBottom>ML EXPLAINABILITY</Typography>
                                        <Typography variant="caption" color="textSecondary" paragraph>Why did the model assign a Risk Score of {selectedTxn.risk_score}?</Typography>

                                        <Paper variant="outlined" sx={{ p: 1, mb: 2, borderColor: '#333' }}>
                                            {detailData.explainability.map((reason: string, i: number) => (
                                                <Typography key={i} variant="caption" color="textSecondary" display="block">• {reason}</Typography>
                                            ))}
                                        </Paper>
                                    </DrawerTabPanel>

                                    <DrawerTabPanel value={tabValue} index={3}>
                                        <Typography variant="subtitle2" gutterBottom>GOVERNANCE ACTIONS</Typography>
                                        <Typography variant="caption" color="textSecondary" paragraph>Your Role: CHECKER (Level 2)</Typography>

                                        <Stack spacing={2}>
                                            <TextField label="Decision Justification" multiline rows={3} fullWidth placeholder="Required for Audit Trail..." size="small" />
                                            <FormControl fullWidth size="small">
                                                <InputLabel>Reason Code</InputLabel>
                                                <Select label="Reason Code" defaultValue="">
                                                    <MenuItem value="R1">Technical Glitch</MenuItem>
                                                    <MenuItem value="R2">Client Authorized</MenuItem>
                                                    <MenuItem value="R3">Mapping Error</MenuItem>
                                                </Select>
                                            </FormControl>

                                            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                                <Button variant="contained" color="success" fullWidth onClick={() => handleAction('AUTO_RECONCILED')}>Approve Match</Button>
                                                <Button variant="outlined" color="error" fullWidth onClick={() => handleAction('REJECTED')}>Reject</Button>
                                            </Box>

                                            <Divider />
                                            <Button variant="text" color="warning">Escalate to Compliance</Button>
                                        </Stack>
                                    </DrawerTabPanel>
                                </Box>
                            </>
                        )}
                    </Box>
                )}
            </Drawer>
        </Box>
    );
};
