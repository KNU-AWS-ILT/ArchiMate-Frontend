import { requirementsSchema, type Requirements } from '@/features/designs/schemas';
import { formatKRW } from '@/shared/lib/format';
import type { InterviewQuestion } from './questions';

/** 단일·다중 선택은 option value, 숫자는 number, 자유 서술은 string. 건너뛰면 null */
export type AnswerValue = string | string[] | number | null;

export interface InterviewState {
    answers: Record<string, AnswerValue>;
    /** 지금 묻는 질문 번호. 질문 수와 같으면 모두 답한 것이다. */
    index: number;
}

export const initialInterview = (): InterviewState => ({ answers: {}, index: 0 });

export const isDone = (state: InterviewState, questions: readonly InterviewQuestion[]) =>
    state.index >= questions.length;

/** 지금 질문에 답하고 다음으로 넘어간다. 모두 답한 뒤에는 바뀌지 않는다. */
export function commitAnswer(
    state: InterviewState,
    questions: readonly InterviewQuestion[],
    value: AnswerValue,
): InterviewState {
    if (isDone(state, questions)) return state;
    const q = questions[state.index];
    return { answers: { ...state.answers, [q.id]: value }, index: state.index + 1 };
}

/** 바로 앞 답변을 취소한다. */
export function undoAnswer(
    state: InterviewState,
    questions: readonly InterviewQuestion[],
): InterviewState {
    if (state.index === 0) return state;
    return redoFrom(state, questions, state.index - 1);
}

/** `index`번 질문부터 다시 답한다. 그 질문 이후의 답은 지운다. */
export function redoFrom(
    state: InterviewState,
    questions: readonly InterviewQuestion[],
    index: number,
): InterviewState {
    const answers = { ...state.answers };
    for (const q of questions.slice(index)) delete answers[q.id];
    return { answers, index };
}

/** 다중 선택에서 한 항목을 켜고 끈다. '없음'은 다른 항목과 함께 고를 수 없다. */
export function toggleMulti(selected: readonly string[], value: string): string[] {
    if (value === 'none') return selected.includes('none') ? [] : ['none'];
    const rest = selected.filter((v) => v !== 'none');
    return rest.includes(value) ? rest.filter((v) => v !== value) : [...rest, value];
}

export type BudgetResult = { ok: true; value: number } | { ok: false; message: string };

export function parseBudget(raw: string): BudgetResult {
    const text = raw.trim();
    const n = Number(text);
    if (text === '' || !Number.isInteger(n) || n < 0 || n > 100_000_000) {
        return { ok: false, message: '0원 이상 1억 원 이하의 숫자를 입력해 주세요.' };
    }
    return { ok: true, value: n };
}

const optionLabel = (q: InterviewQuestion, value: string) =>
    q.options.find((o) => o.value === value)?.label ?? value;

/** 채팅 말풍선과 요약에 보여 줄 답변 글 */
export function answerText(q: InterviewQuestion, value: AnswerValue | undefined): string {
    if (value === null || value === undefined || value === '') return '건너뜀';
    if (Array.isArray(value)) return value.map((v) => optionLabel(q, v)).join(', ');
    if (typeof value === 'number')
        return value === 0 ? '0원 (Free Tier 안에서만)' : formatKRW(value);
    return q.inputType === 'text' ? value : optionLabel(q, value);
}

export type RequirementsResult = { ok: true; value: Requirements } | { ok: false; message: string };

/** 건너뛴 선택 질문은 빼고 요청 본문으로 바꾼다. 서버가 400으로 거절할 값은 여기서 막는다. */
export function toRequirements(answers: Record<string, AnswerValue>): RequirementsResult {
    const body = Object.fromEntries(
        Object.entries(answers).filter(([, v]) => v !== null && v !== undefined && v !== ''),
    );
    const parsed = requirementsSchema.safeParse(body);
    if (parsed.success) return { ok: true, value: parsed.data };
    return { ok: false, message: parsed.error.issues[0]?.message ?? '답변을 확인해 주세요.' };
}
