import React, { useState } from 'react';
import { Box, Paper, Typography, Divider, Stepper, Step, StepLabel, Button, Chip } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Mock Data for Explainability
const xaiData = [
    { name: 'Same Amount', impact: 50, color: '#66bb6a' },
    { name: 'ID Match > 95%', impact: 40, color: '#66bb6a' },
    { name: 'Date Match', impact: 20, color: '#66bb6a' },
    { name: 'Diff Currency', impact: -80, color: '#f44336' },
];

const decisionSteps = [
    'Event Ingested (10:00 AM)',
    'ML Scored (0.92 Confidence)',
    'Circuit Breaker Check (Passed)',
    'Pending Governance'
];

export const TransactionDetail: React.FC = () => {
    // Usually ID comes from URL params
    const [activeStep] = useState(3);

    return (
        <Box>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5">Transaction Details: TXN-10045</Typography>
                <Chip label="OPS_REVIEW" color="warning" />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                {/* Left: Data Comparison */}
                <Box>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>Source vs Target Comparison</Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <Box>
                                <Typography variant="subtitle2" color="textSecondary">Source A</Typography>
                                <Box sx={{ p: 1, border: '1px solid #444', borderRadius: 1, mt: 1 }}>
                                    <Typography variant="body2">ID: TXN-10045</Typography>
                                    <Typography variant="body2">Amt: 50,000.00</Typography>
                                    <Typography variant="body2">Ccy: USD</Typography>
                                    <Typography variant="body2">Date: 2026-01-29</Typography>
                                </Box>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" color="textSecondary">Source B (Best Match)</Typography>
                                <Box sx={{ p: 1, border: '1px solid #444', borderRadius: 1, mt: 1 }}>
                                    <Typography variant="body2">ID: REF-998877</Typography>
                                    <Typography variant="body2">Amt: 50,000.00</Typography>
                                    <Typography variant="body2">Ccy: USD</Typography>
                                    <Typography variant="body2">Date: 2026-01-29</Typography>
                                </Box>
                            </Box>
                        </Box>

                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle1">Discrepancies</Typography>
                        <Chip label="ID Mismatch (Fuzzy Match Found)" size="small" sx={{ mt: 1 }} />
                    </Paper>
                </Box>

                {/* Right: Explainability Panel */}
                <Box>
                    <Paper sx={{ p: 2, height: 300 }}>
                        <Typography variant="h6" gutterBottom>ML Decision Explainability (XAI)</Typography>
                        <Typography variant="caption" color="textSecondary">Why did the model suggest a MATCH?</Typography>

                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart layout="vertical" data={xaiData} margin={{ left: 40 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="impact" barSize={20}>
                                    {xaiData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Box>

                {/* Bottom: Lineage Timeline (Spans full width) */}
                <Box sx={{ gridColumn: '1 / -1' }}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>Decision Lineage & Governance</Typography>
                        <Stepper activeStep={activeStep} alternativeLabel>
                            {decisionSteps.map((label) => (
                                <Step key={label}>
                                    <StepLabel>{label}</StepLabel>
                                </Step>
                            ))}
                        </Stepper>

                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                            <Button variant="outlined" color="error">Reject Match</Button>
                            <Button variant="contained" color="primary">Approve Match (Maker)</Button>
                        </Box>
                    </Paper>
                </Box>
            </Box>
        </Box>
    );
};
