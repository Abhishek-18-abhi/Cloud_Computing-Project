import axios from "axios";
import { supabase } from "./supabase";

// Always use same-origin "/api" in the browser so requests flow through
// Vercel's serverless reverse-proxy (in vercel.json) or Vite's dev proxy.
// This completely eliminates cross-origin CORS blocks.
const api = axios.create({
  baseURL: "/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error("Could not read Supabase session:", error);
      return config;
    }

    const token = data.session?.access_token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.error("Error attaching auth token:", err);
  }

  return config;
});

export default api;
