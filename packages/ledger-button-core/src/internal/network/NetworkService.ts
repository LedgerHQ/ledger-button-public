import { Maybe } from "purify-ts";

export type NetworkService = {
  get<T>(url: string, options?: Omit<RequestInit, "method">): Promise<Maybe<T>>;
  post<T>(
    url: string,
    body: unknown,
    options?: Omit<RequestInit, "method">
  ): Promise<Maybe<T>>;
  put<T>(
    url: string,
    body: unknown,
    options?: Omit<RequestInit, "method">
  ): Promise<Maybe<T>>;
  patch<T>(
    url: string,
    body: unknown,
    options?: Omit<RequestInit, "method">
  ): Promise<Maybe<T>>;
  delete<T>(
    url: string,
    options?: Omit<RequestInit, "method">
  ): Promise<Maybe<T>>;
};
