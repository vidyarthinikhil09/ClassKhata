import { api as axiosClient } from './axiosInstance';

export const api = {
  // --- AUTHENTICATION ---
  login: async (email: string, password: string) => {
    const response = await axiosClient.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (data: any) => {
    const response = await axiosClient.post('/auth/register', data);
    return response.data;
  },
  logout: async () => {
    const response = await axiosClient.post('/auth/logout');
    return response.data;
  },
  checkAuth: async () => {
    const response = await axiosClient.get('/auth/me');
    return response.data;
  },

  getTeacherProfile: async () => {
    const response = await axiosClient.get(`/auth/me?t=${new Date().getTime()}`);
    return response.data; 
  },
  
  updateTeacherProfile: async (data: any) => {
    const response = await axiosClient.put('/auth/me', data);
    return response.data;
  },

  // --- STUDENTS (ROSTER) ---
  getStudents: async () => {
    const response = await axiosClient.get('/students');
    return response.data;
  },
  getStudent: async (id: string) => {
    const response = await axiosClient.get(`/students/${id}`);
    return response.data;
  },
  addStudent: async (studentData: any) => {
    const response = await axiosClient.post('/students', studentData);
    return response.data;
  },
  deleteStudent: async (id: string) => {
    const response = await axiosClient.delete(`/students/${id}`);
    return response.data;
  },

  // --- TRANSACTIONS (LEDGER) ---
  addTransaction: async (transactionData: any) => {
    const response = await axiosClient.post('/transactions', transactionData);
    return response.data;
  },
  getTransactions: async () => {
    const response = await axiosClient.get('/transactions');
    return response.data;
  },

  // --- DASHBOARD ---
  getDashboardMetrics: async () => {
    // Call the brand new backend route we just built!
    const response = await axiosClient.get('/transactions/metrics');
    return response.data;
  },
  
  updateStudent: async (id: string, data: any) => {
    const response = await axiosClient.put(`/students/${id}`, data);
    return response.data;
  },

  deleteTransaction: async (id: string) => {
    const response = await axiosClient.delete(`/transactions/${id}`);
    return response.data;
  },
};