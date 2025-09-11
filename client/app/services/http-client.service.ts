// axiosClient.ts
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";

const BASE_URL = "/api";

interface TokenResponse {
  accessToken: string;
}

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
});

// Додаємо токен в заголовки
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token && config.headers) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// Обробка 401 та refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError & { config?: AxiosRequestConfig & { _retry?: boolean } }) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw error;

        const { data } = await axios.post<TokenResponse>(`${BASE_URL}/auth/refresh`, { refreshToken });
        localStorage.setItem("accessToken", data.accessToken);

        if (originalRequest.headers) {
          originalRequest.headers["Authorization"] = `Bearer ${data.accessToken}`;
        }

        return apiClient(originalRequest); // повторний запит
      } catch (err) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export { apiClient };
