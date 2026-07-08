import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Uses Vite's reverse proxy to bypass local firewall blocks
});

export const uploadExcel = (file, sheetName = "Summary", modelName = "603") => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/upload?sheet_name=${encodeURIComponent(sheetName)}&model_name=${encodeURIComponent(modelName)}`, formData, {
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

export const getProductionData = (category, modelName = "603") => {
  return api.get('/data', { params: { category, model_name: modelName } });
};

export const getCategories = (modelName = "603") => {
  return api.get('/categories', { params: { model_name: modelName } });
};

// --- Hourly Logs API ---
export const getHourlyLogs = (params, modelName = "603") => {
  return api.get('/hourly-logs', { params: { ...params, model_name: modelName } });
};

export const createHourlyLog = (data, modelName = "603") => {
  return api.post('/hourly-logs', { ...data, model_name: modelName });
};

export const updateHourlyLog = (id, data, modelName = "603") => {
  return api.put(`/hourly-logs/${id}`, { ...data, model_name: modelName });
};

export const deleteHourlyLog = (id) => {
  return api.delete(`/hourly-logs/${id}`);
};

export const getHourlySummary = (params, modelName = "603") => {
  return api.get('/hourly-summary', { params: { ...params, model_name: modelName } });
};

export const getHourlyDates = (modelName = "603") => {
  return api.get('/hourly-dates', { params: { model_name: modelName } });
};

export const getHourlyTimeline = (params, modelName = "603") => {
  return api.get('/hourly-timeline', { params: { ...params, model_name: modelName } });
};

export const updateCellStyle = (data) => {
  return api.post('/cell-style', data);
};

// --- Visitor Analytics API ---
export const trackVisit = () => {
  return api.post('/track-visit');
};

export const getVisitorStats = (params) => {
  return api.get('/visitors', { params });
};

// --- Marketing API ---
export const uploadMarketingExcel = (file, sheetName = "Summary", modelName = "603") => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/upload-marketing?sheet_name=${encodeURIComponent(sheetName)}&model_name=${encodeURIComponent(modelName)}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getMarketingData = (modelName = "603") => {
  return api.get('/marketing-data', { params: { model_name: modelName } });
};

export default api;
