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
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  LinearProgress,
  Button as MuiButton
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
  Today as TodayIcon,
  CalendarViewWeek as WeekIcon,
  CalendarViewMonth as MonthIcon,
  DateRange as DateRangeIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  AccessTime as AccessTimeIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import Table from '../../components/common/Table';
import Spinner from '../../components/common/Spinner';
import { attendanceApi } from '../../api';

const AttendanceHistory = () => {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });
  const [datePreset, setDatePreset] = useState('month');

  // Pagination
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Sorting
  const [orderBy, setOrderBy] = useState('date');
  const [order, setOrder] = useState('desc');

  // Status configuration
  const statusConfig = {
    present: { label: 'Present', color: 'success', icon: <CheckCircleIcon />, score: 100 },
    late: { label: 'Late', color: 'warning', icon: <PendingIcon />, score: 70 },
    half_day: { label: 'Half Day', color: 'info', icon: <AccessTimeIcon />, score: 50 },
    absent: { label: 'Absent', color: 'error', icon: <CancelIcon />, score: 0 },
    on_leave: { label: 'On Leave', color: 'default', icon: <CancelIcon />, score: 0 }
  };

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await attendanceApi.getHistory(1, 1000);
      setRecords(response.data.rows || []);
      setFilteredRecords(response.data.rows || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch attendance history.');
      console.error('Fetch history error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

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

    // Search filter (date or status)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(record =>
        record.date?.toLowerCase().includes(term) ||
        record.status?.toLowerCase().includes(term) ||
        record.total_hours?.toString().includes(term)
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

      if (orderBy === 'total_hours') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      } else if (orderBy === 'date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
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
    setDatePreset('month');
    setOrderBy('date');
    setOrder('desc');
  };

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredRecords.length;
    const present = filteredRecords.filter(r => r.status === 'present').length;
    const late = filteredRecords.filter(r => r.status === 'late').length;
    const halfDay = filteredRecords.filter(r => r.status === 'half_day').length;
    const absent = filteredRecords.filter(r => r.status === 'absent').length;
    const onLeave = filteredRecords.filter(r => r.status === 'on_leave').length;

    const totalHours = filteredRecords.reduce((sum, r) => sum + (parseFloat(r.total_hours) || 0), 0);
    const avgHours = total > 0 ? (totalHours / total).toFixed(1) : 0;
    const attendanceRate = total > 0 ? (((present + late + halfDay) / total) * 100).toFixed(1) : 0;

    // Calculate trend (compare with previous period)
    const currentPeriodScore = ((present + late * 0.7 + halfDay * 0.5) / total) * 100 || 0;

    return {
      total,
      present,
      late,
      halfDay,
      absent,
      onLeave,
      totalHours: totalHours.toFixed(1),
      avgHours,
      attendanceRate,
      performanceScore: currentPeriodScore.toFixed(1)
    };
  }, [filteredRecords]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Clock In Time', 'Clock Out Time', 'Status', 'Total Hours', 'Remarks'];
    const csvData = filteredRecords.map(record => [
      new Date(record.date).toLocaleDateString(),
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
    a.download = `attendance_history_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
        <Typography variant="body2" fontWeight={500}>
          {new Date(value).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </Typography>
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
      key: 'remarks',
      header: 'Remarks',
      render: (value) => (
        <Typography variant="body2" color="textSecondary" noWrap sx={{ maxWidth: 200 }}>
          {value || '-'}
        </Typography>
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
            Attendance History
          </Typography>
          <Typography variant="body2" color="textSecondary">
            View your complete attendance records and performance metrics
          </Typography>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      Attendance Rate
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      {stats.attendanceRate}%
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {stats.present + stats.late + stats.halfDay} / {stats.total} days
                    </Typography>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 40, color: '#4caf50', opacity: 0.7 }} />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={stats.attendanceRate}
                  sx={{ mt: 2, height: 6, borderRadius: 3 }}
                  color="success"
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="overline">
                  Total Hours
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {stats.totalHours} hrs
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
                <Typography color="textSecondary" gutterBottom variant="overline">
                  Performance Score
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {stats.performanceScore}%
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Based on attendance quality
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="overline">
                  Present Days
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={`Present: ${stats.present}`}
                    size="small"
                    color="success"
                    icon={<CheckCircleIcon />}
                  />
                  <Chip
                    label={`Late: ${stats.late}`}
                    size="small"
                    color="warning"
                    icon={<PendingIcon />}
                  />
                  <Chip
                    label={`Absent: ${stats.absent}`}
                    size="small"
                    color="error"
                    icon={<CancelIcon />}
                  />
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
                label="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by date or status..."
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
                  <MenuItem value="late">Late</MenuItem>
                  <MenuItem value="half_day">Half Day</MenuItem>
                  <MenuItem value="absent">Absent</MenuItem>
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
              <IconButton onClick={fetchHistory} color="primary">
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
                        <MuiButton
                          variant="outlined"
                          onClick={clearFilters}
                          sx={{ mt: 2 }}
                        >
                          Clear Filters
                        </MuiButton>
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
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <FormControl size="small">
                  <Select
                    value={rowsPerPage}
                    onChange={(e) => setRowsPerPage(parseInt(e.target.value))}
                    sx={{ minWidth: 80 }}
                  >
                    <MenuItem value={5}>5</MenuItem>
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={25}>25</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                  </Select>
                </FormControl>
                <Typography variant="caption" color="textSecondary">
                  Showing {((page - 1) * rowsPerPage) + 1} to {Math.min(page * rowsPerPage, filteredRecords.length)} of {filteredRecords.length} entries
                </Typography>
              </Box>
            </Stack>
          )}
        </Paper>

        {/* Summary Section */}
        {filteredRecords.length > 0 && (
          <Paper sx={{ p: 2, mt: 3, bgcolor: '#f5f7fa' }}>
            <Typography variant="subtitle2" gutterBottom>
              Attendance Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Total Working Days:</Typography>
                  <Typography variant="body2" fontWeight={500}>{stats.total}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Present Days:</Typography>
                  <Typography variant="body2" fontWeight={500} color="success.main">{stats.present}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Late Days:</Typography>
                  <Typography variant="body2" fontWeight={500} color="warning.main">{stats.late}</Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Half Days:</Typography>
                  <Typography variant="body2" fontWeight={500} color="info.main">{stats.halfDay}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Absent Days:</Typography>
                  <Typography variant="body2" fontWeight={500} color="error.main">{stats.absent}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">On Leave:</Typography>
                  <Typography variant="body2" fontWeight={500}>{stats.onLeave}</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default AttendanceHistory;