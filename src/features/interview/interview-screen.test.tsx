// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '@/features/auth';
import { createDevAuthService } from '@/features/auth/service';
import type { DesignsApi } from '@/features/designs';
import { ApiError } from '@/shared/api/errors';
import { DesignsApiProvider } from '@/shared/api/context';
import { InterviewScreen } from './interview-screen';
import { useInterviewStore } from './store';

const push = vi.fn();
const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, replace }) }));

const memoryStorage = () => {
    const map = new Map<string, string>([['archimate-dev-user', '1']]);
    return {
        getItem: (k: string) => map.get(k) ?? null,
        setItem: (k: string, v: string) => void map.set(k, v),
        removeItem: (k: string) => void map.delete(k),
    };
};

const setup = (createDesign: DesignsApi['createDesign']) => {
    const api = { createDesign } as DesignsApi;
    render(
        <QueryClientProvider client={new QueryClient()}>
            <AuthProvider service={createDevAuthService(memoryStorage())}>
                <DesignsApiProvider api={api}>
                    <InterviewScreen />
                </DesignsApiProvider>
            </AuthProvider>
        </QueryClientProvider>,
    );
};

const pick = async (name: string) =>
    userEvent.click(await screen.findByRole('button', { name: new RegExp(name) }));

/** 8개 질문에 답한다. 선택 질문은 건너뛴다. */
async function answerAll() {
    await pick('웹 서비스');
    await pick('100명 이하');
    await userEvent.type(await screen.findByLabelText('한 달 인프라 예산은 얼마인가요?'), '50000');
    await userEvent.click(screen.getByRole('button', { name: '확인' }));
    await pick('처음이에요');
    await userEvent.click(await screen.findByRole('checkbox', { name: /단순한 목록/ }));
    await userEvent.click(screen.getByRole('button', { name: '선택 완료' }));
    for (let i = 0; i < 3; i++)
        await userEvent.click(await screen.findByRole('button', { name: '건너뛰기' }));
}

beforeEach(() => useInterviewStore.getState().reset());
afterEach(() => {
    cleanup();
    push.mockReset();
    replace.mockReset();
});

describe('인터뷰 화면', () => {
    it('첫 질문과 진행 상황을 보여 준다', async () => {
        setup(vi.fn());
        expect(await screen.findByText('어떤 서비스인가요?')).toBeTruthy();
        expect(screen.getByText('질문 1 / 8')).toBeTruthy();
    });

    it('예산에 잘못된 값을 넣으면 오류를 보여 주고 넘어가지 않는다', async () => {
        setup(vi.fn());
        await pick('웹 서비스');
        await pick('100명 이하');
        await userEvent.type(await screen.findByLabelText('한 달 인프라 예산은 얼마인가요?'), '-5');
        await userEvent.click(screen.getByRole('button', { name: '확인' }));
        expect((await screen.findByRole('alert')).textContent).toContain('0원 이상');
        expect(screen.getByText('질문 3 / 8')).toBeTruthy();
    });

    it('이전 답변 취소로 앞 질문으로 돌아간다', async () => {
        setup(vi.fn());
        await pick('웹 서비스');
        await userEvent.click(await screen.findByRole('button', { name: /이전 답변 취소/ }));
        expect(await screen.findByText('질문 1 / 8')).toBeTruthy();
    });

    it('모두 답하면 요약을 보여 주고 3안 만들기로 요청한 뒤 3안 화면으로 간다', async () => {
        const createDesign = vi.fn().mockResolvedValue({ jobId: 'job_abc' });
        setup(createDesign);
        await answerAll();
        expect(await screen.findByText('답변을 확인해 주세요.')).toBeTruthy();
        await userEvent.click(await screen.findByRole('button', { name: '3안 만들기' }));
        await waitFor(() => expect(push).toHaveBeenCalledWith('/designs/?jobId=job_abc'));
        expect(createDesign).toHaveBeenCalledWith(
            expect.objectContaining({
                serviceType: 'web_app',
                concurrentUsers: 'under_100',
                monthlyBudget: 50000,
            }),
        );
        const body = createDesign.mock.calls[0][0];
        expect(body).not.toHaveProperty('trafficPattern');
    });

    it('하루 생성 한도를 넘으면 안내 문구를 보여 준다', async () => {
        const createDesign = vi
            .fn()
            .mockRejectedValue(
                new ApiError({ status: 429, code: 'RATE_LIMITED', retryable: false }),
            );
        setup(createDesign);
        await answerAll();
        await userEvent.click(await screen.findByRole('button', { name: '3안 만들기' }));
        const alert = await screen.findByRole('alert');
        expect(within(alert).getByText(/오늘 만들 수 있는 횟수/)).toBeTruthy();
        expect(push).not.toHaveBeenCalled();
    });
});
