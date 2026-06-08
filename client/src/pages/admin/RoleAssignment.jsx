import React, { useEffect, useState, useCallback } from 'react';
import {
  Typography,
  Box,
  Paper,
  Alert,
  TextField,
  MenuItem,
  Button as MuiButton,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Avatar,
  Chip,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Stack,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  School as EmployeeIcon,
  Assignment as AssignmentIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  SupervisorAccount as HrIcon
} from '@mui/icons-material';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import { adminApi } from '../../api';

const RoleAssignment = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Role configurations
  const roleConfig = {
    admin: { 
      name: 'Admin', 
      icon: <AdminIcon />, 
      color: 'error',
      description: 'Full system access and user management'
    },
    hr: { 
      name: 'HR', 
      icon: <HrIcon />, 
      color: 'primary',
      description: 'Manage attendance and user requests'
    },
    employee: { 
      name: 'Employee', 
      icon: <EmployeeIcon />, 
      color: 'success',
      description: 'Basic attendance tracking'
    }
  };

  const fetchUsers = useCallback(async () => {
    try {
      const response = await adminApi.getUsers();
      setUsers(response.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch users.');
      console.error('Fetch users error:', err);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    const fallbackRoles = [
      { id: 3, name: 'admin' },
      { id: 2, name: 'hr' },
      { id: 1, name: 'employee' },
    ];
    try {
      const response = await adminApi.getRoles().catch(() => ({ data: [] }));
      if (response.data && response.data.length > 0) {
        setRoles(response.data);
      } else {
        setRoles(fallbackRoles);
      }
    } catch (err) {
      console.error('Fetch roles error:', err);
      setRoles(fallbackRoles);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchUsers(), fetchRoles()]);
    };
    loadData();
  }, [fetchUsers, fetchRoles]);

  const handleAssignRole = (user) => {
    setSelectedUser(user);
    setSelectedRole(user.role || user.Role?.name || 'employee');
    setModalOpen(true);
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !selectedRole) return;
    
    // Show confirmation dialog for role changes
    if (selectedUser.role !== selectedRole && selectedUser.role) {
      setConfirmDialogOpen(true);
    } else {
      await submitRoleAssignment();
    }
  };

  const submitRoleAssignment = async () => {
    setSubmitting(true);
    try {
      const roleObj = roles.find(r => r.name === selectedRole);
      const roleId = roleObj?.id;
      if (!roleId) {
        setError('Invalid role selected. Please try again.');
        setSubmitting(false);
        return;
      }

      await adminApi.assignRole(selectedUser.id, roleId);
      
      setSuccess(`Role assigned successfully to ${selectedUser.name || selectedUser.email}`);
      setModalOpen(false);
      setConfirmDialogOpen(false);
      await fetchUsers(); // Refresh user list
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign role.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter users based on search and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      searchTerm === '' ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id?.toString().includes(searchTerm);
    
    const matchesRole = 
      roleFilter === '' ||
      (user.role || user.Role?.name) === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Get role statistics
  const roleStats = {
    total: users.length,
    admin: users.filter(u => (u.role || u.Role?.name) === 'admin').length,
    hr: users.filter(u => (u.role || u.Role?.name) === 'hr').length,
    employee: users.filter(u => (u.role || u.Role?.name) === 'employee').length,
  };

  const columns = [
    { 
      key: 'name', 
      header: 'User',
      render: (_, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
            {row.name?.charAt(0)?.toUpperCase() || row.email?.charAt(0)?.toUpperCase() || <PersonIcon />}
          </Avatar>
          <Box>
            <Typography variant="body1" fontWeight={500}>
              {row.name || 'Unnamed User'}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              ID: {row.id} • {row.email}
            </Typography>
          </Box>
        </Box>
      )
    },
    { 
      key: 'email', 
      header: 'Email',
      render: (value) => (
        <Typography variant="body2">{value}</Typography>
      )
    },
    { 
      key: 'role', 
      header: 'Current Role',
      render: (_, row) => {
        const role = row.role || row.Role?.name || 'employee';
        const config = roleConfig[role] || roleConfig.employee;
        return (
          <Chip
            icon={config.icon}
            label={config.name}
            color={config.color}
            size="small"
            sx={{ fontWeight: 500 }}
          />
        );
      }
    },
    { 
      key: 'department', 
      header: 'Department',
      render: (value) => (
        <Typography variant="body2">{value || 'Not Assigned'}</Typography>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <Tooltip title={`Assign new role to ${row.name || row.email}`}>
          <Button
            onClick={() => handleAssignRole(row)}
            size="small"
            startIcon={<AssignmentIcon />}
            variant="outlined"
          >
            Change Role
          </Button>
        </Tooltip>
      ),
    },
  ];

  if (loading) return <Spinner />;

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="600">
          Role Assignment
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Manage user roles and permissions across the system
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="overline">
                Total Users
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {roleStats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderTop: '3px solid #f44336' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="overline">
                    Administrators
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="error">
                    {roleStats.admin}
                  </Typography>
                </Box>
                <AdminIcon sx={{ fontSize: 40, color: '#f44336', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderTop: '3px solid #2196f3' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="overline">
                    HR Personnel
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {roleStats.hr}
                  </Typography>
                </Box>
                <HrIcon sx={{ fontSize: 40, color: '#2196f3', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderTop: '3px solid #4caf50' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="overline">
                    Employees
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {roleStats.employee}
                  </Typography>
                </Box>
                <EmployeeIcon sx={{ fontSize: 40, color: '#4caf50', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          onClose={() => setError('')}
          action={
            <IconButton size="small" onClick={() => setError('')}>
              <CancelIcon />
            </IconButton>
          }
        >
          {error}
        </Alert>
      )}

      {/* Filters and Actions */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              fullWidth
              label="Search Users"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or ID..."
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Role</InputLabel>
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                label="Filter by Role"
              >
                <MenuItem value="">All Roles</MenuItem>
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.name}>
                    {roleConfig[role.name]?.name || role.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Button
              fullWidth
              onClick={fetchUsers}
              startIcon={<RefreshIcon />}
              variant="outlined"
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Users Table */}
      <Paper sx={{ p: 2, overflowX: 'auto' }}>
        <Table 
          columns={columns} 
          data={filteredUsers}
          emptyMessage="No users found matching your criteria"
        />
        
        {/* Summary */}
        {filteredUsers.length > 0 && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="textSecondary">
              Showing {filteredUsers.length} of {users.length} users
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Role Assignment Modal */}
      <Modal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title="Assign User Role"
        maxWidth="sm"
        fullWidth
      >
        <Box sx={{ p: 2 }}>
          {selectedUser && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.main' }}>
                  {selectedUser.name?.charAt(0)?.toUpperCase() || selectedUser.email?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {selectedUser.name || 'Unnamed User'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {selectedUser.email}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    User ID: {selectedUser.id}
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <FormControl fullWidth>
                <InputLabel>Select Role</InputLabel>
                <Select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  label="Select Role"
                >
                  {roles.map((role) => {
                    const config = roleConfig[role.name] || { name: role.name, description: '' };
                    return (
                      <MenuItem key={role.id} value={role.name}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {config.icon}
                          <Box>
                            <Typography variant="body1">{config.name}</Typography>
                            {config.description && (
                              <Typography variant="caption" color="textSecondary">
                                {config.description}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
              
              {selectedUser.role && selectedUser.role !== selectedRole && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Changing role from <strong>{roleConfig[selectedUser.role]?.name || selectedUser.role}</strong> to{' '}
                  <strong>{roleConfig[selectedRole]?.name || selectedRole}</strong>
                </Alert>
              )}
              
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                <MuiButton onClick={() => setModalOpen(false)}>
                  Cancel
                </MuiButton>
                <MuiButton
                  variant="contained"
                  onClick={handleRoleChange}
                  disabled={!selectedRole || submitting}
                  startIcon={submitting ? <CircularProgress size={20} /> : <AssignmentIcon />}
                >
                  {submitting ? 'Assigning...' : 'Assign Role'}
                </MuiButton>
              </Box>
            </>
          )}
        </Box>
      </Modal>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          Confirm Role Change
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to change the role of <strong>{selectedUser?.name || selectedUser?.email}</strong>?
          </Typography>
          <Box sx={{ mt: 2, p: 2, bgcolor: '#fff3e0', borderRadius: 1 }}>
            <Typography variant="body2" color="textSecondary">
              Current Role: <strong>{roleConfig[selectedUser?.role]?.name || selectedUser?.role}</strong>
            </Typography>
            <Typography variant="body2" color="textSecondary">
              New Role: <strong>{roleConfig[selectedRole]?.name || selectedRole}</strong>
            </Typography>
          </Box>
          <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
            This change will affect the user's permissions immediately.
          </Typography>
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => setConfirmDialogOpen(false)}>Cancel</MuiButton>
          <MuiButton 
            onClick={submitRoleAssignment} 
            variant="contained" 
            color="primary"
            disabled={submitting}
          >
            Confirm Change
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
        <Alert 
          onClose={() => setSuccess('')} 
          severity="success" 
          sx={{ width: '100%' }}
          icon={<CheckCircleIcon />}
        >
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RoleAssignment;