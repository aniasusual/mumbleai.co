import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  headers: { "Content-Type": "application/json" }
});

// Helper to get current token
const getToken = () => localStorage.getItem("mumble_token");

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

/**
 * Stream a message with real-time tool activity events via SSE.
 */
export const sendMessageStream = (id, data, onEvent) => {
  return new Promise((resolve, reject) => {
    const token = getToken();
    fetch(`${API}/conversations/${id}/messages/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    }).then(async (response) => {
      if (!response.ok) {
        reject(new Error(`Stream failed: ${response.status}`));
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === "done") {
                resolve(event);
              } else if (onEvent) {
                onEvent(event);
              }
            } catch (e) { /* skip malformed */ }
          }
        }
      }
    }).catch(reject);
  });
};

// Voice message — SSE streaming (same as text but with audio upload first)
export const sendVoiceMessageStream = (id, audioBlob, scenarioContext, onEvent, languageHint) => {
  return new Promise((resolve, reject) => {
    const token = getToken();
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");
    if (scenarioContext) formData.append("scenario_context", scenarioContext);
    if (languageHint) formData.append("language_hint", languageHint);

    fetch(`${API}/conversations/${id}/voice-message`, {
      method: "POST",
      headers: {
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      },
      body: formData,
    }).then(async (response) => {
      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: "Voice message failed" }));
        reject(new Error(err.detail || `Stream failed: ${response.status}`));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === "done") {
                resolve(event);
              } else if (onEvent) {
                onEvent(event);
              }
            } catch (e) { /* skip malformed */ }
          }
        }
      }
    }).catch(reject);
  });
};

// Voice message — legacy non-streaming (kept for backward compatibility)
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

// Payments
export const getPlans = () => api.get("/payments/plans");
export const getSubscription = () => api.get("/payments/subscription");
export const createOrder = (plan) => api.post("/payments/create-order", { plan });
export const verifyPayment = (data) => api.post("/payments/verify-payment", data);
export const getCreditHistory = (page = 1, limit = 20, type = null) => {
  const params = { page, limit };
  if (type) params.type = type;
  return api.get("/payments/credit-history", { params });
};

export default api;
