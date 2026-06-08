import React, { useEffect, useState } from 'react';
import { attendanceApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { 
  AccessTime, 
  Logout, 
  Login,
  Timer
} from '@mui/icons-material';

const Dashboard = () => {
  const { user } = useAuth();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchTodayRecord = async () => {
    try {
      const response = await attendanceApi.getToday();
      setRecord(response.data);
    } catch (err) {
      setError('Failed to fetch today\'s record.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayRecord();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClockIn = async () => {
    setActionLoading(true);
    try {
      await attendanceApi.clockIn();
      await fetchTodayRecord();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to clock in.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    setActionLoading(true);
    try {
      await attendanceApi.clockOut();
      await fetchTodayRecord();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to clock out.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const isClockedIn = record?.clock_in_time && !record?.clock_out_time;
  const isCompleted = record?.clock_in_time && record?.clock_out_time;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Overview</h1>
          <p className="text-slate-500 mt-1">Here is your attendance status for today.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
          <AccessTime className="text-indigo-500" />
          <span className="font-semibold text-slate-700 tracking-tight">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3">
          <span className="flex-1">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Timer sx={{ fontSize: 180 }} />
          </div>
          <div className="p-8 relative z-10">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-slate-800">Today's Status</h2>
              <span className={`px-4 py-1.5 rounded-full text-sm font-semibold uppercase tracking-wider
                ${!record ? 'bg-slate-100 text-slate-600' : 
                  isClockedIn ? 'bg-green-100 text-green-700' : 
                  isCompleted ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}
              `}>
                {record?.status || 'Not Started'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                <p className="text-sm font-medium text-slate-500 mb-1">Clock In</p>
                <p className="text-lg font-bold text-slate-800">
                  {record?.clock_in_time ? new Date(record.clock_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                <p className="text-sm font-medium text-slate-500 mb-1">Clock Out</p>
                <p className="text-lg font-bold text-slate-800">
                  {record?.clock_out_time ? new Date(record.clock_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                <p className="text-sm font-medium text-slate-500 mb-1">Total Hours</p>
                <p className="text-lg font-bold text-slate-800">
                  {record?.total_hours ? `${parseFloat(record.total_hours).toFixed(1)} hrs` : '--'}
                </p>
              </div>
            </div>

            {user?.role === 'employee' ? (
              <div className="flex gap-4">
                <button
                  onClick={handleClockIn}
                  disabled={actionLoading || record?.clock_in_time}
                  className={`
                    flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-lg transition-all duration-200
                    ${record?.clock_in_time
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 active:scale-[0.98]'}
                  `}
                >
                  <Login />
                  Clock In
                </button>
                <button
                  onClick={handleClockOut}
                  disabled={actionLoading || !isClockedIn}
                  className={`
                    flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-lg transition-all duration-200
                    ${!isClockedIn
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-rose-500 text-white hover:bg-rose-600 hover:shadow-lg hover:shadow-rose-200 active:scale-[0.98]'}
                  `}
                >
                  <Logout />
                  Clock Out
                </button>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <p className="text-slate-500 text-sm">
                  Clock-in/out is only available for employees.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl shadow-lg p-8 text-white relative overflow-hidden flex flex-col justify-center">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-black/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-4">Have a great day at work!</h3>
            <p className="text-indigo-100 mb-8 leading-relaxed">
              Remember to clock in when you start your day and clock out when you finish to ensure your hours are recorded accurately.
            </p>
            <div className="inline-flex px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-sm font-semibold">
              Attendance System
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;