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
  Divider,
  Switch,
  FormControlLabel,
  InputAdornment
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  AdminPanelSettings as AdminIcon,
  School as EmployeeIcon,
  SupervisorAccount as HrIcon,
  Email as EmailIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import { adminApi } from '../../api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role_id: '',
    department: '',
    position: '',
    phone: '',
    employee_id: '',
    is_active: true
  });

  const [formErrors, setFormErrors] = useState({});

  // Role configuration
  const roleConfig = {
    admin: { name: 'Admin', icon: <AdminIcon />, color: 'error' },
    hr: { name: 'HR', icon: <HrIcon />, color: 'primary' },
    employee: { name: 'Employee', icon: <EmployeeIcon />, color: 'success' }
  };

  const fetchUsers = useCallback(async () => {
    try {
      const response = await adminApi.getUsers();
      setUsers(response.data || []);
      setFilteredUsers(response.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch users.');
      console.error('Fetch users error:', err);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      // Try to fetch roles from API endpoint
      const response = await adminApi.getRoles().catch(() => ({ data: [] }));
      if (response.data && response.data.length > 0) {
        setRoles(response.data);
      } else {
        // Fallback: seed creates employee=1, hr=2, admin=3
        setRoles([
          { id: 1, name: 'employee', label: 'Employee' },
          { id: 2, name: 'hr', label: 'HR' },
          { id: 3, name: 'admin', label: 'Admin' }
        ]);
      }
    } catch (err) {
      console.error('Fetch roles error:', err);
      setRoles([
        { id: 1, name: 'employee', label: 'Employee' },
        { id: 2, name: 'hr', label: 'HR' },
        { id: 3, name: 'admin', label: 'Admin' }
      ]);
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

  // Filter users
  useEffect(() => {
    let result = [...users];
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(user =>
        user.name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.employee_id?.toLowerCase().includes(term) ||
        user.department?.toLowerCase().includes(term)
      );
    }
    
    // Role filter
    if (roleFilter) {
      result = result.filter(user => 
        (user.role || user.Role?.name) === roleFilter
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      result = result.filter(user => user.is_active === isActive);
    }
    
    setFilteredUsers(result);
  }, [users, searchTerm, roleFilter, statusFilter]);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!editModalOpen && !formData.password) {
      errors.password = 'Password is required for new users';
    } else if (formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.role_id) {
      errors.role_id = 'Role is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    try {
      if (editModalOpen && selectedUser) {
        // Update user
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        await adminApi.updateUser(selectedUser.id, updateData);
        setSuccess('User updated successfully!');
      } else {
        // Create new user
        await adminApi.createUser(formData);
        setSuccess('User created successfully!');
      }
      
      setModalOpen(false);
      setEditModalOpen(false);
      resetForm();
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${editModalOpen ? 'update' : 'create'} user.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role_id: user.role_id || user.Role?.id || '',
      department: user.department || '',
      position: user.position || '',
      phone: user.phone || '',
      employee_id: user.employee_id || '',
      is_active: user.is_active !== undefined ? user.is_active : true
    });
    setEditModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    
    setSubmitting(true);
    try {
      await adminApi.deleteUser(selectedUser.id);
      setSuccess('User deleted successfully!');
      setDeleteDialogOpen(false);
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await adminApi.updateUser(user.id, { is_active: !user.is_active });
      setSuccess(`User ${!user.is_active ? 'activated' : 'deactivated'} successfully!`);
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user status.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role_id: '',
      department: '',
      position: '',
      phone: '',
      employee_id: '',
      is_active: true
    });
    setFormErrors({});
    setSelectedUser(null);
    setShowPassword(false);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditModalOpen(false);
    resetForm();
  };

  // Get user statistics
  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active !== false).length,
    inactive: users.filter(u => u.is_active === false).length,
    admin: users.filter(u => (u.role || u.Role?.name) === 'admin').length,
    hr: users.filter(u => (u.role || u.Role?.name) === 'hr').length,
    employee: users.filter(u => (u.role || u.Role?.name) === 'employee').length,
  };

  const columns = [
    { 
      key: 'user', 
      header: 'User',
      render: (_, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: row.is_active !== false ? 'primary.main' : 'grey.500' }}>
            {row.name?.charAt(0)?.toUpperCase() || row.email?.charAt(0)?.toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body1" fontWeight={500}>
              {row.name || 'Unnamed User'}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              ID: {row.employee_id || row.id} • {row.email}
            </Typography>
          </Box>
        </Box>
      )
    },
    { 
      key: 'role', 
      header: 'Role',
      render: (_, row) => {
        const roleName = row.role || row.Role?.name || 'employee';
        const config = roleConfig[roleName] || roleConfig.employee;
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
        <Chip 
          label={value || 'Not Assigned'} 
          size="small" 
          variant="outlined"
        />
      )
    },
    { 
      key: 'position', 
      header: 'Position',
      render: (value) => value || '-'
    },
    { 
      key: 'status', 
      header: 'Status',
      render: (_, row) => (
        <Chip
          label={row.is_active !== false ? 'Active' : 'Inactive'}
          color={row.is_active !== false ? 'success' : 'default'}
          size="small"
        />
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="Edit User">
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleEdit(row)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={row.is_active !== false ? "Deactivate User" : "Activate User"}>
            <IconButton
              size="small"
              color={row.is_active !== false ? "warning" : "success"}
              onClick={() => handleToggleStatus(row)}
            >
              {row.is_active !== false ? <BlockIcon /> : <CheckCircleIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete User">
            <IconButton
              size="small"
              color="error"
              onClick={() => {
                setSelectedUser(row);
                setDeleteDialogOpen(true);
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  if (loading) return <Spinner />;

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="600">
          User Management
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Manage system users, roles, and permissions
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
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderTop: '3px solid #4caf50' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="overline">
                Active Users
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {stats.active}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderTop: '3px solid #f44336' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="overline">
                Administrators
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="error">
                {stats.admin}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="overline">
                HR & Employees
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {stats.hr + stats.employee}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Error/Success Alerts */}
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
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Search Users"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or ID..."
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Role</InputLabel>
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                label="Role"
              >
                <MenuItem value="">All Roles</MenuItem>
                {roles.map((role) => (
                  <MenuItem key={role.id || role} value={role.name || role}>
                    {role.label || role.name || role}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack direction="row" spacing={1}>
              <Button
                fullWidth
                onClick={() => {
                  resetForm();
                  setModalOpen(true);
                }}
                startIcon={<PersonAddIcon />}
                variant="contained"
              >
                Add New User
              </Button>
              <Tooltip title="Refresh">
                <IconButton onClick={fetchUsers} color="primary">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Stack>
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
        
        {filteredUsers.length > 0 && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="textSecondary">
              Showing {filteredUsers.length} of {users.length} users
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Add/Edit User Modal */}
      <Modal 
        open={modalOpen || editModalOpen} 
        onClose={handleModalClose} 
        title={editModalOpen ? "Edit User" : "Add New User"}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                margin="normal"
                required
                error={!!formErrors.name}
                helperText={formErrors.name}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                fullWidth
                margin="normal"
                required
                error={!!formErrors.email}
                helperText={formErrors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label={editModalOpen ? "New Password (optional)" : "Password"}
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                fullWidth
                margin="normal"
                required={!editModalOpen}
                error={!!formErrors.password}
                helperText={formErrors.password || (editModalOpen && "Leave blank to keep current password")}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Employee ID"
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                fullWidth
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth margin="normal" error={!!formErrors.role_id}>
                <InputLabel>Role *</InputLabel>
                <Select
                  value={formData.role_id}
                  onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                  label="Role *"
                >
                  {roles.map((role) => (
                    <MenuItem key={role.id || role} value={role.id || role}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {roleConfig[role.name || role]?.icon}
                        {role.label || role.name || role}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.role_id && (
                  <Typography variant="caption" color="error">
                    {formErrors.role_id}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            {editModalOpen && (
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                  }
                  label="Active User"
                />
              </Grid>
            )}
          </Grid>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
            <MuiButton onClick={handleModalClose}>
              Cancel
            </MuiButton>
            <MuiButton 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={submitting}
              startIcon={submitting && <CircularProgress size={20} />}
            >
              {submitting ? 'Saving...' : (editModalOpen ? 'Update User' : 'Create User')}
            </MuiButton>
          </Box>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteIcon color="error" />
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user <strong>{selectedUser?.name || selectedUser?.email}</strong>?
          </Typography>
          <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
            This action cannot be undone. All user data will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => setDeleteDialogOpen(false)}>Cancel</MuiButton>
          <MuiButton 
            onClick={handleDelete} 
            variant="contained" 
            color="error"
            disabled={submitting}
          >
            {submitting ? 'Deleting...' : 'Delete User'}
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

export default UserManagement;