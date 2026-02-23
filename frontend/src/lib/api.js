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
export const clearAllConversations = () => api.delete("/conversations/all");
export const setProficiency = (id, level) => api.patch(`/conversations/${id}/proficiency`, { level });
export const getMessages = (id) => api.get(`/conversations/${id}/messages`);
export const sendMessage = (id, data) => api.post(`/conversations/${id}/messages`, data);
export const getCurriculum = (id) => api.get(`/conversations/${id}/curriculum`);

// Voice message - sends audio blob, returns transcribed text + AI response + TTS audio
export const sendVoiceMessage = (id, audioBlob, scenarioContext) => {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");
  if (scenarioContext) formData.append("scenario_context", scenarioContext);
  return api.post(`/conversations/${id}/voice-message`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60000,
  });
};

// Text-to-Speech
export const textToSpeech = (text) => api.post("/tts", { text });

// Vocabulary
export const listVocabulary = () => api.get("/vocabulary");
export const saveVocabulary = (data) => api.post("/vocabulary", data);
export const deleteVocabulary = (id) => api.delete(`/vocabulary/${id}`);

// Scenarios
export const getScenarios = () => api.get("/scenarios");

// Languages
export const getLanguages = () => api.get("/languages");

// Progress
export const getProgress = () => api.get("/progress");

export default api;
