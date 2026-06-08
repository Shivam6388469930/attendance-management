import React from 'react';
import { Modal as MuiModal, Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const maxWidthMap = { xs: 444, sm: 600, md: 900, lg: 1200, xl: 1536 };

const Modal = ({ open, onClose, title, children, maxWidth = 'sm', fullWidth = false }) => {
  const widthValue = maxWidthMap[maxWidth] ?? maxWidth;
  return (
    <MuiModal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: fullWidth ? `min(${widthValue}px, calc(100vw - 32px))` : `min(${widthValue}px, calc(100vw - 32px))`,
          maxWidth: widthValue,
          maxHeight: '90vh',
          overflowY: 'auto',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">{title}</Typography>
          {onClose && (
            <IconButton size="small" onClick={onClose} sx={{ ml: 1 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
        {children}
      </Box>
    </MuiModal>
  );
};

export default Modal;