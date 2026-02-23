import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  headers: { "Content-Type": "application/json" }
});

// Conversations
export const createConversation = (data) => api.post("/conversations", data);
export const listConversations = () => api.get("/conversations");
export const getConversation = (id) => api.get(`/conversations/${id}`);
export const deleteConversation = (id) => api.delete(`/conversations/${id}`);
export const getMessages = (id) => api.get(`/conversations/${id}/messages`);
export const sendMessage = (id, data) => api.post(`/conversations/${id}/messages`, data);

// Vocabulary
export const listVocabulary = () => api.get("/vocabulary");
export const saveVocabulary = (data) => api.post("/vocabulary", data);
export const deleteVocabulary = (id) => api.delete(`/vocabulary/${id}`);

// Scenarios
export const getScenarios = () => api.get("/scenarios");

// Progress
export const getProgress = () => api.get("/progress");

export default api;
