import { createHttpClient, type HeaderProvider } from '@/shared/api/http';
import type { DesignsApi } from './api';
import { createHttpDesignsApi } from './http-api';
import type { MockOptions, MockScenario } from './mock-api';

export type ApiMode = 'mock' | 'http';

/** `NEXT_PUBLIC_API_MODE=mock`일 때만 목을 쓴다. 비어 있으면 실제 API다. */
export const resolveApiMode = (value: string | undefined): ApiMode =>
    value === 'mock' ? 'mock' : 'http';

/**
 * 주소의 `?state=`로 목 시나리오를 고른다. (프로토타입과 같은 방식)
 * 실패한 뒤 다시 시도하면 성공하도록 두 번째 시나리오는 `success`다.
 */
export function scenariosFromSearch(search: string): MockScenario[] {
    const state = new URLSearchParams(search).get('state');
    if (state === 'partial-failed') return ['partial-failed', 'success'];
    if (state === 'failed') return ['failed', 'success'];
    return ['success'];
}

// 목은 계약 예시 JSON을 가져오므로 필요할 때만 내려받는다. (실제 API 번들에는 넣지 않는다)
function createLazyMockApi(options: MockOptions): DesignsApi {
    let loaded: Promise<DesignsApi> | undefined;
    const api = () =>
        (loaded ??= import('./mock-api').then((m) => m.createMockDesignsApi(options)));
    return {
        createDesign: async (a, o) => (await api()).createDesign(a, o),
        getJob: async (id, o) => (await api()).getJob(id, o),
        getGuide: async (id, o) => (await api()).getGuide(id, o),
        getExplanation: async (id, n, o) => (await api()).getExplanation(id, n, o),
    };
}

export interface CreateApiOptions {
    mode: ApiMode;
    /** 인증 헤더 (로그인 연결 후) */
    headers?: HeaderProvider;
    /** 목 모드에서 `?state=`를 읽을 `location.search` */
    search?: string;
    mock?: MockOptions;
}

export function createDesignsApi({
    mode,
    headers,
    search = '',
    mock,
}: CreateApiOptions): DesignsApi {
    if (mode === 'mock') {
        return createLazyMockApi({
            scenarios: scenariosFromSearch(search),
            latencyMs: 400,
            ...mock,
        });
    }
    return createHttpDesignsApi(createHttpClient({ headers }));
}

export type { DesignsApi } from './api';
