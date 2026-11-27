// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import completed from '@contracts/examples/design_job_completed.json';
import failed from '@contracts/examples/design_job_failed.json';
import partial from '@contracts/examples/design_job_partial_failed.json';
import running from '@contracts/examples/design_job_running.json';
import { AuthProvider } from '@/features/auth';
import { createDevAuthService } from '@/features/auth/service';
import type { FlowNode } from '@/features/canvas/flow-elements';
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
        nodes,
        focusIds,
        movable,
        onSelectNode,
    }: {
        nodes: FlowNode[];
        focusIds?: ReadonlySet<string>;
        movable: boolean;
        onSelectNode: (id: string) => void;
    }) => (
        <div
            data-testid="diagram"
            data-movable={movable}
            data-focus={[...(focusIds ?? [])].join(',')}
        >
            {nodes
                .filter((n) => n.type === 'service')
                .map((n) => (
                    <button key={n.id} onClick={() => onSelectNode(n.id)}>
                        노드 {String(n.data.label)}
                    </button>
                ))}
        </div>
    ),
}));
vi.mock('@/features/canvas/custom-canvas', () => ({
    CustomCanvas: ({
        fresh,
        onSummary,
    }: {
        fresh: boolean;
        onSummary: (s: { nodes: number; edges: number }) => void;
    }) => {
        useEffect(() => onSummary({ nodes: 2, edges: 1 }), [onSummary]);
        return <div data-testid="custom-canvas" data-fresh={fresh} />;
    },
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

/** 상단 바의 3안 선택 메뉴를 연다. (Radix 메뉴는 키보드로 연다) */
async function openTierMenu() {
    const trigger = await screen.findByRole('button', { name: '3안 선택' });
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    return screen.findByRole('menu');
}

const answers = {
    serviceType: 'web_app',
    concurrentUsers: 'under_100',
    monthlyBudget: 50000,
    awsExperience: 'none',
    dataStorage: ['key_value'],
};

beforeEach(() => {
    search = 'jobId=job_abc';
    useInterviewStore.getState().reset();
    window.localStorage.clear();
    globalThis.ResizeObserver ??= class {
        observe() {}
        unobserve() {}
        disconnect() {}
    } as unknown as typeof ResizeObserver;
});
afterEach(() => {
    cleanup();
    vi.useRealTimers();
    push.mockReset();
    replace.mockReset();
});

describe('생성 상태', () => {
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
        expect(await screen.findByRole('button', { name: '3안 선택' })).toBeTruthy();
        expect(getJob).toHaveBeenCalledTimes(2);
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

    it('전부 실패하면 오류 문구를 보여 주고, 다시 시도하면 새 작업으로 이동한다', async () => {
        useInterviewStore.setState({ answers, index: 8 });
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
});

describe('구성도 화면', () => {
    it('3안 메뉴에 만든 안의 비용과 난이도를 보여 준다', async () => {
        const data = job(completed);
        setup({ getJob: vi.fn().mockResolvedValue(data) });
        const menu = await openTierMenu();
        for (const label of ['최소비용형', '균형형', '확장형']) {
            expect(within(menu).getByText(label)).toBeTruthy();
        }
        expect(within(menu).getAllByText(/^월 .+원$/)).toHaveLength(3);
        expect(within(menu).getByText('＋ 새 캔버스')).toBeTruthy();
    });

    it('다른 안을 고르면 그 안의 설정 가이드로 바뀐다', async () => {
        const data = job(completed);
        setup({ getJob: vi.fn().mockResolvedValue(data) });
        const menu = await openTierMenu();
        await userEvent.click(within(menu).getByText('확장형'));
        const scalable = data.designs.find((d) => d.tier === 'scalable')!;
        expect(await screen.findByText(scalable.title)).toBeTruthy();
    });

    it('설정 가이드에 진행률과 단계 탭을 보여 준다', async () => {
        const data = job(completed);
        setup({ getJob: vi.fn().mockResolvedValue(data) });
        const guide = data.designs[0].operationsGuide!;
        expect(
            await screen.findByText(`0 / ${guide.phases.flatMap((p) => p.steps).length} 완료`),
        ).toBeTruthy();
        expect(screen.getAllByRole('tab')).toHaveLength(guide.phases.length);
    });

    it('단계를 누르면 펼쳐지고 그 단계의 서비스를 캔버스에서 강조한다', async () => {
        const data = job(completed);
        setup({ getJob: vi.fn().mockResolvedValue(data) });
        const step = data.designs[0].operationsGuide!.phases[0].steps[0];
        await userEvent.click(await screen.findByText(step.title));
        expect(await screen.findByText(step.todo[0])).toBeTruthy();
        expect(screen.getByTestId('diagram').getAttribute('data-focus')).toBe(
            step.nodeIds.join(','),
        );
        await userEvent.click(screen.getByText(step.title));
        await waitFor(() =>
            expect(screen.getByTestId('diagram').getAttribute('data-focus')).toBe(''),
        );
    });

    it('완료로 표시하면 진행률이 오르고 localStorage에 안별 키로 저장된다', async () => {
        const data = job(completed);
        setup({ getJob: vi.fn().mockResolvedValue(data) });
        const design = data.designs[0];
        const step = design.operationsGuide!.phases[0].steps[0];
        await userEvent.click(
            await screen.findByRole('button', { name: `${step.title} 완료로 표시` }),
        );
        expect(window.localStorage.getItem(`guide:${design.id}:${step.id}`)).toBe('1');
        const total = design.operationsGuide!.phases.flatMap((p) => p.steps).length;
        expect(await screen.findByText(`1 / ${total} 완료`)).toBeTruthy();
        await userEvent.click(screen.getByRole('button', { name: `${step.title} 완료 취소` }));
        expect(window.localStorage.getItem(`guide:${design.id}:${step.id}`)).toBeNull();
    });

    it('서비스를 누르면 설명을 불러와 보여 준다', async () => {
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

    it('E 키로 편집 모드를 켜고 끈다', async () => {
        setup({ getJob: vi.fn().mockResolvedValue(job(completed)) });
        const diagram = await screen.findByTestId('diagram');
        expect(diagram.getAttribute('data-movable')).toBe('false');
        await userEvent.keyboard('e');
        expect(screen.getByTestId('diagram').getAttribute('data-movable')).toBe('true');
        expect(screen.getByRole('button', { name: 'Editing' })).toBeTruthy();
    });
});

describe('3안 비교', () => {
    it('비교 표에 비용·난이도·장단점을 보여 주고 다른 안을 고를 수 있다', async () => {
        const data = job(completed);
        setup({ getJob: vi.fn().mockResolvedValue(data) });
        await userEvent.click(await screen.findByRole('button', { name: '3안 비교' }));
        const dialog = await screen.findByRole('dialog', { name: '3안 비교' });
        for (const row of [
            '월 예상 비용',
            'Free Tier',
            '운영 난이도',
            '장점',
            '단점',
            '성장 로드맵',
        ]) {
            expect(within(dialog).getByText(row)).toBeTruthy();
        }
        expect(within(dialog).getByText('보고 있는 안')).toBeTruthy();
        const balanced = data.designs.find((d) => d.tier === 'balanced')!;
        await userEvent.click(within(dialog).getAllByRole('button', { name: '이 안 선택' })[0]);
        expect(await screen.findByText(balanced.title)).toBeTruthy();
    });
});

describe('일부 안 실패', () => {
    it('실패한 안은 메뉴에 표시되고, 누르면 실패 모달이 열린다', async () => {
        useInterviewStore.setState({ answers, index: 8 });
        const createDesign = vi.fn().mockResolvedValue({ jobId: 'job_new' });
        setup({ getJob: vi.fn().mockResolvedValue(job(partial)), createDesign });
        expect(await screen.findByText('일부 안은 만들지 못했어요')).toBeTruthy();
        const menu = await openTierMenu();
        await userEvent.click(within(menu).getByText(/만들지 못했어요 · 눌러서 다시 시도/));
        const dialog = await screen.findByRole('dialog');
        expect(within(dialog).getByRole('heading', { name: /은 만들지 못했어요/ })).toBeTruthy();
        await userEvent.click(within(dialog).getByRole('button', { name: '다시 시도' }));
        await waitFor(() => expect(replace).toHaveBeenCalledWith('/designs/?jobId=job_new'));
    });
});

describe('새 캔버스', () => {
    it('메뉴에서 새 캔버스를 고르면 직접 구성 화면으로 바뀐다', async () => {
        window.localStorage.removeItem('archimate-custom-canvas');
        setup({ getJob: vi.fn().mockResolvedValue(job(completed)) });
        const menu = await openTierMenu();
        await userEvent.click(within(menu).getByText('＋ 새 캔버스'));
        const canvas = await screen.findByTestId('custom-canvas');
        expect(canvas.getAttribute('data-fresh')).toBe('true');
        expect(screen.getByText('직접 구성한 캔버스예요')).toBeTruthy();
    });

    it('만든 캔버스가 있으면 메뉴에 개수가 보이고, 새로 만들기는 확인을 거친다', async () => {
        setup({ getJob: vi.fn().mockResolvedValue(job(completed)) });
        let menu = await openTierMenu();
        await userEvent.click(within(menu).getByText('＋ 새 캔버스'));
        await screen.findByTestId('custom-canvas');

        menu = await openTierMenu();
        expect(within(menu).getByText('직접 구성 · 서비스 2개 · 연결 1개')).toBeTruthy();
        await userEvent.click(within(menu).getByText('＋ 새 캔버스 만들기'));
        const dialog = await screen.findByRole('dialog', { name: '새 캔버스를 만들까요?' });
        await userEvent.click(within(dialog).getByRole('button', { name: '새로 만들기' }));
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(screen.getByTestId('custom-canvas').getAttribute('data-fresh')).toBe('true');
    });

    it('3안으로 돌아가면 설정 가이드가 다시 보인다', async () => {
        setup({ getJob: vi.fn().mockResolvedValue(job(completed)) });
        let menu = await openTierMenu();
        await userEvent.click(within(menu).getByText('＋ 새 캔버스'));
        await screen.findByTestId('custom-canvas');
        menu = await openTierMenu();
        await userEvent.click(within(menu).getByText('균형형'));
        expect(await screen.findByText('설정 가이드')).toBeTruthy();
        expect(screen.queryByTestId('custom-canvas')).toBeNull();
    });
});
