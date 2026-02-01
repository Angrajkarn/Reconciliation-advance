import { createTheme, responsiveFontSizes } from '@mui/material/styles';

// JP Morgan-style Enterprise Palette
// Neutral background, High Contrast text, Semantic Colors for Risk
export const theme = responsiveFontSizes(createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#90caf9', // Soft Blue for Primary Actions
        },
        secondary: {
            main: '#ce93d8', // Muted Purple
        },
        background: {
            default: '#0a1929', // Deep Navy/Black (Enterprise Dark)
            paper: '#132f4c',   // Slightly lighter for cards
        },
        text: {
            primary: '#ffffff',
            secondary: '#b2bac2',
        },
        error: {
            main: '#f44336', // High Risk
        },
        warning: {
            main: '#ffa726', // Review Needed
        },
        success: {
            main: '#66bb6a', // Auto-Reconciled
        },
        info: {
            main: '#29b6f6',
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontSize: '2rem', fontWeight: 600 },
        h2: { fontSize: '1.5rem', fontWeight: 600 },
        h3: { fontSize: '1.25rem', fontWeight: 600 },
        h4: { fontSize: '1.1rem', fontWeight: 600 },
        h5: { fontSize: '1rem', fontWeight: 600 },
        h6: { fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' },
        body1: { fontSize: '0.875rem' }, // Dense readable text
        body2: { fontSize: '0.75rem' },  // Audit trail text
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none', // Improving readability
                    fontWeight: 600,
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    padding: '6px 16px', // Dense Table Rows
                    fontSize: '0.8125rem',
                },
                head: {
                    fontWeight: 700,
                    backgroundColor: '#173a5e',
                    color: '#ffffff',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    border: '1px solid #1e4976', // Subtle border
                },
            },
        },
    },
}));
