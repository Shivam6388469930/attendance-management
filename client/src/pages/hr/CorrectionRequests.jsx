import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Typography,
  Box,
  Paper,
  Alert,
  TextField,
  Button as MuiButton,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Stack,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  Table as MuiTable,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableSortLabel,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Divider,
  Tabs,
  Tab,
  LinearProgress
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  GetApp as GetAppIcon,
  History as HistoryIcon,
  EventNote as EventNoteIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  Comment as CommentIcon,
  Warning as WarningIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import { correctionApi } from '../../api';

const CorrectionRequests = () => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [action, setAction] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [tabValue, setTabValue] = useState(0);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Sorting
  const [orderBy, setOrderBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await correctionApi.getAllRequests();
      setRequests(response.data || []);
      setFilteredRequests(response.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch correction requests.');
      console.error('Fetch requests error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Apply filters
  useEffect(() => {
    let result = [...requests];
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(request =>
        request.User?.name?.toLowerCase().includes(term) ||
        request.User?.email?.toLowerCase().includes(term) ||
        request.id?.toString().includes(term) ||
        request.request_type?.toLowerCase().includes(term)
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(request => request.status === statusFilter);
    }
    
    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(request => request.request_type === typeFilter);
    }
    
    // Tab filter
    if (tabValue === 0) {
      // All requests - no additional filter
    } else if (tabValue === 1) {
      result = result.filter(request => request.status === 'pending');
    } else if (tabValue === 2) {
      result = result.filter(request => request.status === 'approved');
    } else if (tabValue === 3) {
      result = result.filter(request => request.status === 'rejected');
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let aValue = a[orderBy];
      let bValue = b[orderBy];
      
      if (orderBy === 'User') {
        aValue = a.User?.name;
        bValue = b.User?.name;
      } else if (orderBy === 'createdAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (order === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredRequests(result);
    setPage(1);
  }, [requests, searchTerm, statusFilter, typeFilter, tabValue, orderBy, order]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setTabValue(0);
    setOrderBy('createdAt');
    setOrder('desc');
  };

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleAction = (request, actionType) => {
    setSelectedRequest(request);
    setAction(actionType);
    setRemarks('');
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (action === 'approve') {
        await correctionApi.approveRequest(selectedRequest.id, remarks);
        setSuccess('Request approved successfully!');
      } else {
        await correctionApi.rejectRequest(selectedRequest.id, remarks);
        setSuccess('Request rejected successfully!');
      }
      setModalOpen(false);
      await fetchRequests();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update correction request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setDetailsOpen(true);
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'approved':
        return { label: 'Approved', color: 'success', icon: <CheckCircleIcon /> };
      case 'rejected':
        return { label: 'Rejected', color: 'error', icon: <CancelIcon /> };
      default:
        return { label: 'Pending', color: 'warning', icon: <PendingIcon /> };
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'clock_in':
        return <AccessTimeIcon />;
      case 'clock_out':
        return <AccessTimeIcon />;
      case 'date_change':
        return <EventNoteIcon />;
      default:
        return <HistoryIcon />;
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter(r => r.status === 'pending').length;
    const approved = requests.filter(r => r.status === 'approved').length;
    const rejected = requests.filter(r => r.status === 'rejected').length;
    const clockInRequests = requests.filter(r => r.request_type === 'clock_in').length;
    const clockOutRequests = requests.filter(r => r.request_type === 'clock_out').length;
    const dateChangeRequests = requests.filter(r => r.request_type === 'date_change').length;
    
    return {
      total,
      pending,
      approved,
      rejected,
      clockInRequests,
      clockOutRequests,
      dateChangeRequests,
      approvalRate: total > 0 ? ((approved / total) * 100).toFixed(1) : 0
    };
  }, [requests]);

  // Paginated data
  const paginatedRequests = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredRequests.slice(start, end);
  }, [filteredRequests, page, rowsPerPage]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['ID', 'Employee Name', 'Employee Email', 'Request Type', 'Date', 'Status', 'Request Details', 'Admin Remarks', 'Created At', 'Updated At'];
    const csvData = filteredRequests.map(request => [
      request.id,
      request.User?.name || 'N/A',
      request.User?.email || 'N/A',
      request.request_type,
      request.date,
      request.status,
      request.reason || 'N/A',
      request.reviewer_remarks || 'N/A',
      new Date(request.createdAt).toLocaleString(),
      new Date(request.updatedAt).toLocaleString()
    ]);
    
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `correction_requests_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    { 
      key: 'id', 
      header: 'ID',
      sortable: true,
      render: (value) => (
        <Typography variant="body2" fontWeight={500}>
          #{value}
        </Typography>
      )
    },
    { 
      key: 'User', 
      header: 'Employee',
      sortable: true,
      render: (_, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
            {row.User?.name?.charAt(0)?.toUpperCase() || <PersonIcon />}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={500}>
              {row.User?.name || 'N/A'}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {row.User?.email}
            </Typography>
          </Box>
        </Box>
      )
    },
    { 
      key: 'request_type', 
      header: 'Request Type',
      render: (value) => (
        <Chip
          icon={getTypeIcon(value)}
          label={value?.replace('_', ' ').toUpperCase()}
          size="small"
          variant="outlined"
        />
      )
    },
    { 
      key: 'date', 
      header: 'Date',
      render: (value) => new Date(value).toLocaleDateString()
    },
    { 
      key: 'status', 
      header: 'Status',
      render: (value) => {
        const config = getStatusConfig(value);
        return (
          <Chip
            icon={config.icon}
            label={config.label}
            color={config.color}
            size="small"
            sx={{ fontWeight: 500 }}
          />
        );
      }
    },
    {
      key: 'createdAt',
      header: 'Requested On',
      sortable: true,
      render: (value) => new Date(value).toLocaleString()
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={() => handleViewDetails(row)}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {row.status === 'pending' && (
            <>
              <Tooltip title="Approve">
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => handleAction(row, 'approve')}
                >
                  <CheckCircleIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reject">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleAction(row, 'reject')}
                >
                  <CancelIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
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
          Correction Requests
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Manage and review attendance correction requests from employees
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="overline">
                Total Requests
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderTop: '3px solid #ff9800' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="overline">
                Pending
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {stats.pending}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Awaiting review
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderTop: '3px solid #4caf50' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="overline">
                Approved
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {stats.approved}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Approval Rate: {stats.approvalRate}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderTop: '3px solid #f44336' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="overline">
                Rejected
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="error.main">
                {stats.rejected}
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
        >
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label={`All (${stats.total})`} />
          <Tab label={`Pending (${stats.pending})`} />
          <Tab label={`Approved (${stats.approved})`} />
          <Tab label={`Rejected (${stats.rejected})`} />
        </Tabs>
      </Paper>

      {/* Filters Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="600">
            Filters
          </Typography>
          <Tooltip title="Clear all filters">
            <IconButton onClick={clearFilters} size="small">
              <ClearIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              fullWidth
              label="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by employee name, email, or request ID..."
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Request Type</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                label="Request Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="clock_in">Clock In</MenuItem>
                <MenuItem value="clock_out">Clock Out</MenuItem>
                <MenuItem value="date_change">Date Change</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <Button
              fullWidth
              onClick={fetchRequests}
              startIcon={<RefreshIcon />}
              variant="outlined"
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Tooltip title="Export to CSV">
            <IconButton onClick={exportToCSV} color="success">
              <GetAppIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Requests Table */}
      <Paper sx={{ p: 2, overflowX: 'auto' }}>
        <TableContainer>
          <MuiTable>
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    {col.sortable ? (
                      <TableSortLabel
                        active={orderBy === col.key}
                        direction={orderBy === col.key ? order : 'asc'}
                        onClick={() => handleSort(col.key)}
                      >
                        {col.header}
                      </TableSortLabel>
                    ) : (
                      col.header
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRequests.map((request) => (
                <TableRow key={request.id} hover>
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      {col.render 
                        ? col.render(request[col.key], request)
                        : request[col.key] || '-'}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {paginatedRequests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center">
                    <Box sx={{ py: 4 }}>
                      <Typography color="textSecondary">
                        No correction requests found
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </MuiTable>
        </TableContainer>
        
        {/* Pagination */}
        {filteredRequests.length > 0 && (
          <Stack spacing={2} alignItems="center" sx={{ mt: 2 }}>
            <Pagination
              count={Math.ceil(filteredRequests.length / rowsPerPage)}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
              showFirstButton
              showLastButton
            />
            <Typography variant="caption" color="textSecondary">
              Showing {((page - 1) * rowsPerPage) + 1} to {Math.min(page * rowsPerPage, filteredRequests.length)} of {filteredRequests.length} entries
            </Typography>
          </Stack>
        )}
      </Paper>

      {/* Action Modal (Approve/Reject) */}
      <Modal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={`${action === 'approve' ? 'Approve' : 'Reject'} Correction Request`}
        maxWidth="sm"
        fullWidth
      >
        <Box sx={{ p: 2 }}>
          {selectedRequest && (
            <>
              <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Request Details
                </Typography>
                <Typography variant="body2">
                  <strong>Employee:</strong> {selectedRequest.User?.name}
                </Typography>
                <Typography variant="body2">
                  <strong>Type:</strong> {selectedRequest.request_type}
                </Typography>
                <Typography variant="body2">
                  <strong>Date:</strong> {new Date(selectedRequest.date).toLocaleDateString()}
                </Typography>
                {selectedRequest.reason && (
                  <Typography variant="body2">
                    <strong>Reason:</strong> {selectedRequest.reason}
                  </Typography>
                )}
              </Box>
              
              <Alert severity={action === 'approve' ? 'info' : 'warning'} sx={{ mb: 2 }}>
                Are you sure you want to <strong>{action}</strong> this correction request?
              </Alert>
              
              <TextField
                label="Remarks (Optional)"
                multiline
                rows={4}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                fullWidth
                margin="normal"
                placeholder="Add any additional comments or notes..."
              />
              
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                <MuiButton onClick={() => setModalOpen(false)}>
                  Cancel
                </MuiButton>
                <MuiButton
                  variant="contained"
                  color={action === 'approve' ? 'success' : 'error'}
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? 'Processing...' : (action === 'approve' ? 'Approve' : 'Reject')}
                </MuiButton>
              </Box>
            </>
          )}
        </Box>
      </Modal>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Request Details
          <IconButton
            sx={{ position: 'absolute', right: 8, top: 8 }}
            onClick={() => setDetailsOpen(false)}
          >
            <ClearIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedRequest && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
                    {selectedRequest.User?.name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {selectedRequest.User?.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {selectedRequest.User?.email}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Employee ID: {selectedRequest.User?.employee_id || 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ ml: 'auto' }}>
                    <Chip
                      icon={getStatusConfig(selectedRequest.status).icon}
                      label={getStatusConfig(selectedRequest.status).label}
                      color={getStatusConfig(selectedRequest.status).color}
                      size="medium"
                    />
                  </Box>
                </Box>
              </Grid>
              
              <Grid size={{ xs: 12 }}>
                <Divider />
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="textSecondary">
                  Request ID
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  #{selectedRequest.id}
                </Typography>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="textSecondary">
                  Request Type
                </Typography>
                <Box mt={0.5}>
                  <Chip
                    icon={getTypeIcon(selectedRequest.request_type)}
                    label={selectedRequest.request_type?.replace('_', ' ').toUpperCase()}
                    variant="outlined"
                  />
                </Box>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="textSecondary">
                  Request Date
                </Typography>
                <Typography variant="body1">
                  {new Date(selectedRequest.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Typography>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="textSecondary">
                  Requested On
                </Typography>
                <Typography variant="body1">
                  {new Date(selectedRequest.createdAt).toLocaleString()}
                </Typography>
              </Grid>
              
              {selectedRequest.reason && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="textSecondary">
                    Reason
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: '#fff3e0' }}>
                    <Typography variant="body2">
                      {selectedRequest.reason}
                    </Typography>
                  </Paper>
                </Grid>
              )}

              {selectedRequest.reviewer_remarks && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="textSecondary">
                    Reviewer Remarks
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: '#e8f5e9' }}>
                    <Typography variant="body2">
                      {selectedRequest.reviewer_remarks}
                    </Typography>
                  </Paper>
                </Grid>
              )}
              
              {selectedRequest.status !== 'pending' && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="textSecondary">
                    Processed On
                  </Typography>
                  <Typography variant="body2">
                    {new Date(selectedRequest.updatedAt).toLocaleString()}
                  </Typography>
                </Grid>
              )}
              
              {selectedRequest.old_value && selectedRequest.new_value && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="textSecondary">
                    Changes
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                    <Typography variant="body2">
                      <strong>Old Value:</strong> {selectedRequest.old_value}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>New Value:</strong> {selectedRequest.new_value}
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          {selectedRequest?.status === 'pending' && (
            <>
              <MuiButton
                onClick={() => {
                  setDetailsOpen(false);
                  handleAction(selectedRequest, 'reject');
                }}
                color="error"
              >
                Reject
              </MuiButton>
              <MuiButton
                onClick={() => {
                  setDetailsOpen(false);
                  handleAction(selectedRequest, 'approve');
                }}
                variant="contained"
                color="success"
              >
                Approve
              </MuiButton>
            </>
          )}
          <MuiButton onClick={() => setDetailsOpen(false)}>Close</MuiButton>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      {success && (
        <Alert 
          severity="success" 
          sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 2000 }}
          onClose={() => setSuccess('')}
        >
          {success}
        </Alert>
      )}
    </Box>
  );
};

export default CorrectionRequests;