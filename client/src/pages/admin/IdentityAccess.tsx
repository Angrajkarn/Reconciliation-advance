import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, CircularProgress } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';

interface User {
    id: number;
    email: string;
    is_active: boolean;
    roles: { name: string }[];
}

export const IdentityAccess: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = sessionStorage.getItem('token');
                const response = await fetch('http://localhost:8000/admin/users', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setUsers(data);
                }
            } catch (error) {
                console.error("Failed to load users", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress sx={{ color: '#66fcf1' }} /></Box>;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffffff' }}>Identity & Access</Typography>
                <Chip icon={<PersonAddIcon />} label="Invite User" variant="outlined" sx={{ color: '#66fcf1', borderColor: '#45a29e', '& .MuiChip-icon': { color: '#66fcf1' } }} onClick={() => alert('Invite feature coming soon')} />
            </Box>

            <TableContainer component={Paper} sx={{ bgcolor: '#1f2833', border: '1px solid #45a29e' }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#0b0c10' }}>
                        <TableRow>
                            <TableCell sx={{ color: '#45a29e' }}>ID</TableCell>
                            <TableCell sx={{ color: '#45a29e' }}>EMAIL</TableCell>
                            <TableCell sx={{ color: '#45a29e' }}>ROLES</TableCell>
                            <TableCell sx={{ color: '#45a29e' }}>STATUS</TableCell>
                            <TableCell sx={{ color: '#45a29e' }}>ACTIONS</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id} sx={{ '&:hover': { bgcolor: 'rgba(102, 252, 241, 0.05)' } }}>
                                <TableCell sx={{ color: '#c5c6c7' }}>{user.id}</TableCell>
                                <TableCell sx={{ color: '#ffffff', fontWeight: 600 }}>{user.email}</TableCell>
                                <TableCell>
                                    {user.roles.map(r => (
                                        <Chip key={r.name} label={r.name} size="small" sx={{ bgcolor: '#45a29e22', color: '#66fcf1', mr: 1 }} />
                                    ))}
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={user.is_active ? "ACTIVE" : "INACTIVE"}
                                        size="small"
                                        sx={{
                                            bgcolor: user.is_active ? '#00e67622' : '#ff000022',
                                            color: user.is_active ? '#00e676' : '#ff0000'
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <IconButton size="small" sx={{ color: '#c5c6c7' }}><EditIcon fontSize="small" /></IconButton>
                                    <IconButton size="small" sx={{ color: '#ff0000' }}><BlockIcon fontSize="small" /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};
