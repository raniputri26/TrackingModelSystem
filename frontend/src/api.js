import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Uses Vite's reverse proxy to bypass local firewall blocks
});

export const uploadExcel = (file, sheetName = "Summary") => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/upload?sheet_name=${encodeURIComponent(sheetName)}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const listSheets = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/list-sheets', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getProductionData = (category) => {
  return api.get('/data', { params: { category } });
};

export const getCategories = () => {
  return api.get('/categories');
};

// --- Hourly Logs API ---
export const getHourlyLogs = (params) => {
  return api.get('/hourly-logs', { params });
};

export const createHourlyLog = (data) => {
  return api.post('/hourly-logs', data);
};

export const updateHourlyLog = (id, data) => {
  return api.put(`/hourly-logs/${id}`, data);
};

export const deleteHourlyLog = (id) => {
  return api.delete(`/hourly-logs/${id}`);
};

export const getHourlySummary = (params) => {
  return api.get('/hourly-summary', { params });
};

export const getHourlyDates = () => {
  return api.get('/hourly-dates');
};

export const getHourlyTimeline = (params) => {
  return api.get('/hourly-timeline', { params });
};

// --- Visitor Analytics API ---
export const trackVisit = () => {
  return api.post('/track-visit');
};

export const getVisitorStats = (params) => {
  return api.get('/visitors', { params });
};

export default api;
