import axios from "axios";

const LS_ACCESS = "VINH_KHANH_FOOD_TOUR_ACCESS_TOKEN";
const LS_REFRESH = "VINH_KHANH_FOOD_TOUR_REFRESH_TOKEN";
const LS_USER = "VINH_KHANH_FOOD_TOUR_USER";

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_API,
    timeout: 50000,
});

axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(LS_ACCESS);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }else{
            delete config.headers.Authorization;
            localStorage.removeItem(LS_ACCESS);
            localStorage.removeItem(LS_REFRESH);
            localStorage.removeItem(LS_USER);
                if (window.location.pathname !== "/login") {
                    window.location.href = "/login";
                }
        }
        return config;
    },
    (error) => Promise.reject(error)

);

axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem(LS_ACCESS);
            localStorage.removeItem(LS_REFRESH);
            localStorage.removeItem(LS_USER);

            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    }
);

export default axiosClient;
