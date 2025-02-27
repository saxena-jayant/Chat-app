import axios from "axios";

const api = axios.create({
  baseURL: "https://chat-app-server-no0d.onrender.com",
});

export default api;
