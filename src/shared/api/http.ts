import type { z } from 'zod';
import { ApiError, errorResponseSchema, type ErrorCode } from './errors';

/** 프론트는 모든 환경에서 상대 경로만 호출한다. (코딩 규칙 3번, CORS 불필요) */
export const API_BASE = '/api/v1';

export type HeaderProvider = () => Record<string, string> | Promise<Record<string, string>>;

export interface RequestOptions {
    signal?: AbortSignal;
}

export interface HttpClient {
    get<S extends z.ZodType>(path: string, schema: S, opts?: RequestOptions): Promise<z.infer<S>>;
    post<S extends z.ZodType>(
        path: string,
        body: unknown,
        schema: S,
        opts?: RequestOptions,
    ): Promise<z.infer<S>>;
}

export interface HttpClientOptions {
    baseUrl?: string;
    /** 인증 헤더 등. 로그인 연결 전에는 비워 둔다. */
    headers?: HeaderProvider;
    fetchImpl?: typeof fetch;
}

// API Gateway가 보내는 오류는 `X-Request-Id` 대신 `x-amzn-RequestId`가 온다.
const requestIdOf = (res: Response) =>
    res.headers.get('X-Request-Id') ?? res.headers.get('x-amzn-RequestId');

function fallbackCode(status: number): ErrorCode {
    if (status === 400) return 'INVALID_REQUEST';
    if (status === 401 || status === 403) return 'UNAUTHORIZED';
    if (status === 404) return 'NOT_FOUND';
    if (status === 429) return 'RATE_LIMITED';
    if (status === 504) return 'LLM_TIMEOUT';
    return 'INTERNAL_ERROR';
}

export function createHttpClient(options: HttpClientOptions = {}): HttpClient {
    const { baseUrl = API_BASE, headers, fetchImpl } = options;
    const doFetch: typeof fetch = fetchImpl ?? ((...args) => fetch(...args));

    async function request<S extends z.ZodType>(
        method: 'GET' | 'POST',
        path: string,
        schema: S,
        body: unknown,
        opts?: RequestOptions,
    ): Promise<z.infer<S>> {
        let res: Response;
        try {
            res = await doFetch(`${baseUrl}${path}`, {
                method,
                signal: opts?.signal,
                headers: {
                    Accept: 'application/json',
                    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
                    ...(headers ? await headers() : {}),
                },
                body: body !== undefined ? JSON.stringify(body) : undefined,
            });
        } catch (cause) {
            if (opts?.signal?.aborted) throw cause; // 취소는 그대로 던진다
            throw new ApiError({
                status: 0,
                code: 'INTERNAL_ERROR',
                retryable: true,
                serverMessage: '네트워크 오류',
            });
        }

        const requestId = requestIdOf(res);
        const json: unknown = await res.json().catch(() => undefined);

        if (!res.ok) {
            const parsed = errorResponseSchema.safeParse(json);
            if (parsed.success) {
                throw new ApiError({
                    status: res.status,
                    code: parsed.data.code,
                    retryable: parsed.data.retryable,
                    requestId: parsed.data.requestId ?? requestId,
                    serverMessage: parsed.data.message,
                });
            }
            // 본문이 에러 형식이 아니면(게이트웨이 HTML 등) 상태 코드로 판단한다.
            throw new ApiError({
                status: res.status,
                code: fallbackCode(res.status),
                retryable: res.status >= 500 || res.status === 429,
                requestId,
            });
        }

        const parsed = schema.safeParse(json);
        if (!parsed.success) {
            throw new ApiError({
                status: res.status,
                code: 'INTERNAL_ERROR',
                retryable: false,
                requestId,
                serverMessage: `응답 형식이 계약과 달라요: ${parsed.error.message}`,
            });
        }
        return parsed.data;
    }

    return {
        get: (path, schema, opts) => request('GET', path, schema, undefined, opts),
        post: (path, body, schema, opts) => request('POST', path, schema, body, opts),
    };
}
