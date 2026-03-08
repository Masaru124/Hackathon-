import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message = error.response?.data?.error || error.message || 'An error occurred';
    console.error('API Error:', message);
    return Promise.reject(new Error(message));
  }
);

// Scam Detection APIs
export const scanMessage = async (data) => {
  try {
    const response = await api.post('/scam/scan', data);
    return response;
  } catch (error) {
    throw error;
  }
};

export const batchScan = async (items) => {
  try {
    const response = await api.post('/scam/batch-scan', { items });
    return response;
  } catch (error) {
    throw error;
  }
};

export const checkHash = async (hash) => {
  try {
    const response = await api.get(`/scam/check/${hash}`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Report APIs
export const reportScam = async (data) => {
  try {
    const response = await api.post('/report', data);
    return response;
  } catch (error) {
    throw error;
  }
};

export const batchReport = async (reports) => {
  try {
    const response = await api.post('/report/batch', { reports });
    return response;
  } catch (error) {
    throw error;
  }
};

export const getReportStatus = async (reportId) => {
  try {
    const response = await api.get(`/report/status/${reportId}`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Stats APIs
export const fetchStats = async () => {
  try {
    const response = await api.get('/stats/overview');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchTrends = async (days = 30) => {
  try {
    const response = await api.get(`/stats/trends?days=${days}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchCategories = async () => {
  try {
    const response = await api.get('/stats/categories');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchUrlStats = async () => {
  try {
    const response = await api.get('/stats/urls');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchReporterStats = async () => {
  try {
    const response = await api.get('/stats/reporters');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchBlockchainStats = async () => {
  try {
    const response = await api.get('/stats/blockchain');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Reports APIs
export const fetchReports = async (params = {}) => {
  try {
    const { page = 1, limit = 20, riskLevel, category, confirmed } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (riskLevel) queryParams.append('riskLevel', riskLevel);
    if (category) queryParams.append('category', category);
    if (confirmed !== undefined) queryParams.append('confirmed', confirmed.toString());

    const response = await api.get(`/scam/reports?${queryParams}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getReport = async (hash) => {
  try {
    const response = await api.get(`/scam/reports/${hash}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Blockchain APIs
export const getBlockchainStatus = async () => {
  try {
    const response = await api.get('/blockchain/status');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getBlockchainReports = async (limit = 50) => {
  try {
    const response = await api.get(`/blockchain/reports?limit=${limit}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getBlockchainReport = async (hash) => {
  try {
    const response = await api.get(`/blockchain/reports/${hash}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getBlockchainStatistics = async () => {
  try {
    const response = await api.get('/blockchain/statistics');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getTransaction = async (txHash) => {
  try {
    const response = await api.get(`/blockchain/transaction/${txHash}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Health Check
export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default api;
