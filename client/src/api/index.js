import axios from 'axios';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Create an Axios instance with base URL and default headers
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token_expiry');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  refreshToken: (data) => api.post('/auth/refresh-token', data),
  updateProfile: (data) => api.patch('/auth/profile', data),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// Attendance API
export const attendanceApi = {
  clockIn: () => api.post('/attendance/clock-in'),
  clockOut: () => api.post('/attendance/clock-out'),
  getToday: () => api.get('/attendance/today'),
  getHistory: (page = 1, limit = 10) => api.get(`/attendance/history?page=${page}&limit=${limit}`),
};

// Correction API
export const correctionApi = {
  createRequest: (data) => api.post('/corrections', data),
  getMyRequests: () => api.get('/corrections/mine'),
  getAllRequests: () => api.get('/corrections'),
  approveRequest: (id, remarks) => api.patch(`/corrections/${id}/approve`, { reviewer_remarks: remarks }),
  rejectRequest: (id, remarks) => api.patch(`/corrections/${id}/reject`, { reviewer_remarks: remarks }),
};

// Admin API
export const adminApi = {
  getUsers: () => api.get('/admin/users'),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  assignRole: (id, role_id) => api.patch(`/admin/users/${id}/role`, { role_id }),
  getRoles: () => api.get('/admin/roles'),
  getRules: () => api.get('/admin/rules'),
  createRule: (data) => api.post('/admin/rules', data),
  updateRule: (id, data) => api.put(`/admin/rules/${id}`, data),
  deleteRule: (id) => api.delete(`/admin/rules/${id}`),
  getAuditLogs: () => api.get('/admin/audit-logs'),
  getAllAttendance: () => api.get('/admin/attendance'),
};

export default api;