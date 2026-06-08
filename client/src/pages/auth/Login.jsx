import React, { useState } from 'react';
import { Box, TextField, Typography, Paper, Alert } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';

const Login = () => {
  const [email, setEmail] = useState('emp@test.com');
  const [password, setPassword] = useState('Test@1234');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(email, password);
    if (!result.success) {
      setError(result.error || 'Invalid email or password.');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Paper sx={{ p: 4, width: 400 }}>
        <Typography variant="h5" gutterBottom>
          Login
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          <Button type="submit" fullWidth>
            Login
          </Button>
        </form>
        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
          Test Credentials:
          <br />
          Employee: emp@test.com / Test@1234
          <br />
          HR: hr@test.com / Test@1234
          <br />
          Admin: admin@test.com / Test@1234
        </Typography>
      </Paper>
    </Box>
  );
};

export default Login;