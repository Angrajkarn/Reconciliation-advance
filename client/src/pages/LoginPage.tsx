import React, { useState } from 'react';
import { Box, Paper, TextField, Button, Typography, Stack, Container, Alert, CircularProgress } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import SecurityIcon from '@mui/icons-material/Security';
import ShieldIcon from '@mui/icons-material/Shield';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
    const { login, verifyMfa, isLoading, user, availableProfiles, selectProfile, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mfaCode, setMfaCode] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Auth Step
    let step = 'CREDENTIALS';
    if (user && !user.mfaVerified) step = 'MFA';
    if (availableProfiles.length > 0 && !isAuthenticated) step = 'PROFILE_SELECT'; // Pre-Auth State

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const success = await login(email, password);
        if (!success) {
            setError("Invalid credentials or account locked.");
        }
    };

    const handleMfa = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const success = await verifyMfa(mfaCode);
        if (success) {
            if (user?.role === 'ADMIN') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } else {
            setError("Invalid TOTP code.");
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            bgcolor: '#050f1a', // Enterprise Dark Blue
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundImage: 'radial-gradient(circle at 50% 50%, #0a1929 0%, #000 100%)'
        }}>
            <Container maxWidth="xs">
                {/* Security Header */}
                <Stack alignItems="center" spacing={2} sx={{ mb: 4 }}>
                    <ShieldIcon sx={{ fontSize: 50, color: '#42a5f5' }} />
                    <Typography variant="overline" sx={{ letterSpacing: 3, color: '#90caf9', fontWeight: 700 }}>
                        RESONANT <span style={{ color: '#fff' }}>GUARDIAN</span>
                    </Typography>
                </Stack>

                <Paper elevation={24} sx={{
                    p: 4,
                    bgcolor: 'rgba(255,255,255,0.02)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 2
                }}>
                    <Stack spacing={3}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h5" fontWeight={600} color="#fff" gutterBottom>
                                {step === 'CREDENTIALS' ? 'Identity Verification' : 'Security Challenge'}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                {step === 'CREDENTIALS'
                                    ? 'Enter your institutional credentials to proceed.'
                                    : 'Please enter the 6-digit code from your hardware token.'}
                            </Typography>
                        </Box>

                        {error && <Alert severity="error" variant="filled" sx={{ bgcolor: 'rgba(211, 47, 47, 0.2)', border: '1px solid #d32f2f' }}>{error}</Alert>}

                        {step === 'CREDENTIALS' && (
                            <form onSubmit={handleLogin}>
                                <Stack spacing={3}>
                                    <TextField
                                        fullWidth
                                        label="Corporate Email"
                                        variant="outlined"
                                        value={email}
                                        autoComplete="username"
                                        onChange={(e) => setEmail(e.target.value)}
                                        InputProps={{ sx: { color: '#fff' } }}
                                        InputLabelProps={{ sx: { color: '#aaa' } }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                                '&:hover fieldset': { borderColor: '#42a5f5' },
                                            }
                                        }}
                                    />
                                    <TextField
                                        fullWidth
                                        type="password"
                                        label="Password"
                                        variant="outlined"
                                        value={password}
                                        autoComplete="current-password"
                                        onChange={(e) => setPassword(e.target.value)}
                                        InputProps={{ sx: { color: '#fff' } }}
                                        InputLabelProps={{ sx: { color: '#aaa' } }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                                '&:hover fieldset': { borderColor: '#42a5f5' },
                                            }
                                        }}
                                    />
                                    <Button
                                        type="submit"
                                        fullWidth
                                        variant="contained"
                                        disabled={isLoading}
                                        size="large"
                                        sx={{ py: 1.5, fontSize: '1rem', fontWeight: 600 }}
                                    >
                                        {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Authenticate'}
                                    </Button>
                                </Stack>
                            </form>
                        )}

                        {step === 'PROFILE_SELECT' && (
                            <Stack spacing={2}>
                                {availableProfiles.map((p) => (
                                    <Paper
                                        key={p.id}
                                        elevation={3}
                                        sx={{
                                            p: 2,
                                            bgcolor: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            '&:hover': {
                                                bgcolor: 'rgba(66, 165, 245, 0.1)',
                                                transform: 'translateX(4px)',
                                                borderColor: '#42a5f5'
                                            }
                                        }}
                                        onClick={async () => {
                                            const success = await selectProfile(p.id);
                                            if (success) {
                                                // Check role from selected profile or updated user state
                                                navigate('/admin'); // Defaulting to admin for this Elite Bank demo
                                            }
                                        }}
                                    >
                                        <Typography variant="subtitle1" fontWeight={700} color="#fff">
                                            {p.system_name || p.system_code}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            Role: <span style={{ color: '#42a5f5' }}>{p.role}</span> • ID: {p.username}
                                        </Typography>
                                    </Paper>
                                ))}
                            </Stack>
                        )}

                        {step === 'MFA' && (
                            <form onSubmit={handleMfa}>
                                <Stack spacing={3}>
                                    <Alert severity="info" sx={{ bgcolor: 'rgba(2, 136, 209, 0.15)', color: '#29b6f6' }}>
                                        New Device Detected: A verification code is required.
                                    </Alert>
                                    <TextField
                                        fullWidth
                                        placeholder="000 000"
                                        variant="outlined"
                                        value={mfaCode}
                                        onChange={(e) => setMfaCode(e.target.value)}
                                        inputProps={{ style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem', color: '#fff' } }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                                '&:hover fieldset': { borderColor: '#42a5f5' },
                                            }
                                        }}
                                    />
                                    <Button
                                        type="submit"
                                        fullWidth
                                        variant="contained"
                                        size="large"
                                        sx={{ py: 1.5, fontSize: '1rem', fontWeight: 600 }}
                                    >
                                        Verify Session
                                    </Button>
                                </Stack>
                            </form>
                        )}

                        {/* Security Footer */}
                        <Box sx={{ pt: 2, textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <Stack direction="row" justifyContent="center" alignItems="center" spacing={1}>
                                <LockIcon sx={{ fontSize: 14, color: '#666' }} />
                                <Typography variant="caption" color="textSecondary">
                                    256-bit TLS Encrypted • Zero-Trust Mode
                                </Typography>
                            </Stack>
                            <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                                Unauthorised access is prohibited and will be prosecuted.
                            </Typography>
                        </Box>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
};
