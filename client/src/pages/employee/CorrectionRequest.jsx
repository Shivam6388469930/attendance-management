import React, { useEffect, useState } from 'react';
import { Typography, Box, Paper, Alert, TextField, MenuItem, Button as MuiButton } from '@mui/material';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import { correctionApi, attendanceApi } from '../../api';
import { useAuth } from '../../context/AuthContext';

const CorrectionRequest = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    attendance_record_id: '',
    request_type: '',
    date: '',
    corrected_time: '',
    reason: '',
  });

  const fetchRequests = async () => {
    try {
      const response = await correctionApi.getMyRequests();
      setRequests(response.data);
    } catch (err) {
      setError('Failed to fetch correction requests.');
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      const response = await attendanceApi.getHistory(1, 1000);
      setAttendanceRecords(response.data.rows || []);
    } catch (err) {
      setError('Failed to fetch attendance records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchAttendanceRecords();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await correctionApi.createRequest(formData);
      setModalOpen(false);
      setFormData({ attendance_record_id: '', request_type: '', date: '', corrected_time: '', reason: '' });
      await fetchRequests();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create correction request.');
    }
  };

  const requestTypeOptions = [
    { value: 'missed_in', label: 'Missed Clock-in' },
    { value: 'missed_out', label: 'Missed Clock-out' },
    { value: 'wrong_in', label: 'Wrong Clock-in Time' },
    { value: 'wrong_out', label: 'Wrong Clock-out Time' },
  ];

  const columns = [
    { key: 'date', header: 'Date', render: (value) => value ? new Date(value).toLocaleDateString() : '-' },
    { key: 'request_type', header: 'Request Type' },
    { key: 'corrected_time', header: 'Corrected Time', render: (value) => value ? new Date(value).toLocaleString() : 'N/A' },
    { key: 'reason', header: 'Reason' },
    { key: 'status', header: 'Status' },
  ];

  if (loading) return <Spinner />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Correction Requests
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Button onClick={() => setModalOpen(true)} sx={{ mb: 2 }}>
        Raise Correction Request
      </Button>
      <Paper sx={{ p: 2 }}>
        <Table columns={columns} data={requests} />
      </Paper>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Raise Correction Request">
        <form onSubmit={handleSubmit}>
          <TextField
            select
            label="Attendance Record"
            value={formData.attendance_record_id}
            onChange={(e) => setFormData({ ...formData, attendance_record_id: e.target.value })}
            fullWidth
            margin="normal"
            required
          >
            {attendanceRecords.map((record) => (
              <MenuItem key={record.id} value={record.id}>
                {new Date(record.date).toLocaleDateString()} - {record.status}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Request Type"
            value={formData.request_type}
            onChange={(e) => setFormData({ ...formData, request_type: e.target.value })}
            fullWidth
            margin="normal"
            required
          >
            {requestTypeOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            label="Corrected Time"
            type="datetime-local"
            value={formData.corrected_time}
            onChange={(e) => setFormData({ ...formData, corrected_time: e.target.value })}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            label="Reason"
            multiline
            rows={4}
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            fullWidth
            margin="normal"
            required
          />
          <MuiButton type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
            Submit
          </MuiButton>
        </form>
      </Modal>
    </Box>
  );
};

export default CorrectionRequest;