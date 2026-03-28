import type { AxiosRequestConfig } from "axios";

export interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  requireAuth?: boolean; // Flag to indicate if the request requires authentication
  _retry?: boolean; // Flag to indicate if the request has been retried
}
