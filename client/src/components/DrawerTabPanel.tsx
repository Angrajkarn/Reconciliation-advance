import React from 'react';
import { Box } from '@mui/material';

export const DrawerTabPanel = (props: { children?: React.ReactNode; index: number; value: number }) => {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} {...other} style={{ height: '100%', overflow: 'auto' }}>
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
};
