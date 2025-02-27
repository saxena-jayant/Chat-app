import axios from "axios";

const api = axios.create({
  baseURL: "https://chat-app-server-delta-lemon.vercel.app",
});

export default api;
