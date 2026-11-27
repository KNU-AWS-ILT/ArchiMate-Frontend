// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import completed from '@contracts/examples/design_job_completed.json';
import failed from '@contracts/examples/design_job_failed.json';
import partial from '@contracts/examples/design_job_partial_failed.json';
import running from '@contracts/examples/design_job_running.json';
import { AuthProvider } from '@/features/auth';
import { createDevAuthService } from '@/features/auth/service';
import { useInterviewStore } from '@/features/interview/store';
import { DesignsApiProvider } from '@/shared/api/context';
import type { DesignsApi } from './api';
import { DesignsScreen } from './designs-screen';
import { designJobSchema } from './schemas';

const push = vi.fn();
const replace = vi.fn();
let search = 'jobId=job_abc';
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push, replace }),
    useSearchParams: () => new URLSearchParams(search),
}));
// React Flow는 브라우저 크기 측정이 필요해서 jsdom에서는 그리지 않는다.
vi.mock('@/features/canvas/diagram-canvas', () => ({
    DiagramCanvas: ({
        architecture,
        onSelectNode,
    }: {
        architecture: { nodes: { id: string; label: string }[] };
        onSelectNode: (id: string) => void;
    }) => (
        <div>
            {architecture.nodes.map((n) => (
                <button key={n.id} onClick={() => onSelectNode(n.id)}>
                    노드 {n.label}
                </button>
            ))}
        </div>
    ),
}));

const job = (raw: unknown) => designJobSchema.parse(raw);

const memoryStorage = () => {
    const map = new Map<string, string>([['archimate-dev-user', '1']]);
    return {
        getItem: (k: string) => map.get(k) ?? null,
        setItem: (k: string, v: string) => void map.set(k, v),
        removeItem: (k: string) => void map.delete(k),
    };
};

const setup = (api: Partial<DesignsApi>) =>
    render(
        <QueryClientProvider
            client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
        >
            <AuthProvider service={createDevAuthService(memoryStorage())}>
                <DesignsApiProvider api={api as DesignsApi}>
                    <DesignsScreen />
                </DesignsApiProvider>
            </AuthProvider>
        </QueryClientProvider>,
    );

beforeEach(() => {
    search = 'jobId=job_abc';
    useInterviewStore.getState().reset();
});
afterEach(() => {
    cleanup();
    vi.useRealTimers();
    push.mockReset();
    replace.mockReset();
});

