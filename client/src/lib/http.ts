import axios from "axios";

export const http = axios.create({
    baseURL: "/api",
    withCredentials: true,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

http.interceptors.response.use(
    (res) => res,
    (err) => {
        console.error("HTTP error:", err.response?.status);
        return Promise.reject(err);
    }
)