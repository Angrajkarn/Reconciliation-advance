import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Container, Paper, Stack, Chip, keyframes, GlobalStyles } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import HubIcon from '@mui/icons-material/Hub';
import MemoryIcon from '@mui/icons-material/Memory';
import TerminalIcon from '@mui/icons-material/Terminal';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import BoltIcon from '@mui/icons-material/Bolt';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import ShieldIcon from '@mui/icons-material/Shield';

// --- ADVANCED ANIMATIONS ---
const float = keyframes`
  0% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(1deg); }
  100% { transform: translateY(0px) rotate(0deg); }
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(144, 202, 249, 0.4); }
  70% { box-shadow: 0 0 0 20px rgba(144, 202, 249, 0); }
  100% { box-shadow: 0 0 0 0 rgba(144, 202, 249, 0); }
`;

const scanline = keyframes`
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
`;

const marquee = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
`;

// --- STYLED COMPONENTS ---

const HolographicCard = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
    <Box sx={{
        position: 'relative',
        p: 4,
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        borderRadius: 4,
        border: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        animation: `${float} 6s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        '&:hover': {
            transform: 'scale(1.02) translateY(-10px)',
            background: 'rgba(255, 255, 255, 0.07)',
            borderColor: 'rgba(66, 165, 245, 0.5)',
            boxShadow: '0 0 50px rgba(66, 165, 245, 0.2)',
            '& .glow': { opacity: 1 }
        }
    }}>
        <Box className="glow" sx={{
            position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
            background: 'radial-gradient(circle, rgba(66,165,245,0.1) 0%, rgba(0,0,0,0) 60%)',
            opacity: 0, transition: 'opacity 0.4s ease', pointerEvents: 'none'
        }} />
        {children}
    </Box>
);

const SectionHeading = ({ label, title, subtitle }: { label: string, title: string, subtitle: string }) => (
    <Box sx={{ mb: 8, textAlign: 'center', position: 'relative', zIndex: 2 }}>
        <Typography variant="overline" sx={{
            color: '#90caf9',
            fontWeight: 800,
            letterSpacing: '0.2em',
            background: 'linear-gradient(90deg, #90caf9 0%, #42a5f5 100%)',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block',
            mb: 2
        }}>
            {label}
        </Typography>
        <Typography variant="h3" fontWeight={800} sx={{ mb: 2, letterSpacing: '-0.02em', color: '#fff' }}>
            {title}
        </Typography>
        <Typography variant="h6" color="textSecondary" sx={{ maxWidth: 700, mx: 'auto', fontWeight: 400, opacity: 0.8 }}>
            {subtitle}
        </Typography>
    </Box>
);

