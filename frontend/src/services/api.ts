import axios, { AxiosResponse } from 'axios';
import { User, EmailMetadata, EmailSearchParams, EmailsResponse, ApiResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  // Get Google OAuth URL
  getGoogleAuthUrl: async (): Promise<{ url: string }> => {
    const response: AxiosResponse<ApiResponse<{ authUrl: string }>> = await api.get('/auth/google');
    return { url: response.data.data!.authUrl };
  },

  // Handle OAuth callback
  handleCallback: async (code: string): Promise<{ token: string; user: User }> => {
    const response: AxiosResponse<ApiResponse<{ token: string; user: User }>> = await api.post('/auth/callback', { code });
    return response.data.data!;
  },

  // Refresh token
  refreshToken: async (): Promise<{ token: string; user: User }> => {
    const response: AxiosResponse<ApiResponse<{ token: string; user: User }>> = await api.post('/auth/refresh');
    return response.data.data!;
  },

  // Get current user profile
  getProfile: async (): Promise<User> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.get('/users/profile');
    return response.data.data!;
  },
};

export const emailService = {
  // Sync emails from Gmail
  syncEmails: async (): Promise<{ synced: number; message: string }> => {
    const response: AxiosResponse<ApiResponse<{ synced: number; message: string }>> = await api.post('/emails/sync');
    return response.data.data!;
  },

  // Get emails with pagination and filtering
  getEmails: async (params: EmailSearchParams = {}): Promise<EmailsResponse> => {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v));
        } else {
          queryParams.append(key, String(value));
        }
      }
    });

    const response: AxiosResponse<ApiResponse<EmailsResponse>> = await api.get(`/emails?${queryParams}`);
    return response.data.data!;
  },

  // Get single email by ID
  getEmailById: async (id: string): Promise<EmailMetadata> => {
    const response: AxiosResponse<ApiResponse<EmailMetadata>> = await api.get(`/emails/${id}`);
    return response.data.data!;
  },

  // Mark email as read/unread
  markAsRead: async (id: string, isRead: boolean): Promise<EmailMetadata> => {
    const response: AxiosResponse<ApiResponse<EmailMetadata>> = await api.patch(`/emails/${id}/read`, { isRead });
    return response.data.data!;
  },

  // Mark email as important
  markAsImportant: async (id: string, isImportant: boolean): Promise<EmailMetadata> => {
    const response: AxiosResponse<ApiResponse<EmailMetadata>> = await api.patch(`/emails/${id}/important`, { isImportant });
    return response.data.data!;
  },

  // Star/unstar email
  starEmail: async (id: string, isStarred: boolean): Promise<EmailMetadata> => {
    const response: AxiosResponse<ApiResponse<EmailMetadata>> = await api.patch(`/emails/${id}/star`, { isStarred });
    return response.data.data!;
  },

  // Search emails
  searchEmails: async (params: EmailSearchParams): Promise<EmailsResponse> => {
    return emailService.getEmails(params);
  },

  // Get email stats
  getStats: async (): Promise<{
    totalEmails: number;
    unreadEmails: number;
    importantEmails: number;
    starredEmails: number;
  }> => {
    const response: AxiosResponse<ApiResponse<{
      totalEmails: number;
      unreadEmails: number;
      importantEmails: number;
      starredEmails: number;
    }>> = await api.get('/emails/stats');
    return response.data.data!;
  },
};

export default api;
