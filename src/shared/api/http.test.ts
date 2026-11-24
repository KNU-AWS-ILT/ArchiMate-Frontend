import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { isApiError } from './errors';
import { createHttpClient } from './http';

const json = (body: unknown, init: ResponseInit = {}) =>
    new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        ...init,
    });

const schema = z.object({ ok: z.boolean() });
const make = (impl: typeof fetch, extra = {}) => createHttpClient({ fetchImpl: impl, ...extra });

describe('HTTP 클라이언트', () => {
    it('/api/v1 상대 경로로 호출하고 응답을 검증해서 돌려준다', async () => {
        const fetchImpl = vi.fn(async () => json({ ok: true }));
        const res = await make(fetchImpl as unknown as typeof fetch).get('/health', schema);
        expect(res).toEqual({ ok: true });
        expect(fetchImpl).toHaveBeenCalledWith(
            '/api/v1/health',
            expect.objectContaining({ method: 'GET' }),
        );
    });

    it('POST는 JSON 본문과 Content-Type을 보내고, 헤더 제공자의 값을 붙인다', async () => {
        const fetchImpl = vi.fn(async () => json({ ok: true }));
        await make(fetchImpl as unknown as typeof fetch, {
            headers: async () => ({ Authorization: 'token-1' }),
        }).post('/designs', { a: 1 }, schema);
        const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
        expect(init.body).toBe('{"a":1}');
        expect(init.headers).toMatchObject({
            'Content-Type': 'application/json',
            Authorization: 'token-1',
        });
    });

    it('에러 본문 { code, message, retryable, requestId }를 ApiError로 바꾼다', async () => {
        const fetchImpl = async () =>
            json(
                { code: 'NOT_FOUND', message: 'x', retryable: false, requestId: 'r1' },
                { status: 404 },
            );
        const err = await make(fetchImpl as unknown as typeof fetch)
            .get('/x', schema)
            .catch((e) => e);
        expect(isApiError(err)).toBe(true);
        expect(err).toMatchObject({
            status: 404,
            code: 'NOT_FOUND',
            retryable: false,
            requestId: 'r1',
        });
    });

    it('requestId가 본문에 없으면 헤더(X-Request-Id, x-amzn-RequestId)에서 읽는다', async () => {
        const fetchImpl = async () =>
            json(
                { code: 'INTERNAL_ERROR', message: 'x', retryable: true },
                { status: 500, headers: { 'x-amzn-RequestId': 'gw-1' } },
            );
        const err = await make(fetchImpl as unknown as typeof fetch)
            .get('/x', schema)
            .catch((e) => e);
        expect(err.requestId).toBe('gw-1');
    });

    it('에러 형식이 아닌 응답(게이트웨이 HTML 등)은 상태 코드로 판단한다', async () => {
        const html = (status: number) => async () => new Response('<html>', { status });
        const c = (status: number) =>
            make(html(status) as unknown as typeof fetch)
                .get('/x', schema)
                .catch((e) => e);
        expect(await c(504)).toMatchObject({ code: 'LLM_TIMEOUT', retryable: true });
        expect(await c(401)).toMatchObject({ code: 'UNAUTHORIZED', retryable: false });
        expect(await c(429)).toMatchObject({ code: 'RATE_LIMITED', retryable: true });
        expect(await c(500)).toMatchObject({ code: 'INTERNAL_ERROR', retryable: true });
    });

    it('네트워크 오류는 다시 시도할 수 있는 INTERNAL_ERROR다', async () => {
        const fetchImpl = async () => {
            throw new TypeError('Failed to fetch');
        };
        const err = await make(fetchImpl as unknown as typeof fetch)
            .get('/x', schema)
            .catch((e) => e);
        expect(err).toMatchObject({ status: 0, code: 'INTERNAL_ERROR', retryable: true });
    });

    it('취소(AbortSignal)는 그대로 던진다', async () => {
        const ctrl = new AbortController();
        const fetchImpl = async () => {
            ctrl.abort();
            throw new DOMException('aborted', 'AbortError');
        };
        const err = await make(fetchImpl as unknown as typeof fetch)
            .get('/x', schema, { signal: ctrl.signal })
            .catch((e) => e);
        expect(isApiError(err)).toBe(false);
        expect(err.name).toBe('AbortError');
    });

    it('응답이 계약과 다르면 다시 시도해도 소용없는 INTERNAL_ERROR다', async () => {
        const fetchImpl = async () => json({ ok: 'yes' });
        const err = await make(fetchImpl as unknown as typeof fetch)
            .get('/x', schema)
            .catch((e) => e);
        expect(err).toMatchObject({ code: 'INTERNAL_ERROR', retryable: false });
    });
});