const ROICalculator = () => {
    const [volume, setVolume] = React.useState(50); // Millions
    const [rate, setRate] = React.useState(3); // Error Rate %

    const savings = ((volume * 1000000) * (rate / 100) * 25).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

    return (
        <Box sx={{
            p: 6,
            background: 'rgba(20,20,20,0.8)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 4,
            backdropFilter: 'blur(10px)',
            maxWidth: 800,
            mx: 'auto',
            textAlign: 'center'
        }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>Calculate Your ROI</Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>See how much manual reconciliation costs your firm annually.</Typography>

            <Stack direction="row" spacing={8} sx={{ mb: 6 }} justifyContent="center">
                <Box sx={{ width: 250 }}>
                    <Typography variant="caption" color="textSecondary">MONTHLY VOLUME (Millions)</Typography>
                    <Typography variant="h4" color="primary" fontWeight={700}>{volume}M</Typography>
                    <input
                        type="range" min="1" max="100" value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#42a5f5' }}
                    />
                </Box>
                <Box sx={{ width: 250 }}>
                    <Typography variant="caption" color="textSecondary">EXCEPTION RATE (%)</Typography>
                    <Typography variant="h4" color="secondary" fontWeight={700}>{rate}%</Typography>
                    <input
                        type="range" min="1" max="10" value={rate}
                        onChange={(e) => setRate(Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#9c27b0' }}
                    />
                </Box>
            </Stack>

            <Box sx={{ p: 4, bgcolor: 'rgba(66, 165, 245, 0.1)', borderRadius: 2, border: '1px solid rgba(66, 165, 245, 0.3)' }}>
                <Typography variant="overline" color="textSecondary">ESTIMATED ANNUAL SAVINGS</Typography>
                <Typography variant="h2" fontWeight={800} sx={{ color: '#fff', textShadow: '0 0 20px rgba(66,165,245,0.5)' }}>
                    {savings}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                    *Based on industry avg. cost of $25 per manual exception resolution.
                </Typography>
            </Box>
        </Box>
    );
};

const AnimatedArchitecture = () => (
    <Box sx={{ position: 'relative', height: 400, width: '100%', overflow: 'hidden', borderRadius: 4, bgcolor: '#000', border: '1px solid #333' }}>
        <Box sx={{ position: 'absolute', inset: 0, opacity: 0.2, backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <svg width="100%" height="100%" viewBox="0 0 800 400">
            <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: 'transparent', stopOpacity: 0 }} />
                    <stop offset="50%" style={{ stopColor: '#42a5f5', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: 'transparent', stopOpacity: 0 }} />
                </linearGradient>
            </defs>
            {/* Data Flow Lines */}
            <path d="M 50 200 C 200 200, 200 100, 400 100 C 600 100, 600 200, 750 200" stroke="rgba(255,255,255,0.1)" fill="none" strokeWidth="2" />
            <path d="M 50 200 C 200 200, 200 300, 400 300 C 600 300, 600 200, 750 200" stroke="rgba(255,255,255,0.1)" fill="none" strokeWidth="2" />

            {/* Moving Particles */}
            <circle r="4" fill="#42a5f5">
                <animateMotion dur="3s" repeatCount="indefinite" path="M 50 200 C 200 200, 200 100, 400 100 C 600 100, 600 200, 750 200" />
            </circle>
            <circle r="4" fill="#ab47bc">
                <animateMotion dur="3s" begin="1.5s" repeatCount="indefinite" path="M 50 200 C 200 200, 200 300, 400 300 C 600 300, 600 200, 750 200" />
            </circle>

            {/* Nodes */}
            <circle cx="50" cy="200" r="15" fill="#333" stroke="#666" strokeWidth="2" />
            <text x="50" y="240" fill="#666" fontSize="12" textAnchor="middle">Ingest</text>

            <circle cx="400" cy="100" r="25" fill="#1a1a1a" stroke="#42a5f5" strokeWidth="2" />
            <text x="400" y="60" fill="#42a5f5" fontSize="12" textAnchor="middle">AI Core</text>

            <circle cx="400" cy="300" r="25" fill="#1a1a1a" stroke="#ab47bc" strokeWidth="2" />
            <text x="400" y="350" fill="#ab47bc" fontSize="12" textAnchor="middle">Validation</text>

            <circle cx="750" cy="200" r="15" fill="#333" stroke="#666" strokeWidth="2" />
            <text x="750" y="240" fill="#666" fontSize="12" textAnchor="middle">Ledger</text>
        </svg>
    </Box>
);

const TechBadge = ({ label, icon }: { label: string, icon: React.ReactNode }) => (
    <Chip
        label={label}
        icon={React.isValidElement(icon) ? React.cloneElement(icon as any, { style: { fontSize: 16 } }) : undefined}
        variant="outlined"
        sx={{
            borderColor: 'rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(5px)',
            '&:hover': { borderColor: '#42a5f5', color: '#fff' }
        }}
    />
);

const TerminalTyping = () => {
    const [lines, setLines] = useState<string[]>([]);

    useEffect(() => {
        const logs = [
            "> INITIALIZING NEURAL CORE v9.2...",
            "> LOADING VECTOR EMBEDDINGS [14TB]...",
            "> CONNECTING TO LEDGER NETWORK...",
            "> ANALYZING 45,000 TRANSACTIONS...",
            "> DETECTING ANOMALIES...",
            "> SYSTEM OPTIMIZED. READY."
        ];
        let i = 0;
        const interval = setInterval(() => {
            if (i < logs.length) {
                setLines(prev => [...prev, logs[i]].slice(-5));
                i++;
            } else {
                i = 0;
                setLines([]);
            }
        }, 800);
        return () => clearInterval(interval);
    }, []);

    return (
        <Box sx={{ fontFamily: '"Fira Code", monospace', fontSize: '0.8rem', color: '#0f0' }}>
            {lines.map((l, i) => <Box key={i} sx={{ mb: 0.5 }}>{l}</Box>)}
            <Box sx={{ animation: 'blink 1s infinite' }}>_</Box>
        </Box>
    );
};

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Box sx={{
            bgcolor: '#000',
            minHeight: '100vh',
            color: '#fff',
            overflowX: 'hidden',
            backgroundImage: `
                radial-gradient(circle at 15% 50%, rgba(33, 150, 243, 0.08), transparent 25%), 
                radial-gradient(circle at 85% 30%, rgba(156, 39, 176, 0.08), transparent 25%)
            `
        }}>
            <GlobalStyles styles={{
                '@import': 'url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap")',
                body: { fontFamily: '"Space Grotesk", sans-serif' }
            }} />

            {/* --- NAV BAR --- */}
            <Box sx={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
                backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)',
                py: 2
            }}>
                <Container maxWidth="xl">
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1} alignItems="center">
                            <BoltIcon sx={{ color: '#42a5f5' }} />
                            <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: 1 }}>RESONANT<span style={{ color: '#42a5f5' }}>.AI</span></Typography>
                        </Stack>
                        <Stack direction="row" spacing={2}>
                            <TechBadge label="v2.5.0-STABLE" icon={<div />} />
                            <Box sx={{ width: 10, height: 10, bgcolor: '#0f0', borderRadius: '50%', boxShadow: '0 0 10px #0f0' }} />
                        </Stack>
                    </Stack>
                </Container>
            </Box>

            {/* --- HERO SECTION --- */}
            <Container maxWidth="lg" sx={{ pt: 20, pb: 15, position: 'relative' }}>
                <Box sx={{
                    position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
                    width: '60vw', height: '60vw',
                    background: 'radial-gradient(circle, rgba(66, 165, 245, 0.15) 0%, transparent 60%)',
                    filter: 'blur(80px)', zIndex: 0
                }} />

                <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', mb: 4, px: 2, py: 1, borderRadius: 20, border: '1px solid rgba(66,165,245,0.3)', bgcolor: 'rgba(66,165,245,0.1)' }}>
                        <Box sx={{ width: 8, height: 8, bgcolor: '#42a5f5', borderRadius: '50%', mr: 1, animation: `${pulse} 2s infinite` }} />
                        <Typography variant="caption" fontWeight={600} color="#42a5f5">NEXT-GEN RECONCILIATION ENGINE</Typography>
                    </Box>

                    <Typography variant="h1" fontWeight={800} sx={{
                        fontSize: { xs: '3.5rem', md: '6rem' },
                        lineHeight: 0.9,
                        letterSpacing: '-0.04em',
                        mb: 3,
                        background: 'linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.6) 100%)',
                        backgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        ALGORITHMIC <br /> CERTAINTY.
                    </Typography>

                    <Typography variant="h5" sx={{ maxWidth: '700px', mx: 'auto', color: '#90a4ae', mb: 6, fontWeight: 300 }}>
                        The first autonomous financial governance platform powered by Deep Learning vectors.
                        Reconcile billions in seconds, not days.
                    </Typography>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="center">
                        <Button
                            variant="contained"
                            size="large"
                            onClick={() => navigate('/dashboard')}
                            sx={{
                                py: 2.5, px: 6,
                                borderRadius: 2,
                                fontSize: '1.1rem',
                                background: '#fff',
                                color: '#000',
                                '&:hover': {
                                    background: '#e0e0e0',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 10px 30px rgba(255,255,255,0.2)'
                                },
                                transition: 'all 0.2s'
                            }}
                        >
                            INITIATE SYSTEM
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            sx={{
                                py: 2.5, px: 6,
                                borderRadius: 2,
                                fontSize: '1.1rem',
                                borderColor: '#333',
                                color: '#fff',
                                '&:hover': { borderColor: '#fff' }
                            }}
                        >
                            DOCUMENTATION
                        </Button>
                    </Stack>

                    {/* TERMINAL PREVIEW WIDGET */}
                    <Box sx={{ mt: 10, mx: 'auto', maxWidth: 800, textAlign: 'left' }}>
                        <Box sx={{
                            bgcolor: '#050505',
                            border: '1px solid #333',
                            borderRadius: 3,
                            overflow: 'hidden',
                            boxShadow: '0 20px 80px rgba(0,0,0,0.8)'
                        }}>
                            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #333', display: 'flex', gap: 1 }}>
                                {[1, 2, 3].map(i => <Box key={i} sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#333' }} />)}
                                <Typography variant="caption" color="textSecondary" sx={{ ml: 2 }}>ai-core-daemon — 80x24</Typography>
                            </Box>
                            <Box sx={{ p: 4, minHeight: 150 }}>
                                <TerminalTyping />
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Container>

            {/* --- INFINITE MARQUEE --- */}
            <Box sx={{ py: 6, borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', bgcolor: '#020202', overflow: 'hidden' }}>
                <Typography align="center" variant="overline" color="textSecondary" sx={{ display: 'block', mb: 4, letterSpacing: 2 }}>TRUSTED BY GLOBAL LEDGERS</Typography>
                <Box sx={{ display: 'flex', width: '200%', animation: `${marquee} 40s linear infinite` }}>
                    {[...Array(20)].map((_, i) => (
                        <Typography key={i} variant="h4" fontWeight={800} sx={{ mx: 8, color: '#222', userSelect: 'none', whiteSpace: 'nowrap' }}>
                            JPMORGAN • GOLDMAN SACHS • MORGAN STANLEY • BLACKROCK • CITIGROUP •
                        </Typography>
                    ))}
                </Box>
            </Box>

            {/* --- FEATURE GRID --- */}
            <Container maxWidth="lg" sx={{ py: 20 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 4 }}>
                    <HolographicCard delay={0}>
                        <AutoGraphIcon sx={{ fontSize: 50, color: '#42a5f5', mb: 3 }} />
                        <Typography variant="h5" fontWeight={700} gutterBottom>Scalar Vector Engine</Typography>
                        <Typography variant="body2" color="textSecondary">
                            Proprietary 1024-dimension embeddings map transaction semantics to uncover hidden relationships between disconnected ledgers.
                        </Typography>
                    </HolographicCard>

                    <HolographicCard delay={0.2}>
                        <ShieldIcon sx={{ fontSize: 50, color: '#ab47bc', mb: 3 }} />
                        <Typography variant="h5" fontWeight={700} gutterBottom>Zero-Knowledge Proofs</Typography>
                        <Typography variant="body2" color="textSecondary">
                            Cryptographically verify transaction validity without revealing sensitive underlying asset data to third-party auditors.
                        </Typography>
                    </HolographicCard>

                    <HolographicCard delay={0.4}>
                        <FingerprintIcon sx={{ fontSize: 50, color: '#66bb6a', mb: 3 }} />
                        <Typography variant="h5" fontWeight={700} gutterBottom>Immutable Bio-Auth</Typography>
                        <Typography variant="body2" color="textSecondary">
                            Every override and approval is cryptographically signed with hardware-backed biometric keys for absolute non-repudiation.
                        </Typography>
                    </HolographicCard>
                </Box>
            </Container>

            {/* --- STATS SECTION --- */}
            <Box sx={{ py: 15, bgcolor: '#050505' }}>
                <Container maxWidth="lg">
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr 1fr' }, gap: 4, textAlign: 'center' }}>
                        {[
                            { label: 'Transactions/Sec', val: '24k+' },
                            { label: 'Match Accuracy', val: '99.9%' },
                            { label: 'Global Latency', val: '<15ms' },
                            { label: 'Assets Secured', val: '$4.2T' },
                        ].map((s, i) => (
                            <Box key={i}>
                                <Typography variant="h3" fontWeight={800} sx={{ color: '#fff', mb: 1 }}>{s.val}</Typography>
                                <Typography variant="overline" color="textSecondary">{s.label}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Container>
            </Box>

            {/* --- MEGA FOOTER --- */}
            <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.05)', bgcolor: '#020202', pt: 10, pb: 4 }}>
                <Container maxWidth="lg">
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr 1fr' }, gap: 8, mb: 8 }}>
                        <Box>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
                                <BoltIcon sx={{ color: '#42a5f5' }} />
                                <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: 1 }}>RESONANT<span style={{ color: '#42a5f5' }}>.AI</span></Typography>
                            </Stack>
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 4, maxWidth: 300, lineHeight: 1.8 }}>
                                The operating system for modern finance. We are building the infrastructure for the next century of global capital markets.
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Paper component="form" sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 300, bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid #333' }}>
                                    <input style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', padding: '10px', outline: 'none' }} placeholder="Enter enterprise email" />
                                    <Button variant="contained" size="small" sx={{ bgcolor: '#333' }}>Subscribe</Button>
                                </Paper>
                            </Box>
                        </Box>

                        <Box>
                            <Typography variant="overline" color="#fff" fontWeight={700} sx={{ display: 'block', mb: 3 }}>PLATFORM</Typography>
                            <Stack spacing={2}>
                                {['Reconciliation Engine', 'Governance Console', 'Audit Trail', 'API Documentation', 'System Status'].map(item => (
                                    <Typography key={item} variant="body2" color="textSecondary" sx={{ cursor: 'pointer', '&:hover': { color: '#42a5f5' } }}>{item}</Typography>
                                ))}
                            </Stack>
                        </Box>

                        <Box>
                            <Typography variant="overline" color="#fff" fontWeight={700} sx={{ display: 'block', mb: 3 }}>COMPANY</Typography>
                            <Stack spacing={2}>
                                {['About Us', 'Careers', 'Press', 'Legal', 'Contact'].map(item => (
                                    <Typography key={item} variant="body2" color="textSecondary" sx={{ cursor: 'pointer', '&:hover': { color: '#42a5f5' } }}>{item}</Typography>
                                ))}
                            </Stack>
                        </Box>

                        <Box>
                            <Typography variant="overline" color="#fff" fontWeight={700} sx={{ display: 'block', mb: 3 }}>LEGAL</Typography>
                            <Stack spacing={2}>
                                {['Privacy Policy', 'Terms of Service', 'Available Regions', 'Compliance', 'Security'].map(item => (
                                    <Typography key={item} variant="body2" color="textSecondary" sx={{ cursor: 'pointer', '&:hover': { color: '#42a5f5' } }}>{item}</Typography>
                                ))}
                            </Stack>
                        </Box>
                    </Box>

                    <Box sx={{ pt: 4, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                        <Typography variant="caption" color="textSecondary">
                            © 2026 Resonant Systems Inc. All rights reserved.
                        </Typography>

                        <Stack direction="row" spacing={3} alignItems="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 8, height: 8, bgcolor: '#0f0', borderRadius: '50%', boxShadow: '0 0 8px #0f0' }} />
                                <Typography variant="caption" color="#0f0" fontWeight={600} sx={{ letterSpacing: 1 }}>ALL SYSTEMS OPERATIONAL</Typography>
                            </Box>
                            <Typography variant="caption" color="textSecondary">Latency: 12ms</Typography>
                        </Stack>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
};
