import React, { useState, useEffect, useMemo } from 'react';
import { Box, Paper, Typography, Button, Chip, Dialog, DialogTitle, DialogContent, TextField, Stack, MenuItem, IconButton, Select, FormControl, InputLabel, Alert } from '@mui/material';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, ColDef, ICellRendererParams } from 'ag-grid-community';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SecurityIcon from '@mui/icons-material/Security';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import LanIcon from '@mui/icons-material/Lan';

// Register AG Grid
ModuleRegistry.registerModules([AllCommunityModule]);

export const AdminControl: React.FC = () => {
    // State
    const [identities, setIdentities] = useState<any[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [openAssign, setOpenAssign] = useState(false);
    const [selectedIdentity, setSelectedIdentity] = useState<any>(null);

    // Form State
    const [newIdentity, setNewIdentity] = useState({ email: '', full_name: '', password: 'Password123!' });
    const [newProfile, setNewProfile] = useState({ system_code: 'RECON', role: 'OPS_ANALYST' });

    // Fetch Data
    const fetchIdentities = async () => {
        try {
            const res = await fetch('http://localhost:8000/admin/iam/identities');
            const data = await res.json();
            setIdentities(data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchIdentities();

        // WebSocket Listener (Bonus: Real-Time)
        const ws = new WebSocket('ws://localhost:8000/ws/admin');
        ws.onmessage = (event) => {
            console.log("IAM Event:", event.data);
            fetchIdentities(); // Refresh on any event
        };

        return () => ws.close();
    }, []);

    // Handlers
    const handleCreateIdentity = async () => {
        await fetch('http://localhost:8000/admin/iam/identities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newIdentity)
        });
        setOpenDialog(false);
        fetchIdentities();
    };

    const handleAssignProfile = async () => {
        if (!selectedIdentity) return;

        await fetch('http://localhost:8000/admin/iam/profiles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                identity_id: selectedIdentity.id,
                ...newProfile
            })
        });
        setOpenAssign(false);
        fetchIdentities();
    };

    // Grid Config
    const columnDefs: ColDef[] = useMemo(() => [
        { field: 'full_name', headerName: 'Identity', pinned: 'left', width: 220, cellStyle: { fontWeight: 'bold' } as any },
        { field: 'email', headerName: 'Email', width: 250 },
        {
            field: 'profiles',
            headerName: 'System Access Profiles',
            flex: 1,
            autoHeight: true,
            cellRenderer: (params: ICellRendererParams) => (
                <Stack direction="row" spacing={1} sx={{ py: 1, flexWrap: 'wrap', gap: 1 }}>
                    {params.value.map((p: any) => (
                        <Chip
                            key={p.id}
                            icon={p.system_code === 'RISK' ? <SecurityIcon sx={{ fontSize: 14 }} /> : <LanIcon sx={{ fontSize: 14 }} />}
                            label={`${p.system_code} : ${p.role}`}
                            size="small"
                            color={p.status === 'ACTIVE' ? 'primary' : 'default'}
                            variant="outlined"
                        />
                    ))}
                    <IconButton size="small" sx={{ border: '1px dashed #555', p: 0.5 }} onClick={() => {
                        setSelectedIdentity(params.data);
                        setOpenAssign(true);
                    }}>
                        <AddIcon fontSize="small" />
                    </IconButton>
                </Stack>
            )
        },
        {
            field: 'status',
            headerName: 'Global Status',
            width: 120,
            cellRenderer: (p: any) => <Chip label={p.value} size="small" color={p.value === 'ACTIVE' ? 'success' : 'error'} />
        }
    ], []);

    return (
        <Box sx={{ p: 3, height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                    <Typography variant="h5" fontWeight={700}>Enterprise Admin Control Plane</Typography>
                    <Typography color="textSecondary">Manage Identities & Multi-System Access Profiles</Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<PersonAddIcon />}
                    onClick={() => setOpenDialog(true)}
                    sx={{ bgcolor: '#00e676', color: '#000', fontWeight: 'bold' }}
                >
                    Provision Identity
                </Button>
            </Box>

            <Box className="ag-theme-alpine-dark" sx={{ flex: 1 }}>
                <AgGridReact
                    rowData={identities}
                    columnDefs={columnDefs}
                    rowHeight={60}
                />
            </Box>

            {/* Create Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>Provision New Enterprise Identity</DialogTitle>
                <DialogContent sx={{ width: 400, pt: 2 }}>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField label="Full Name" fullWidth size="small" onChange={e => setNewIdentity({ ...newIdentity, full_name: e.target.value })} />
                        <TextField label="Corporate Email" fullWidth size="small" onChange={e => setNewIdentity({ ...newIdentity, email: e.target.value })} />
                        <Alert severity="info">Default Password: Password123! (User must reset)</Alert>
                        <Button variant="contained" onClick={handleCreateIdentity}>Provision</Button>
                    </Stack>
                </DialogContent>
            </Dialog>

            {/* Assign Profile Dialog */}
            <Dialog open={openAssign} onClose={() => setOpenAssign(false)}>
                <DialogTitle>Assign System Access Profile</DialogTitle>
                <DialogContent sx={{ width: 400, pt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Target: {selectedIdentity?.full_name}</Typography>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Target System</InputLabel>
                            <Select
                                value={newProfile.system_code}
                                label="Target System"
                                onChange={e => setNewProfile({ ...newProfile, system_code: e.target.value })}
                            >
                                <MenuItem value="RECON">Reconciliation Platform (Core)</MenuItem>
                                <MenuItem value="RISK">Risk & Compliance Engine</MenuItem>
                                <MenuItem value="LEDGER">General Ledger</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth size="small">
                            <InputLabel>Role</InputLabel>
                            <Select
                                value={newProfile.role}
                                label="Role"
                                onChange={e => setNewProfile({ ...newProfile, role: e.target.value })}
                            >
                                <MenuItem value="OPS_ANALYST">Ops Analyst (R/W)</MenuItem>
                                <MenuItem value="VIEWER">Viewer (Read Only)</MenuItem>
                                <MenuItem value="ADMIN">System Admin</MenuItem>
                            </Select>
                        </FormControl>

                        <Button variant="contained" color="secondary" onClick={handleAssignProfile}>Grant Access</Button>
                    </Stack>
                </DialogContent>
            </Dialog>
        </Box>
    );
};
