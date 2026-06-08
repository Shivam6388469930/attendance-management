import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Typography,
  Box,
  Paper,
  Alert,
  TextField,
  MenuItem,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Pagination,
  Stack,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button as MuiButton,
  TableContainer,
  Table as MuiTable,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableSortLabel,
  Avatar
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  EventNote as EventNoteIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import Table from '../../components/common/Table';
import Spinner from '../../components/common/Spinner';
import { adminApi } from '../../api';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    actor_id: '',
    target_table: '',
    startDate: null,
    endDate: null
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Sorting
  const [orderBy, setOrderBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');

  // Action types with icons
  const actionTypes = {
    CREATE: { label: 'Create', icon: <AddIcon />, color: 'success' },
    UPDATE: { label: 'Update', icon: <EditIcon />, color: 'info' },
    DELETE: { label: 'Delete', icon: <DeleteIcon />, color: 'error' },
    LOGIN: { label: 'Login', icon: <LoginIcon />, color: 'primary' },
    LOGOUT: { label: 'Logout', icon: <LogoutIcon />, color: 'default' },
    ATTENDANCE_MARK: { label: 'Attendance', icon: <EventNoteIcon />, color: 'warning' }
  };

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAuditLogs();
      const logsData = response.data || [];
      setLogs(logsData);
      setFilteredLogs(logsData);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch audit logs.');
      console.error('Fetch logs error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Apply filters
  useEffect(() => {
    let result = [...logs];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(log =>
        log.action?.toLowerCase().includes(searchLower) ||
        log.target_table?.toLowerCase().includes(searchLower) ||
        log.User?.email?.toLowerCase().includes(searchLower) ||
        log.User?.name?.toLowerCase().includes(searchLower)
      );
    }

    // Action filter
    if (filters.action) {
      result = result.filter(log => log.action === filters.action);
    }

    // Actor ID filter
    if (filters.actor_id) {
      result = result.filter(log =>
        log.actor_id?.toString().includes(filters.actor_id)
      );
    }

    // Target table filter
    if (filters.target_table) {
      result = result.filter(log =>
        log.target_table?.toLowerCase().includes(filters.target_table.toLowerCase())
      );
    }

    // Date range filter
    if (filters.startDate) {
      result = result.filter(log =>
        new Date(log.createdAt) >= filters.startDate
      );
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      result = result.filter(log =>
        new Date(log.createdAt) <= endDate
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      const aValue = a[orderBy];
      const bValue = b[orderBy];
      if (order === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredLogs(result);
    setPage(1);
  }, [logs, filters, orderBy, order]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      action: '',
      actor_id: '',
      target_table: '',
      startDate: null,
      endDate: null
    });
    setOrderBy('createdAt');
    setOrder('desc');
  };

  // Handle sort
  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Export logs to CSV
  const exportToCSV = () => {
    const headers = ['Timestamp', 'Actor', 'Action', 'Target Table', 'Target ID', 'IP Address'];
    const csvData = filteredLogs.map(log => [
      new Date(log.createdAt).toLocaleString(),
      `${log.User?.name || log.User?.email || 'Unknown'} (ID: ${log.actor_id})`,
      log.action,
      log.target_table,
      log.target_id,
      log.ip_address || 'N/A'
    ]);

    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get unique values for filters
  const uniqueActions = useMemo(() => {
    const actions = new Set(logs.map(log => log.action).filter(Boolean));
    return Array.from(actions);
  }, [logs]);

  const uniqueTables = useMemo(() => {
    const tables = new Set(logs.map(log => log.target_table).filter(Boolean));
    return Array.from(tables);
  }, [logs]);

  // Paginated data
  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredLogs.slice(start, end);
  }, [filteredLogs, page, rowsPerPage]);

  // Table columns configuration
  const columns = [
    {
      key: 'createdAt',
      header: 'Timestamp',
      sortable: true,
      render: (value) => (
        <Tooltip title={new Date(value).toLocaleString()}>
          <Typography variant="body2" sx={{ minWidth: 160 }}>
            {new Date(value).toLocaleString()}
          </Typography>
        </Tooltip>
      )
    },
    {
      key: 'actor',
      header: 'Actor',
      render: (_, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light' }}>
            {row.User?.name?.charAt(0) || row.User?.email?.charAt(0) || <PersonIcon />}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={500}>
              {row.User?.name || row.User?.email || `User ${row.actor_id}`}
            </Typography>
            {row.User?.email && row.User?.name && (
              <Typography variant="caption" color="textSecondary">
                {row.User.email}
              </Typography>
            )}
          </Box>
        </Box>
      )
    },
    {
      key: 'action',
      header: 'Action',
      render: (value) => {
        const action = actionTypes[value] || { label: value, icon: null, color: 'default' };
        return (
          <Chip
            icon={action.icon}
            label={action.label}
            color={action.color}
            size="small"
            sx={{ fontWeight: 500 }}
          />
        );
      }
    },
    {
      key: 'target_table',
      header: 'Target Table',
      render: (value) => (
        <Chip
          label={value || 'N/A'}
          size="small"
          variant="outlined"
          sx={{ fontFamily: 'monospace' }}
        />
      )
    },
    { key: 'target_id', header: 'Target ID' },
    {
      key: 'details',
      header: 'Details',
      render: (value) => (
        <Typography
          variant="body2"
          sx={{
            maxWidth: 300,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {value || '-'}
        </Typography>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <Tooltip title="View Details">
          <IconButton
            size="small"
            onClick={() => {
              setSelectedLog(row);
              setDetailsOpen(true);
            }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    }
  ];

  if (loading) return <Spinner />;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom fontWeight="600">
            Audit Logs
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Track all system activities, user actions, and data changes
          </Typography>
        </Box>

        {/* Stats Summary */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent sx={{ py: 2 }}>
                <Typography color="textSecondary" variant="overline">
                  Total Logs
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {logs.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent sx={{ py: 2 }}>
                <Typography color="textSecondary" variant="overline">
                  Filtered Results
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="primary">
                  {filteredLogs.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent sx={{ py: 2 }}>
                <Typography color="textSecondary" variant="overline">
                  Unique Actions
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {uniqueActions.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent sx={{ py: 2 }}>
                <Typography color="textSecondary" variant="overline">
                  Date Range
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {logs.length > 0 ? (
                    <>
                      {new Date(Math.min(...logs.map(l => new Date(l.createdAt)))).toLocaleDateString()}
                      {' - '}
                      {new Date(Math.max(...logs.map(l => new Date(l.createdAt)))).toLocaleDateString()}
                    </>
                  ) : 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Filters Section */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="600">
              <FilterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Filters
            </Typography>
            <Tooltip title="Clear all filters">
              <IconButton onClick={clearFilters} size="small">
                <ClearIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Search"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search by action, table, details, or user..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Action Type</InputLabel>
                <Select
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                  label="Action Type"
                >
                  <MenuItem value="">All</MenuItem>
                  {uniqueActions.map(action => (
                    <MenuItem key={action} value={action}>
                      {action}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <TextField
                fullWidth
                label="User ID"
                value={filters.actor_id}
                onChange={(e) => handleFilterChange('actor_id', e.target.value)}
                type="number"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Target Table</InputLabel>
                <Select
                  value={filters.target_table}
                  onChange={(e) => handleFilterChange('target_table', e.target.value)}
                  label="Target Table"
                >
                  <MenuItem value="">All</MenuItem>
                  {uniqueTables.map(table => (
                    <MenuItem key={table} value={table}>
                      {table}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={(date) => handleFilterChange('startDate', date)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={(date) => handleFilterChange('endDate', date)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchLogs} color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export to CSV">
              <IconButton onClick={exportToCSV} color="success">
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>

        {/* Logs Table */}
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
                {paginatedLogs.map((log, index) => (
                  <TableRow key={log.id || index} hover>
                    {columns.map((col) => (
                      <TableCell key={col.key}>
                        {col.render
                          ? col.render(log[col.key], log)
                          : log[col.key] || '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {paginatedLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={columns.length} align="center">
                      <Box sx={{ py: 4 }}>
                        <Typography color="textSecondary">
                          No audit logs found
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </MuiTable>
          </TableContainer>

          {/* Pagination */}
          {filteredLogs.length > 0 && (
            <Stack spacing={2} alignItems="center" sx={{ mt: 2 }}>
              <Pagination
                count={Math.ceil(filteredLogs.length / rowsPerPage)}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
                showFirstButton
                showLastButton
              />
              <Typography variant="caption" color="textSecondary">
                Showing {((page - 1) * rowsPerPage) + 1} to {Math.min(page * rowsPerPage, filteredLogs.length)} of {filteredLogs.length} entries
              </Typography>
            </Stack>
          )}
        </Paper>

        {/* Log Details Dialog */}
        <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Log Details
            <IconButton
              sx={{ position: 'absolute', right: 8, top: 8 }}
              onClick={() => setDetailsOpen(false)}
            >
              <ClearIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {selectedLog && (
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="textSecondary">Timestamp</Typography>
                  <Typography variant="body1">
                    {new Date(selectedLog.createdAt).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="textSecondary">Action</Typography>
                  <Box mt={0.5}>
                    <Chip
                      icon={actionTypes[selectedLog.action]?.icon}
                      label={selectedLog.action}
                      color={actionTypes[selectedLog.action]?.color}
                    />
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="textSecondary">Actor</Typography>
                  <Typography variant="body1">
                    {selectedLog.User?.name || selectedLog.User?.email || `User ${selectedLog.actor_id}`}
                    {selectedLog.User?.email && selectedLog.User?.name && (
                      <Typography variant="caption" display="block" color="textSecondary">
                        {selectedLog.User.email}
                      </Typography>
                    )}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="textSecondary">IP Address</Typography>
                  <Typography variant="body1" fontFamily="monospace">
                    {selectedLog.ip_address || 'N/A'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="textSecondary">Target Table</Typography>
                  <Typography variant="body1">{selectedLog.target_table || 'N/A'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="textSecondary">Target ID</Typography>
                  <Typography variant="body1">{selectedLog.target_id || 'N/A'}</Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="textSecondary">Details</Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: '#f5f5f5' }}>
                    <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                      {selectedLog.details || 'No additional details'}
                    </Typography>
                  </Paper>
                </Grid>
                {selectedLog.old_value && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="textSecondary">Old Values</Typography>
                    <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: '#fff3e0' }}>
                      <Typography variant="body2" component="pre" style={{ whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(selectedLog.old_value, null, 2)}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
                {selectedLog.new_value && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="textSecondary">New Values</Typography>
                    <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: '#e8f5e9' }}>
                      <Typography variant="body2" component="pre" style={{ whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(selectedLog.new_value, null, 2)}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <MuiButton onClick={() => setDetailsOpen(false)}>Close</MuiButton>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default AuditLogs;