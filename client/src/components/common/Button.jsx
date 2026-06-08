import React from 'react';
import { Button as MuiButton } from '@mui/material';

const Button = ({ children, variant = 'contained', color = 'primary', onClick, disabled, type = 'button', sx, ...rest }) => {
  return (
    <MuiButton
      variant={variant}
      color={color}
      onClick={onClick}
      disabled={disabled}
      type={type}
      sx={{ mt: 1, mb: 1, ...sx }}
      {...rest}
    >
      {children}
    </MuiButton>
  );
};

export default Button;