describe('3안 화면', () => {
    it('jobId가 없으면 인터뷰로 보낸다', async () => {
        search = '';
        setup({});
        await waitFor(() => expect(replace).toHaveBeenCalledWith('/interview/'));
    });

    it('생성 중이면 안별 진행 상태를 보여 준다', async () => {
        setup({ getJob: vi.fn().mockResolvedValue(job(running)) });
        expect(await screen.findByText('3안을 만들고 있어요')).toBeTruthy();
        expect(screen.getByText('최소비용형')).toBeTruthy();
    });

    it('끝나면 3안 탭과 월 비용을 보여 준다', async () => {
        setup({ getJob: vi.fn().mockResolvedValue(job(completed)) });
        const tabs = await screen.findAllByRole('tab');
        expect(tabs.map((t) => t.textContent)).toEqual(['최소비용형', '균형형', '확장형']);
        expect(await screen.findByText('월 예상 비용')).toBeTruthy();
        expect(screen.getByText(/원$/, { selector: 'b' })).toBeTruthy();
    });

    it('탭을 누르면 그 안의 요약으로 바뀐다', async () => {
        const data = job(completed);
        setup({ getJob: vi.fn().mockResolvedValue(data) });
        await userEvent.click(await screen.findByRole('tab', { name: '확장형' }));
        const scalable = data.designs.find((d) => d.tier === 'scalable')!;
        expect(await screen.findByText(scalable.title)).toBeTruthy();
    });

    it('노드를 누르면 설명을 불러와 보여 준다', async () => {
        const data = job(completed);
        const getExplanation = vi.fn().mockResolvedValue({
            nodeId: 'x',
            serviceType: 'dynamodb',
            name: 'Amazon DynamoDB',
            category: 'database',
            role: '데이터 저장',
            reason: '서버 관리 없이 쓸 수 있어서 선택했어요.',
            alternatives: [{ serviceType: 'rds', name: 'Amazon RDS', comparison: '더 비싸요.' }],
            cautions: [],
            monthlyCost: null,
        });
        setup({ getJob: vi.fn().mockResolvedValue(data), getExplanation });
        const first = data.designs[0].architecture.nodes[0];
        await userEvent.click(await screen.findByRole('button', { name: `노드 ${first.label}` }));
        expect(await screen.findByText('서버 관리 없이 쓸 수 있어서 선택했어요.')).toBeTruthy();
        expect(screen.getByText('Amazon RDS')).toBeTruthy();
        expect(getExplanation).toHaveBeenCalledWith(
            data.designs[0].id,
            first.id,
            expect.anything(),
        );
    });

    it('일부 안만 실패하면 안내와 다시 시도를 보여 주고, 실패한 탭은 누를 수 없다', async () => {
        setup({ getJob: vi.fn().mockResolvedValue(job(partial)) });
        expect(await screen.findByText('일부 안은 만들지 못했어요.')).toBeTruthy();
        const failedTab = screen.getAllByRole('tab').find((t) => t.textContent?.includes('실패'));
        expect((failedTab as HTMLButtonElement).disabled).toBe(true);
    });

    it('전부 실패하면 오류 문구를 보여 주고, 다시 시도하면 새 작업으로 이동한다', async () => {
        useInterviewStore.setState({
            answers: {
                serviceType: 'web_app',
                concurrentUsers: 'under_100',
                monthlyBudget: 50000,
                awsExperience: 'none',
                dataStorage: ['key_value'],
            },
            index: 8,
        });
        const createDesign = vi.fn().mockResolvedValue({ jobId: 'job_new' });
        setup({ getJob: vi.fn().mockResolvedValue(job(failed)), createDesign });
        expect(await screen.findByText('구성도를 만들지 못했어요')).toBeTruthy();
        await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));
        await waitFor(() => expect(replace).toHaveBeenCalledWith('/designs/?jobId=job_new'));
    });

    it('답변이 없으면 다시 시도할 수 없다는 안내를 보여 준다', async () => {
        setup({ getJob: vi.fn().mockResolvedValue(job(failed)), createDesign: vi.fn() });
        await userEvent.click(await screen.findByRole('button', { name: '다시 시도' }));
        expect((await screen.findByRole('alert')).textContent).toContain('질문부터 다시');
    });

    it('3초마다 다시 조회해서 끝나면 구성도로 바뀐다', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        const getJob = vi
            .fn()
            .mockResolvedValueOnce(job(running))
            .mockResolvedValue(job(completed));
        setup({ getJob });
        expect(await screen.findByText('3안을 만들고 있어요')).toBeTruthy();
        await act(async () => {
            await vi.advanceTimersByTimeAsync(3100);
        });
        expect(await screen.findAllByRole('tab')).toHaveLength(3);
        expect(getJob).toHaveBeenCalledTimes(2);
        // 끝난 뒤에는 더 조회하지 않는다
        await act(async () => {
            await vi.advanceTimersByTimeAsync(10_000);
        });
        expect(getJob).toHaveBeenCalledTimes(2);
    });

    it('조회에 실패하면 다시 불러오기를 보여 준다', async () => {
        setup({ getJob: vi.fn().mockRejectedValue(new Error('network')) });
        expect(await screen.findByText('상태를 불러오지 못했어요')).toBeTruthy();
        expect(screen.getByRole('button', { name: '다시 불러오기' })).toBeTruthy();
    });
});
