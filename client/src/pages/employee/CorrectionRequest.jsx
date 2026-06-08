// import React, { useEffect, useState } from 'react';
// import { Typography, Box, Paper, Alert, TextField, MenuItem, Button as MuiButton } from '@mui/material';
// import Button from '../../components/common/Button';
// import Table from '../../components/common/Table';
// import Modal from '../../components/common/Modal';
// import Spinner from '../../components/common/Spinner';
// import { correctionApi, attendanceApi } from '../../api';
// import { useAuth } from '../../context/AuthContext';

// const CorrectionRequest = () => {
//   const { user } = useAuth();
//   const [requests, setRequests] = useState([]);
//   const [attendanceRecords, setAttendanceRecords] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [modalOpen, setModalOpen] = useState(false);
//   const [formData, setFormData] = useState({
//     attendance_record_id: '',
//     request_type: '',
//     date: '',
//     corrected_time: '',
//     reason: '',
//   });

//   const fetchRequests = async () => {
//     try {
//       const response = await correctionApi.getMyRequests();
//       setRequests(response.data);
//     } catch (err) {
//       setError('Failed to fetch correction requests.');
//     }
//   };

//   const fetchAttendanceRecords = async () => {
//     try {
//       const response = await attendanceApi.getHistory(1, 1000);
//       setAttendanceRecords(response.data.rows || []);
//     } catch (err) {
//       setError('Failed to fetch attendance records.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchRequests();
//     fetchAttendanceRecords();
//   }, []);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       await correctionApi.createRequest(formData);
//       setModalOpen(false);
//       setFormData({ attendance_record_id: '', request_type: '', date: '', corrected_time: '', reason: '' });
//       await fetchRequests();
//     } catch (err) {
//       setError(err.response?.data?.error || 'Failed to create correction request.');
//     }
//   };

//   const requestTypeOptions = [
//     { value: 'missed_in', label: 'Missed Clock-in' },
//     { value: 'missed_out', label: 'Missed Clock-out' },
//     { value: 'wrong_in', label: 'Wrong Clock-in Time' },
//     { value: 'wrong_out', label: 'Wrong Clock-out Time' },
//   ];

//   const columns = [
//     { key: 'date', header: 'Date', render: (value) => value ? new Date(value).toLocaleDateString() : '-' },
//     { key: 'request_type', header: 'Request Type' },
//     { key: 'corrected_time', header: 'Corrected Time', render: (value) => value ? new Date(value).toLocaleString() : 'N/A' },
//     { key: 'reason', header: 'Reason' },
//     { key: 'status', header: 'Status' },
//   ];

//   if (loading) return <Spinner />;

//   return (
//     <Box>
//       <Typography variant="h4" gutterBottom>
//         Correction Requests
//       </Typography>
//       {error && <Alert severity="error">{error}</Alert>}
//       <Button onClick={() => setModalOpen(true)} sx={{ mb: 2 }}>
//         Raise Correction Request
//       </Button>
//       <Paper sx={{ p: 2 }}>
//         <Table columns={columns} data={requests} />
//       </Paper>
//       <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Raise Correction Request">
//         <form onSubmit={handleSubmit}>
//           <TextField
//             select
//             label="Attendance Record"
//             value={formData.attendance_record_id}
//             onChange={(e) => setFormData({ ...formData, attendance_record_id: e.target.value })}
//             fullWidth
//             margin="normal"
//             required
//           >
//             {attendanceRecords.map((record) => (
//               <MenuItem key={record.id} value={record.id}>
//                 {new Date(record.date).toLocaleDateString()} - {record.status}
//               </MenuItem>
//             ))}
//           </TextField>
//           <TextField
//             select
//             label="Request Type"
//             value={formData.request_type}
//             onChange={(e) => setFormData({ ...formData, request_type: e.target.value })}
//             fullWidth
//             margin="normal"
//             required
//           >
//             {requestTypeOptions.map((option) => (
//               <MenuItem key={option.value} value={option.value}>
//                 {option.label}
//               </MenuItem>
//             ))}
//           </TextField>
//           <TextField
//             label="Date"
//             type="date"
//             value={formData.date}
//             onChange={(e) => setFormData({ ...formData, date: e.target.value })}
//             fullWidth
//             margin="normal"
//             InputLabelProps={{ shrink: true }}
//             required
//           />
//           <TextField
//             label="Corrected Time"
//             type="datetime-local"
//             value={formData.corrected_time}
//             onChange={(e) => setFormData({ ...formData, corrected_time: e.target.value })}
//             fullWidth
//             margin="normal"
//             InputLabelProps={{ shrink: true }}
//             required
//           />
//           <TextField
//             label="Reason"
//             multiline
//             rows={4}
//             value={formData.reason}
//             onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
//             fullWidth
//             margin="normal"
//             required
//           />
//           <MuiButton type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
//             Submit
//           </MuiButton>
//         </form>
//       </Modal>
//     </Box>
//   );
// };

// export default CorrectionRequest;

import React, { useEffect, useState } from 'react';
import {
  Typography, Box, Paper, Alert, TextField, MenuItem,
  Button as MuiButton, Divider,
} from '@mui/material';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import { correctionApi, attendanceApi } from '../../api';
import { useAuth } from '../../context/AuthContext';

