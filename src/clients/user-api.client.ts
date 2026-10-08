import type { APIRequestContext } from '@playwright/test';
import { AUTH_TOKEN, type Environment } from '../config/env';

export interface User {
  name: string;
  email: string;
  age: number;
}

export interface ErrorResponse {
  error: string;
}

/** Normalised HTTP result: the body is read once so assertions can always print it. */
export interface ApiResult<T = unknown> {
  method: string;
  url: string;
  status: number;
  headers: Record<string, string>;
  /** Parsed JSON body, or `undefined` when the body is empty / not JSON. */
  body: T | undefined;
  /** Raw response text. */
  text: string;
}

export interface DeleteOptions {
  /** Token to send. `null` omits the header entirely. Defaults to the valid token. */
  token?: string | null;
  /** Header name carrying the token. Defaults to `Authentication` (as per OpenAPI). */
  headerName?: string;
}

/**
 * Service Object wrapping every operation described in sdet_challenge_api.yaml.
 * Payload arguments are typed `unknown` on purpose, so negative tests can send
 * invalid data without type gymnastics.
 */
export class UserApiClient {
  constructor(
    private readonly request: APIRequestContext,
    readonly env: Environment,
  ) {}

  private get usersPath(): string {
    return `/${this.env}/users`;
  }

  private userPath(email: string): string {
    return `${this.usersPath}/${encodeURIComponent(email)}`;
  }

  private async send<T>(
    method: string,
    url: string,
    options: { data?: unknown; headers?: Record<string, string> } = {},
  ): Promise<ApiResult<T>> {
    const response = await this.request.fetch(url, { method, ...options });
    const text = await response.text();
    let body: T | undefined;
    try {
      body = text ? (JSON.parse(text) as T) : undefined;
    } catch {
      body = undefined;
    }
    return { method, url, status: response.status(), headers: response.headers(), body, text };
  }

  // GET /{env}/users
  listUsers(): Promise<ApiResult<User[]>> {
    return this.send('GET', this.usersPath);
  }

  // POST /{env}/users
  createUser(payload: unknown): Promise<ApiResult<User | ErrorResponse>> {
    return this.send('POST', this.usersPath, { data: payload });
  }

  /** POST with a raw string body (used for malformed JSON scenarios). */
  createUserRaw(rawBody: string): Promise<ApiResult<User | ErrorResponse>> {
    return this.send('POST', this.usersPath, {
      data: rawBody,
      headers: { 'content-type': 'application/json' },
    });
  }

  // GET /{env}/users/{email}
  getUser(email: string): Promise<ApiResult<User | ErrorResponse>> {
    return this.send('GET', this.userPath(email));
  }

  // PUT /{env}/users/{email}
  updateUser(email: string, payload: unknown): Promise<ApiResult<User | ErrorResponse>> {
    return this.send('PUT', this.userPath(email), { data: payload });
  }

  // DELETE /{env}/users/{email}   (requires `Authentication` header)
  deleteUser(email: string, options: DeleteOptions = {}): Promise<ApiResult<ErrorResponse>> {
    const { token = AUTH_TOKEN, headerName = 'Authentication' } = options;
    const headers: Record<string, string> = token === null ? {} : { [headerName]: token };
    return this.send('DELETE', this.userPath(email), { headers });
  }

  /** Arbitrary GET, used for routing checks such as unknown environments. */
  rawGet(path: string): Promise<ApiResult> {
    return this.send('GET', path);
  }
}
