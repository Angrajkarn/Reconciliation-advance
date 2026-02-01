import React, { useState } from 'react';
import { styled, useTheme, Theme, CSSObject } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DashboardIcon from '@mui/icons-material/Dashboard';
import TableViewIcon from '@mui/icons-material/TableView';
import GavelIcon from '@mui/icons-material/Gavel';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import HistoryIcon from '@mui/icons-material/History';
import ThunderstormIcon from '@mui/icons-material/Thunderstorm';
import StorageIcon from '@mui/icons-material/Storage';
import BoltIcon from '@mui/icons-material/Bolt';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import { Avatar, Chip, Tooltip, Stack } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 260;

const openedMixin = (theme: Theme): CSSObject => ({
    width: drawerWidth,
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
    backgroundColor: '#050f1a', // Deep enterprise blue/black
    borderRight: '1px solid rgba(255,255,255,0.08)',
});

const closedMixin = (theme: Theme): CSSObject => ({
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: 'hidden',
    width: `calc(${theme.spacing(7)} + 1px)`,
    [theme.breakpoints.up('sm')]: {
        width: `calc(${theme.spacing(9)} + 1px)`,
    },
    backgroundColor: '#050f1a',
    borderRight: '1px solid rgba(255,255,255,0.08)',
});

const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
}));

interface AppBarProps extends MuiAppBarProps {
    open?: boolean;
}

const AppBar = styled(MuiAppBar, {
    shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    backgroundColor: 'rgba(10, 25, 41, 0.85)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    boxShadow: 'none',
    ...(open && {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
    ({ theme, open }) => ({
        width: drawerWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        ...(open && {
            ...openedMixin(theme),
            '& .MuiDrawer-paper': openedMixin(theme),
        }),
        ...(!open && {
            ...closedMixin(theme),
            '& .MuiDrawer-paper': closedMixin(theme),
        }),
    }),
);

interface GlobalLayoutProps {
    children: React.ReactNode;
}

export const GlobalLayout: React.FC<GlobalLayoutProps> = ({ children }) => {
    const theme = useTheme();
    const [open, setOpen] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    const handleDrawerOpen = () => setOpen(true);
    const handleDrawerClose = () => setOpen(false);
    const toggleDrawer = () => setOpen(!open);

    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
        { text: 'Transactions', icon: <TableViewIcon />, path: '/transactions' },
        { text: 'Governance', icon: <GavelIcon />, path: '/governance' },
        { text: 'ML Monitoring', icon: <ShowChartIcon />, path: '/monitoring' },
        { text: 'Audit & Lineage', icon: <HistoryIcon />, path: '/audit' },
        { text: 'Stress Tests', icon: <ThunderstormIcon />, path: '/stress' },
        { text: 'Admin Control', icon: <SupervisorAccountIcon />, path: '/admin/iam' },
    ];

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar position="fixed" open={open}>
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        onClick={toggleDrawer}
                        edge="start"
                        sx={{
                            marginRight: 5,
                        }}
                    >
                        {open ? <ChevronLeftIcon /> : <MenuIcon />}
                    </IconButton>

                    <Stack direction="row" alignItems="center" spacing={1} sx={{ flexGrow: 1 }}>
                        <BoltIcon sx={{ color: '#42a5f5' }} />
                        <Typography variant="h6" noWrap component="div" fontWeight={700} sx={{ letterSpacing: 1 }}>
                            RESONANT<span style={{ color: '#42a5f5' }}>.AI</span>
                        </Typography>
                        <Chip
                            label="ENTERPRISE"
                            size="small"
                            sx={{
                                ml: 2,
                                height: 20,
                                fontSize: '0.65rem',
                                bgcolor: 'rgba(66, 165, 245, 0.1)',
                                color: '#42a5f5',
                                border: '1px solid rgba(66, 165, 245, 0.3)'
                            }}
                        />
                    </Stack>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                            sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' }, cursor: 'pointer' }}
                            onClick={() => navigate('/admin')}
                        >
                            <Typography variant="body2" fontWeight={600}>J. P. Morgan</Typography>
                            <Typography variant="caption" color="textSecondary">Admin Access</Typography>
                        </Box>
                        <IconButton onClick={() => navigate('/admin')} sx={{ p: 0 }}>
                            <Avatar sx={{ bgcolor: '#42a5f5', width: 35, height: 35 }}>JP</Avatar>
                        </IconButton>
                    </Box>
                </Toolbar>
            </AppBar>

            <Drawer variant="permanent" open={open}>
                <DrawerHeader>
                    <Typography variant="overline" sx={{ mr: 'auto', ml: 2, color: 'text.secondary', opacity: open ? 1 : 0, fontWeight: 700, letterSpacing: 1 }}>
                        RESONANT <span style={{ color: '#42a5f5' }}>.AI</span>
                    </Typography>
                </DrawerHeader>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />
                <List>
                    {menuItems.map((item) => (
                        <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
                            <Tooltip title={!open ? item.text : ""} placement="right">
                                <ListItemButton
                                    onClick={() => navigate(item.path)}
                                    selected={location.pathname === item.path}
                                    sx={{
                                        minHeight: 48,
                                        justifyContent: open ? 'initial' : 'center',
                                        px: 2.5,
                                        '&.Mui-selected': {
                                            bgcolor: 'rgba(66, 165, 245, 0.08)',
                                            borderLeft: '3px solid #42a5f5',  // Enterprise left-border accent
                                            '&:hover': { bgcolor: 'rgba(66, 165, 245, 0.12)' }
                                        },
                                        '&:hover': {
                                            bgcolor: 'rgba(255, 255, 255, 0.03)'
                                        }
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            minWidth: 0,
                                            mr: open ? 3 : 'auto',
                                            justifyContent: 'center',
                                            color: location.pathname === item.path ? '#42a5f5' : '#78909c'
                                        }}
                                    >
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0 }} primaryTypographyProps={{ fontWeight: 500 }} />
                                </ListItemButton>
                            </Tooltip>
                        </ListItem>
                    ))}
                </List>

                <Box sx={{ mt: 'auto', p: 2, opacity: open ? 1 : 0, transition: 'opacity 0.2s' }}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <Typography variant="caption" color="textSecondary" display="block" gutterBottom>SYSTEM STATUS</Typography>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ width: 8, height: 8, bgcolor: '#00e676', borderRadius: '50%', boxShadow: '0 0 8px #00e676' }} />
                            <Typography variant="caption" fontWeight={600} color="#00e676">OPERATIONAL</Typography>
                        </Stack>
                    </Box>
                </Box>
            </Drawer>

            <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: '#000', minHeight: '100vh', backgroundImage: 'radial-gradient(circle at 50% 0%, #0a1929 0%, #000 60%)' }}>
                <DrawerHeader />
                {children}
            </Box>
        </Box>
    );
};


