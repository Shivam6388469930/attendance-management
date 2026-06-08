import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Typography,
  Box,
  Paper,
  Alert,
  Grid,
  Card,
  CardContent,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  IconButton,
  Tooltip,
  Stack,
  Avatar,
  TableContainer,
  Table as MuiTable,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableSortLabel,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button as MuiButton,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  DateRange as DateRangeIcon,
  Today as TodayIcon,
  CalendarViewWeek as WeekIcon,
  CalendarViewMonth as MonthIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  GetApp as GetAppIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import Table from '../../components/common/Table';
import Spinner from '../../components/common/Spinner';
import { adminApi } from '../../api';

const AttendanceView = () => {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });
  const [datePreset, setDatePreset] = useState('week');

  // Pagination
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Sorting
  const [orderBy, setOrderBy] = useState('date');
  const [order, setOrder] = useState('desc');

  // Status configuration
  const statusConfig = {
    present: { label: 'Present', color: 'success', icon: <CheckCircleIcon /> },
    absent: { label: 'Absent', color: 'error', icon: <CancelIcon /> },
    late: { label: 'Late', color: 'warning', icon: <PendingIcon /> },
    half_day: { label: 'Half Day', color: 'info', icon: <AccessTimeIcon /> },
    on_leave: { label: 'On Leave', color: 'default', icon: <CancelIcon /> }
  };

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAllAttendance();
      setRecords(response.data || []);
      setFilteredRecords(response.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch attendance records.');
      console.error('Fetch attendance error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Apply date presets
  const applyDatePreset = useCallback((preset) => {
    const today = new Date();
    let startDate = null;
    let endDate = null;

    switch (preset) {
      case 'today':
        startDate = new Date(today.setHours(0, 0, 0, 0));
        endDate = new Date(today.setHours(23, 59, 59, 999));
        break;
      case 'week':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        startDate = startOfWeek;
        endDate = new Date(today.setHours(23, 59, 59, 999));
        break;
      case 'month':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        startDate = startOfMonth;
        endDate = endOfMonth;
        break;
      default:
        return;
    }

    setDateRange({ startDate, endDate });
  }, []);

  // Handle date preset change
  useEffect(() => {
    if (datePreset !== 'custom') {
      applyDatePreset(datePreset);
    }
  }, [datePreset, applyDatePreset]);

  // Apply filters
  useEffect(() => {
    let result = [...records];

    // Search filter (employee name or email)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(record =>
        record.User?.name?.toLowerCase().includes(term) ||
        record.User?.email?.toLowerCase().includes(term) ||
        record.User?.employee_id?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(record => record.status === statusFilter);
    }

    // Date range filter
    if (dateRange.startDate) {
      result = result.filter(record =>
        new Date(record.date) >= dateRange.startDate
      );
    }
    if (dateRange.endDate) {
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59, 999);
      result = result.filter(record =>
        new Date(record.date) <= endDate
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue = a[orderBy];
      let bValue = b[orderBy];

      if (orderBy === 'User') {
        aValue = a.User?.name;
        bValue = b.User?.name;
      } else if (orderBy === 'total_hours') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }

      if (order === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredRecords(result);
    setPage(1);
  }, [records, searchTerm, statusFilter, dateRange, orderBy, order]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateRange({ startDate: null, endDate: null });
    setDatePreset('week');
    setOrderBy('date');
    setOrder('desc');
  };

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Employee Name', 'Employee Email', 'Department', 'Clock In', 'Clock Out', 'Status', 'Total Hours', 'Remarks'];
    const csvData = filteredRecords.map(record => [
      new Date(record.date).toLocaleDateString(),
      record.User?.name || 'N/A',
      record.User?.email || 'N/A',
      record.User?.department || 'N/A',
      record.clock_in_time ? new Date(record.clock_in_time).toLocaleString() : 'N/A',
      record.clock_out_time ? new Date(record.clock_out_time).toLocaleString() : 'N/A',
      record.status || 'N/A',
      record.total_hours || '0',
      record.remarks || ''
    ]);

    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_records_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredRecords.length;
    const present = filteredRecords.filter(r => r.status === 'present').length;
    const absent = filteredRecords.filter(r => r.status === 'absent').length;
    const late = filteredRecords.filter(r => r.status === 'late').length;
    const halfDay = filteredRecords.filter(r => r.status === 'half_day').length;
    const onLeave = filteredRecords.filter(r => r.status === 'on_leave').length;

    const totalHours = filteredRecords.reduce((sum, r) => sum + (parseFloat(r.total_hours) || 0), 0);
    const avgHours = total > 0 ? (totalHours / total).toFixed(1) : 0;
    const attendanceRate = total > 0 ? ((present / total) * 100).toFixed(1) : 0;

    return {
      total,
      present,
      absent,
      late,
      halfDay,
      onLeave,
      totalHours,
      avgHours,
      attendanceRate
    };
  }, [filteredRecords]);

  // Paginated data
  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredRecords.slice(start, end);
  }, [filteredRecords, page, rowsPerPage]);

  const columns = [
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (value) => (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {new Date(value).toLocaleDateString()}
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
      key: 'clock_in_time',
      header: 'Clock In',
      render: (value) => value ? new Date(value).toLocaleTimeString() : 'N/A'
    },
    {
      key: 'clock_out_time',
      header: 'Clock Out',
      render: (value) => value ? new Date(value).toLocaleTimeString() : 'N/A'
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => {
        const config = statusConfig[value] || statusConfig.absent;
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
      key: 'total_hours',
      header: 'Total Hours',
      sortable: true,
      render: (value) => (
        <Typography variant="body2" fontWeight={500}>
          {parseFloat(value || 0).toFixed(1)} hrs
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
              setSelectedRecord(row);
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
            Attendance View
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Monitor and manage employee attendance records
          </Typography>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" variant="overline">
                  Attendance Rate
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {stats.attendanceRate}%
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {stats.present} / {stats.total} days
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" variant="overline">
                  Total Hours
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {stats.totalHours.toFixed(1)} hrs
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Avg: {stats.avgHours} hrs/day
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" variant="overline">
                  Present
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {stats.present}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Late: {stats.late}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" variant="overline">
                  Absent
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="error.main">
                  {stats.absent}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Leave: {stats.onLeave} | Half: {stats.halfDay}
                </Typography>
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
          >
            {error}
          </Alert>
        )}

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
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Search Employee"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or email..."
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
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="present">Present</MenuItem>
                  <MenuItem value="absent">Absent</MenuItem>
                  <MenuItem value="late">Late</MenuItem>
                  <MenuItem value="half_day">Half Day</MenuItem>
                  <MenuItem value="on_leave">On Leave</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <ToggleButtonGroup
                value={datePreset}
                exclusive
                onChange={(e, value) => value && setDatePreset(value)}
                size="small"
                fullWidth
              >
                <ToggleButton value="today">
                  <TodayIcon fontSize="small" />
                </ToggleButton>
                <ToggleButton value="week">
                  <WeekIcon fontSize="small" />
                </ToggleButton>
                <ToggleButton value="month">
                  <MonthIcon fontSize="small" />
                </ToggleButton>
                <ToggleButton value="custom">
                  <DateRangeIcon fontSize="small" />
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>
            {datePreset === 'custom' && (
              <>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <DatePicker
                    label="Start Date"
                    value={dateRange.startDate}
                    onChange={(date) => setDateRange({ ...dateRange, startDate: date })}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <DatePicker
                    label="End Date"
                    value={dateRange.endDate}
                    onChange={(date) => setDateRange({ ...dateRange, endDate: date })}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </Grid>
              </>
            )}
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchAttendance} color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export to CSV">
              <IconButton onClick={exportToCSV} color="success">
                <GetAppIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>

        {/* Attendance Table */}
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
                {paginatedRecords.map((record, index) => (
                  <TableRow key={record.id || index} hover>
                    {columns.map((col) => (
                      <TableCell key={col.key}>
                        {col.render
                          ? col.render(record[col.key], record)
                          : record[col.key] || '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {paginatedRecords.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={columns.length} align="center">
                      <Box sx={{ py: 4 }}>
                        <Typography color="textSecondary">
                          No attendance records found
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </MuiTable>
          </TableContainer>

          {/* Pagination */}
          {filteredRecords.length > 0 && (
            <Stack spacing={2} alignItems="center" sx={{ mt: 2 }}>
              <Pagination
                count={Math.ceil(filteredRecords.length / rowsPerPage)}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
                showFirstButton
                showLastButton
              />
              <Typography variant="caption" color="textSecondary">
                Showing {((page - 1) * rowsPerPage) + 1} to {Math.min(page * rowsPerPage, filteredRecords.length)} of {filteredRecords.length} entries
              </Typography>
            </Stack>
          )}
        </Paper>

        {/* Details Dialog */}
        <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Attendance Details
            <IconButton
              sx={{ position: 'absolute', right: 8, top: 8 }}
              onClick={() => setDetailsOpen(false)}
            >
              <ClearIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {selectedRecord && (
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
                      {selectedRecord.User?.name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {selectedRecord.User?.name || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {selectedRecord.User?.email}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {selectedRecord.User?.department} • {selectedRecord.User?.position}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="textSecondary">Date</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {new Date(selectedRecord.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="textSecondary">Status</Typography>
                  <Box mt={0.5}>
                    <Chip
                      icon={statusConfig[selectedRecord.status]?.icon}
                      label={statusConfig[selectedRecord.status]?.label}
                      color={statusConfig[selectedRecord.status]?.color}
                    />
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="textSecondary">Clock In Time</Typography>
                  <Typography variant="body1">
                    {selectedRecord.clock_in_time ? new Date(selectedRecord.clock_in_time).toLocaleString() : 'N/A'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="textSecondary">Clock Out Time</Typography>
                  <Typography variant="body1">
                    {selectedRecord.clock_out_time ? new Date(selectedRecord.clock_out_time).toLocaleString() : 'N/A'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="textSecondary">Total Hours</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {parseFloat(selectedRecord.total_hours || 0).toFixed(2)} hours
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="textSecondary">Overtime Hours</Typography>
                  <Typography variant="body1">
                    {parseFloat(selectedRecord.overtime_hours || 0).toFixed(2)} hours
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="textSecondary">Remarks</Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: '#f5f5f5' }}>
                    <Typography variant="body2">
                      {selectedRecord.remarks || 'No remarks provided'}
                    </Typography>
                  </Paper>
                </Grid>
                {selectedRecord.late_minutes > 0 && (
                  <Grid size={{ xs: 12 }}>
                    <Alert severity="warning" icon={<PendingIcon />}>
                      Employee was late by {selectedRecord.late_minutes} minutes
                    </Alert>
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

export default AttendanceView;