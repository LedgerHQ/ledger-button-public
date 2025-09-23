import { inject, injectable } from "inversify";
import { Either, EitherAsync, Right } from "purify-ts";

import {
  DEFAULT_HEADERS,
  LEDGER_CLIENT_VERSION_HEADER,
  LEDGER_ORIGIN_TOKEN_HEADER,
} from "./model/constant.js";
import { merge } from "./utils/merge.js";
import { configModuleTypes } from "../config/configModuleTypes.js";
import { Config } from "../config/model/config.js";
import { NetworkService } from "./NetworkService.js";

export type NetworkServiceOpts = Omit<RequestInit, "method">;

@injectable()
export class DefaultNetworkService
  implements NetworkService<NetworkServiceOpts>
{
  private headers: Record<string, string> = {};

  constructor(
    @inject(configModuleTypes.Config)
    private readonly config: Config,
  ) {
    const dynamicHeaders = {
      [LEDGER_ORIGIN_TOKEN_HEADER]: this.config.originToken,
      [LEDGER_CLIENT_VERSION_HEADER]: this.config.dAppIdentifier,
    };

    this.headers = {
      ...DEFAULT_HEADERS,
      ...dynamicHeaders,
    };
  }

  async get<T>(
    url: string,
    options?: NetworkServiceOpts,
  ): Promise<Either<Error, T>> {
    const defaultOpts = {
      headers: this.headers,
      method: "GET",
    };

    return EitherAsync.fromPromise<Error, T>(async () => {
      const response = await fetch(url, merge(defaultOpts, options || {}));
      const data = (await response.json()) as T;
      return Right(data);
    });
  }

  async post<T>(
    url: string,
    body: unknown,
    options?: NetworkServiceOpts,
  ): Promise<Either<Error, T>> {
    const defaultOpts = {
      headers: this.headers,
      method: "POST",
      body,
    };

    return EitherAsync.fromPromise<Error, T>(async () => {
      const response = await fetch(url, merge(defaultOpts, options || {}));
      const data = await response.json();
      return Right(data);
    });
  }

  async put<T>(
    url: string,
    body: unknown,
    options?: NetworkServiceOpts,
  ): Promise<Either<Error, T>> {
    const defaultOpts = {
      headers: this.headers,
      method: "PUT",
      body,
    };

    return EitherAsync.fromPromise<Error, T>(async () => {
      const response = await fetch(url, merge(defaultOpts, options || {}));
      const data = await response.json();
      return Right(data);
    });
  }

  async patch<T>(
    url: string,
    body: unknown,
    options?: NetworkServiceOpts,
  ): Promise<Either<Error, T>> {
    const defaultOpts = {
      headers: this.headers,
      method: "PATCH",
      body,
    };

    return EitherAsync.fromPromise<Error, T>(async () => {
      const response = await fetch(url, merge(defaultOpts, options || {}));
      const data = await response.json();
      return Right(data);
    });
  }

  async delete<T>(
    url: string,
    options?: NetworkServiceOpts,
  ): Promise<Either<Error, T>> {
    const defaultOpts = {
      headers: this.headers,
      method: "DELETE",
    };

    return EitherAsync.fromPromise<Error, T>(async () => {
      const response = await fetch(url, merge(defaultOpts, options || {}));
      const data = await response.json();
      return Right(data);
    });
  }
}
