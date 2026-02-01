export const API_URL = 'http://localhost:8000';

export const endpoints = {
    login: `${API_URL}/auth/login`,
    refresh: `${API_URL}/auth/refresh`,
    invite: `${API_URL}/admin/users/invite`,
    dashboard: `${API_URL}/admin/dashboard/stats`,
    selectProfile: `${API_URL}/auth/select-profile`,
};
