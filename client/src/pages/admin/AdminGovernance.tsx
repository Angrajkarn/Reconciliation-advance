import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button, Stack } from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';

interface Transaction {
    id: string;
    amount: number;
    currency: string;
    status: string;
    description: string;
}

export const AdminGovernance: React.FC = () => {
    const [exceptions, setExceptions] = useState<Transaction[]>([]);

    useEffect(() => {
        const fetchExceptions = async () => {
            try {
                const token = sessionStorage.getItem('token');
                const response = await fetch('http://localhost:8000/admin/exceptions', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setExceptions(data);
                }
            } catch (error) {
                console.error("Failed to load exceptions", error);
            }
        };
        fetchExceptions();
    }, []);

    return (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffffff', mb: 3 }}>Governance & Approvals</Typography>

            <Paper sx={{ p: 2, bgcolor: 'rgba(255, 160, 0, 0.1)', border: '1px solid #ffa000', mb: 3 }}>
                <Typography variant="body2" sx={{ color: '#ffa000' }}>
                    <strong>ACTION REQUIRED:</strong> You have {exceptions.length} items in the Governance Queue requiring immediate review.
                </Typography>
            </Paper>

            <TableContainer component={Paper} sx={{ bgcolor: '#1f2833', border: '1px solid #45a29e' }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#0b0c10' }}>
                        <TableRow>
                            <TableCell sx={{ color: '#45a29e' }}>TXN ID</TableCell>
                            <TableCell sx={{ color: '#45a29e' }}>AMOUNT</TableCell>
                            <TableCell sx={{ color: '#45a29e' }}>DESCRIPTION</TableCell>
                            <TableCell sx={{ color: '#45a29e' }}>STATUS</TableCell>
                            <TableCell sx={{ color: '#45a29e' }}>DECISION</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {exceptions.map((txn) => (
                            <TableRow key={txn.id} sx={{ '&:hover': { bgcolor: 'rgba(102, 252, 241, 0.05)' } }}>
                                <TableCell sx={{ color: '#c5c6c7', fontFamily: 'monospace' }}>{txn.id.slice(0, 8)}...</TableCell>
                                <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>{txn.amount.toLocaleString()} {txn.currency}</TableCell>
                                <TableCell sx={{ color: '#c5c6c7' }}>{txn.description}</TableCell>
                                <TableCell>
                                    <Chip label={txn.status} size="small" sx={{ bgcolor: '#ffa00022', color: '#ffa000' }} />
                                </TableCell>
                                <TableCell>
                                    <Stack direction="row" spacing={1}>
                                        <Button size="small" variant="outlined" color="success" startIcon={<CheckCircleOutlineIcon />}>Approve</Button>
                                        <Button size="small" variant="outlined" color="error" startIcon={<CancelOutlinedIcon />}>Reject</Button>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                        {exceptions.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4, color: '#666' }}>
                                    No pending approvals. System running optimally.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};
