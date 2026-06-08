import React, { useEffect, useState, useCallback } from 'react';
import {
  Typography,
  Box,
  Paper,
  Alert,
  TextField,
  Button as MuiButton,
  IconButton,
  Tooltip,
  Snackbar,
  Chip,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  AccessTime as AccessTimeIcon,
  HourglassEmpty as HourglassIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import { adminApi } from '../../api';

const AttendanceRules = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    work_start_time: '09:00',
    work_end_time: '17:00',
    min_hours_per_day: 8,
    late_threshold_minutes: 15,
    break_duration_minutes: 60,
    overtime_threshold_hours: 2,
    is_active: true,
    applicable_departments: [],
    applicable_roles: []
  });

  const [formErrors, setFormErrors] = useState({});

  // Fetch rules
  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminApi.getRules();
      setRules(response.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch attendance rules.');
      console.error('Fetch rules error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.work_start_time) {
      errors.work_start_time = 'Work start time is required';
    }
    if (!formData.work_end_time) {
      errors.work_end_time = 'Work end time is required';
    }
    if (!formData.min_hours_per_day || formData.min_hours_per_day < 1) {
      errors.min_hours_per_day = 'Minimum hours per day must be at least 1';
    }
    if (formData.min_hours_per_day > 12) {
      errors.min_hours_per_day = 'Minimum hours per day cannot exceed 12';
    }
    if (!formData.late_threshold_minutes || formData.late_threshold_minutes < 0) {
      errors.late_threshold_minutes = 'Late threshold must be a positive number';
    }
    if (formData.late_threshold_minutes > 120) {
      errors.late_threshold_minutes = 'Late threshold cannot exceed 120 minutes';
    }
    if (formData.break_duration_minutes && formData.break_duration_minutes < 0) {
      errors.break_duration_minutes = 'Break duration must be a positive number';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submit (create/update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      if (isEditing && selectedRule) {
        await adminApi.updateRule(selectedRule.id, formData);
        setSuccess('Rule updated successfully!');
      } else {
        await adminApi.createRule(formData);
        setSuccess('Rule created successfully!');
      }
      
      setModalOpen(false);
      resetForm();
      await fetchRules();
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${isEditing ? 'update' : 'create'} rule.`);
    }
  };

  // Handle edit rule
  const handleEdit = (rule) => {
    setSelectedRule(rule);
    setFormData({
      work_start_time: rule.work_start_time,
      work_end_time: rule.work_end_time,
      min_hours_per_day: rule.min_hours_per_day,
      late_threshold_minutes: rule.late_threshold_minutes,
      break_duration_minutes: rule.break_duration_minutes || 60,
      overtime_threshold_hours: rule.overtime_threshold_hours || 2,
      is_active: rule.is_active !== undefined ? rule.is_active : true,
      applicable_departments: rule.applicable_departments || [],
      applicable_roles: rule.applicable_roles || []
    });
    setIsEditing(true);
    setModalOpen(true);
  };

  // Handle delete rule
  const handleDelete = async () => {
    try {
      await adminApi.deleteRule(selectedRule.id);
      setSuccess('Rule deleted successfully!');
      setDeleteDialogOpen(false);
      await fetchRules();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete rule.');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      work_start_time: '09:00',
      work_end_time: '17:00',
      min_hours_per_day: 8,
      late_threshold_minutes: 15,
      break_duration_minutes: 60,
      overtime_threshold_hours: 2,
      is_active: true,
      applicable_departments: [],
      applicable_roles: []
    });
    setFormErrors({});
    setIsEditing(false);
    setSelectedRule(null);
  };

  // Handle modal close
  const handleModalClose = () => {
    setModalOpen(false);
    resetForm();
  };

  // Format time for display
  const formatTime = (time) => {
    if (!time) return 'N/A';
    return time.substring(0, 5);
  };

  // Table columns configuration
  const columns = [
    { 
      key: 'work_start_time', 
      header: 'Work Start Time',
      render: (value) => <Chip icon={<ScheduleIcon />} label={formatTime(value)} size="small" />
    },
    { 
      key: 'work_end_time', 
      header: 'Work End Time',
      render: (value) => <Chip icon={<ScheduleIcon />} label={formatTime(value)} size="small" />
    },
    { 
      key: 'min_hours_per_day', 
      header: 'Min Hours/Day',
      render: (value) => <Chip icon={<HourglassIcon />} label={`${value} hrs`} size="small" color="primary" />
    },
    { 
      key: 'late_threshold_minutes', 
      header: 'Late Threshold',
      render: (value) => <Chip icon={<WarningIcon />} label={`${value} min`} size="small" color="warning" />
    },
    { 
      key: 'break_duration_minutes', 
      header: 'Break Duration',
      render: (value) => value ? `${value} min` : 'N/A'
    },
    { 
      key: 'is_active', 
      header: 'Status',
      render: (value) => (
        <Chip 
          label={value ? 'Active' : 'Inactive'} 
          color={value ? 'success' : 'default'}
          size="small"
        />
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="Edit Rule">
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleEdit(row)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Rule">
            <IconButton
              size="small"
              color="error"
              onClick={() => {
                setSelectedRule(row);
                setDeleteDialogOpen(true);
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ];

  // Stats cards
  const activeRules = rules.filter(rule => rule.is_active).length;
  const defaultRules = rules.filter(rule => !rule.applicable_departments?.length).length;

  if (loading) return <Spinner />;

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="600">
          Attendance Rules
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Configure and manage attendance policies, working hours, and late arrival thresholds
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="overline">
                Total Rules
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {rules.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="overline">
                Active Rules
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {activeRules}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="overline">
                Default Rules
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {defaultRules}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="overline">
                Custom Rules
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {rules.length - defaultRules}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alerts */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      {/* Actions Bar */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          onClick={() => {
            resetForm();
            setModalOpen(true);
          }}
          startIcon={<AddIcon />}
          variant="contained"
        >
          Add New Rule
        </Button>
        
        <Tooltip title="Refresh Rules">
          <IconButton onClick={fetchRules} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Rules Table */}
      <Paper sx={{ p: 2, overflowX: 'auto' }}>
        <Table 
          columns={columns} 
          data={rules} 
          emptyMessage="No attendance rules found. Click 'Add New Rule' to create one."
        />
      </Paper>

      {/* Add/Edit Modal */}
      <Modal 
        open={modalOpen} 
        onClose={handleModalClose} 
        title={isEditing ? "Edit Attendance Rule" : "Add New Attendance Rule"}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Work Start Time"
                type="time"
                value={formData.work_start_time}
                onChange={(e) => setFormData({ ...formData, work_start_time: e.target.value })}
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
                error={!!formErrors.work_start_time}
                helperText={formErrors.work_start_time}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Work End Time"
                type="time"
                value={formData.work_end_time}
                onChange={(e) => setFormData({ ...formData, work_end_time: e.target.value })}
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
                error={!!formErrors.work_end_time}
                helperText={formErrors.work_end_time}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Minimum Hours Per Day"
                type="number"
                value={formData.min_hours_per_day}
                onChange={(e) => setFormData({ ...formData, min_hours_per_day: parseInt(e.target.value) })}
                fullWidth
                margin="normal"
                required
                inputProps={{ min: 1, max: 12, step: 0.5 }}
                error={!!formErrors.min_hours_per_day}
                helperText={formErrors.min_hours_per_day || "Hours required per day"}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Late Threshold (Minutes)"
                type="number"
                value={formData.late_threshold_minutes}
                onChange={(e) => setFormData({ ...formData, late_threshold_minutes: parseInt(e.target.value) })}
                fullWidth
                margin="normal"
                required
                inputProps={{ min: 0, max: 120, step: 5 }}
                error={!!formErrors.late_threshold_minutes}
                helperText={formErrors.late_threshold_minutes || "Minutes after which an employee is considered late"}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Break Duration (Minutes)"
                type="number"
                value={formData.break_duration_minutes}
                onChange={(e) => setFormData({ ...formData, break_duration_minutes: parseInt(e.target.value) })}
                fullWidth
                margin="normal"
                inputProps={{ min: 0, max: 120, step: 15 }}
                helperText="Optional: Lunch/break duration"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Overtime Threshold (Hours)"
                type="number"
                value={formData.overtime_threshold_hours}
                onChange={(e) => setFormData({ ...formData, overtime_threshold_hours: parseInt(e.target.value) })}
                fullWidth
                margin="normal"
                inputProps={{ min: 0, max: 8, step: 0.5 }}
                helperText="Hours after which overtime is calculated"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.value })}
                  label="Status"
                >
                  <MenuItem value={true}>Active</MenuItem>
                  <MenuItem value={false}>Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <MuiButton onClick={handleModalClose}>
              Cancel
            </MuiButton>
            <MuiButton type="submit" variant="contained" color="primary">
              {isEditing ? 'Update' : 'Create'} Rule
            </MuiButton>
          </Box>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the attendance rule "{selectedRule?.work_start_time} - {selectedRule?.work_end_time}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => setDeleteDialogOpen(false)}>Cancel</MuiButton>
          <MuiButton onClick={handleDelete} color="error" variant="contained">
            Delete
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AttendanceRules;