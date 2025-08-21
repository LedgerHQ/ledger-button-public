import { injectable } from "inversify";
import { Either, EitherAsync, Right } from "purify-ts";

import { headers } from "./model/constant.js";
import { merge } from "./utils/merge.js";
import { NetworkService } from "./NetworkService.js";

export type NetworkServiceOpts = Omit<RequestInit, "method">;

@injectable()
export class DefaultNetworkService
  implements NetworkService<NetworkServiceOpts>
{
  async get<T>(
    url: string,
    options?: NetworkServiceOpts,
  ): Promise<Either<Error, T>> {
    const defaultOpts = {
      headers,
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
      headers,
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
      headers,
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
      headers,
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
      headers,
      method: "DELETE",
    };

    return EitherAsync.fromPromise<Error, T>(async () => {
      const response = await fetch(url, merge(defaultOpts, options || {}));
      const data = await response.json();
      return Right(data);
    });
  }
}
