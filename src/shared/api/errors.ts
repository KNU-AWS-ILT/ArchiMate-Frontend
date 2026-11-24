import { z } from 'zod';

/** 백엔드 에러 `code` 8종 (coding-conventions 8번). */
export const ERROR_CODES = [
    'INVALID_REQUEST',
    'UNAUTHORIZED',
    'NOT_FOUND',
    'RATE_LIMITED',
    'DESIGN_GENERATION_FAILED',
    'LLM_TIMEOUT',
    'EXPLANATION_FAILED',
    'INTERNAL_ERROR',
] as const;

export const errorCodeSchema = z.enum(ERROR_CODES);
export type ErrorCode = z.infer<typeof errorCodeSchema>;

/** 에러 응답 `{ code, message, retryable, requestId }` */
export const errorResponseSchema = z.object({
    code: errorCodeSchema,
    message: z.string(),
    retryable: z.boolean(),
    requestId: z.string().nullish(),
});
export type ErrorResponse = z.infer<typeof errorResponseSchema>;

// 프론트는 서버 `message`를 그대로 보여 주지 않고 `code`별 한국어 문구로 바꿔 보여 준다.
const MESSAGES: Record<ErrorCode, string> = {
    INVALID_REQUEST: '입력한 내용을 다시 확인해 주세요.',
    UNAUTHORIZED: '로그인이 필요해요. 다시 로그인해 주세요.',
    NOT_FOUND: '찾을 수 없어요. 보관 기간(30일)이 지났거나 주소가 잘못됐을 수 있어요.',
    RATE_LIMITED: '요청이 많아요. 잠시 후 다시 시도해 주세요.',
    DESIGN_GENERATION_FAILED: '구성도를 만들지 못했어요. 잠시 후 다시 시도해 주세요.',
    LLM_TIMEOUT: '생성이 오래 걸려서 멈췄어요. 다시 시도해 주세요.',
    EXPLANATION_FAILED: '설명을 만들지 못했어요. 다시 시도해 주세요.',
    INTERNAL_ERROR: '서버에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
};

/** 하루 생성 횟수를 넘은 경우(`RATE_LIMITED`, `retryable: false`)는 기다려도 소용없다. */
const DAILY_LIMIT_MESSAGE = '오늘 만들 수 있는 횟수를 모두 사용했어요. 내일 다시 시도해 주세요.';

export function errorMessage(code: ErrorCode, retryable = true): string {
    if (code === 'RATE_LIMITED' && !retryable) return DAILY_LIMIT_MESSAGE;
    return MESSAGES[code];
}

export class ApiError extends Error {
    readonly status: number;
    readonly code: ErrorCode;
    readonly retryable: boolean;
    readonly requestId: string | null;

    constructor(init: {
        status: number;
        code: ErrorCode;
        retryable: boolean;
        requestId?: string | null;
        /** 서버가 보낸 메시지. 로그용이며 화면에는 `userMessage`를 쓴다. */
        serverMessage?: string;
    }) {
        super(init.serverMessage ?? errorMessage(init.code, init.retryable));
        this.name = 'ApiError';
        this.status = init.status;
        this.code = init.code;
        this.retryable = init.retryable;
        this.requestId = init.requestId ?? null;
    }

    /** 화면에 보여 줄 한국어 문구 */
    get userMessage(): string {
        return errorMessage(this.code, this.retryable);
    }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;

/** 에러 응답 본문(작업 조회의 `error`)을 화면용 문구로 바꾼다. */
export function messageOf(error: Pick<ErrorResponse, 'code' | 'retryable'>): string {
    return errorMessage(error.code, error.retryable);
}
