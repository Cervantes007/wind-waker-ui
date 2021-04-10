import { AxiosRequestConfig, default as axios } from "axios";

const api = axios.create({
  baseURL: "http://localhost:4000",
  headers: {
    "Content-Type": "application/json",
  },
});

export const request = (action: string, config: AxiosRequestConfig) => {
  config.url = `${action}`;
  config.method = `POST`;
  return api(config);
};

export { api };
