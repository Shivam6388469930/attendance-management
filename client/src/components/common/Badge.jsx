import React from 'react';
import { Chip } from '@mui/material';

const Badge = ({ label, color = 'default', variant = 'filled' }) => {
  return (
    <Chip
      label={label}
      color={color}
      variant={variant}
      size="small"
      sx={{ mr: 1 }}
    />
  );
};

export default Badge;