/* ── shared input style (no label inside the box) ── */
const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    backgroundColor: '#fff',
    '&:hover fieldset': { borderColor: '#1976d2' },
    '&.Mui-focused fieldset': { borderColor: '#1976d2', borderWidth: '2px' },
  },
  '& .MuiInputBase-input': { padding: '12px 14px' },
};

/* ── reusable labelled field wrapper ── */
const Field = ({ label, required, children }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
    <Typography variant="body2" sx={{ fontWeight: 600, color: '#444', fontSize: '0.82rem' }}>
      {label}{required && <Box component="span" sx={{ color: '#d32f2f', ml: 0.3 }}>*</Box>}
    </Typography>
    {children}
  </Box>
);

/* ── section heading ── */
const Section = ({ children }) => (
  <Typography variant="caption" sx={{
    display: 'block', fontWeight: 700, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: '#1976d2', mt: 0.5,
  }}>
    {children}
  </Typography>
);

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
    clock_in_date: '',
    clock_in_reason: '',
    clock_out_date: '',
    clock_out_reason: '',
  });

  const set = (field) => (e) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const fetchRequests = async () => {
    try {
      const res = await correctionApi.getMyRequests();
      setRequests(res.data);
    } catch {
      setError('Failed to fetch correction requests.');
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      const res = await attendanceApi.getHistory(1, 1000);
      setAttendanceRecords(res.data.rows || []);
    } catch {
      setError('Failed to fetch attendance records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); fetchAttendanceRecords(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await correctionApi.createRequest(formData);
      setModalOpen(false);
      setFormData({ attendance_record_id: '', request_type: '', clock_in_date: '', clock_in_reason: '', clock_out_date: '', clock_out_reason: '' });
      await fetchRequests();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create correction request.');
    }
  };

  const requestTypeOptions = [
    { value: 'missed_in',  label: 'Missed Clock-in' },
    { value: 'missed_out', label: 'Missed Clock-out' },
    { value: 'wrong_in',   label: 'Wrong Clock-in Time' },
    { value: 'wrong_out',  label: 'Wrong Clock-out Time' },
  ];

  const columns = [
    { key: 'date',           header: 'Date',           render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'request_type',   header: 'Request Type' },
    { key: 'corrected_time', header: 'Corrected Time',  render: (v) => v ? new Date(v).toLocaleString() : 'N/A' },
    { key: 'reason',         header: 'Reason' },
    { key: 'status',         header: 'Status' },
  ];

  if (loading) return <Spinner />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Correction Requests</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Button onClick={() => setModalOpen(true)} sx={{ mb: 2 }}>
        Raise Correction Request
      </Button>
      <Paper sx={{ p: 2 }}>
        <Table columns={columns} data={requests} />
      </Paper>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Raise Correction Request">
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>

          {/* Attendance Record */}
          <Field label="Attendance Record" required>
            <TextField
              select
              value={formData.attendance_record_id}
              onChange={set('attendance_record_id')}
              fullWidth required
              sx={inputSx}
              SelectProps={{ displayEmpty: true }}
            >
              <MenuItem value="" disabled><em style={{ color: '#aaa' }}>Select a record…</em></MenuItem>
              {attendanceRecords.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  {new Date(r.date).toLocaleDateString('en-GB')} — {r.status}
                </MenuItem>
              ))}
            </TextField>
          </Field>

          {/* Request Type */}
          <Field label="Request Type" required>
            <TextField
              select
              value={formData.request_type}
              onChange={set('request_type')}
              fullWidth required
              sx={inputSx}
              SelectProps={{ displayEmpty: true }}
            >
              <MenuItem value="" disabled><em style={{ color: '#aaa' }}>Select type…</em></MenuItem>
              {requestTypeOptions.map((o) => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </TextField>
          </Field>

          <Divider />

          {/* Clock-in */}
          <Section>Clock-in Correction</Section>

          <Field label="Date" required>
            <TextField
              type="date"
              value={formData.clock_in_date}
              onChange={set('clock_in_date')}
              fullWidth required
              sx={inputSx}
            />
          </Field>

          <Field label="Reason" required>
            <TextField
              multiline rows={2}
              value={formData.clock_in_reason}
              onChange={set('clock_in_reason')}
              placeholder="e.g. Forgot to clock in"
              fullWidth required
              sx={inputSx}
            />
          </Field>

          <Divider />

          {/* Clock-out */}
          <Section>Clock-out Correction (optional)</Section>

          <Field label="Date">
            <TextField
              type="date"
              value={formData.clock_out_date}
              onChange={set('clock_out_date')}
              fullWidth
              sx={inputSx}
            />
          </Field>

          <Field label="Reason">
            <TextField
              multiline rows={2}
              value={formData.clock_out_reason}
              onChange={set('clock_out_reason')}
              placeholder="e.g. Forgot to clock out"
              fullWidth
              sx={inputSx}
            />
          </Field>

          <MuiButton
            type="submit" variant="contained" color="primary" size="large"
            sx={{ mt: 1, borderRadius: '8px', textTransform: 'none', fontWeight: 600, py: 1.2 }}
          >
            Submit Request
          </MuiButton>
        </Box>
      </Modal>
    </Box>
  );
};

export default CorrectionRequest;