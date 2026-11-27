import { describe, expect, it } from 'vitest';
import {
    answerText,
    commitAnswer,
    initialInterview,
    isDone,
    parseBudget,
    redoFrom,
    toRequirements,
    toggleMulti,
    undoAnswer,
    type AnswerValue,
} from './flow';
import { QUESTIONS } from './questions';

const fullAnswers = (): Record<string, AnswerValue> => ({
    serviceType: 'web_app',
    concurrentUsers: 'under_100',
    monthlyBudget: 50000,
    awsExperience: 'none',
    dataStorage: ['key_value'],
    trafficPattern: null,
    availability: null,
    freeText: null,
});

const answerAll = () => {
    let s = initialInterview();
    for (const q of QUESTIONS) s = commitAnswer(s, QUESTIONS, fullAnswers()[q.id]);
    return s;
};

describe('질문', () => {
    it('계약 예시의 질문 8개를 읽는다', () => {
        expect(QUESTIONS.map((q) => q.id)).toEqual([
            'serviceType',
            'concurrentUsers',
            'monthlyBudget',
            'awsExperience',
            'dataStorage',
            'trafficPattern',
            'availability',
            'freeText',
        ]);
    });
});

describe('진행', () => {
    it('답하면 다음 질문으로 넘어간다', () => {
        const s = commitAnswer(initialInterview(), QUESTIONS, 'web_app');
        expect(s).toEqual({ answers: { serviceType: 'web_app' }, index: 1 });
    });

    it('모두 답하면 끝난다', () => {
        const s = answerAll();
        expect(isDone(s, QUESTIONS)).toBe(true);
        expect(commitAnswer(s, QUESTIONS, 'x')).toBe(s);
    });

    it('이전 답변을 취소하면 그 답이 지워진다', () => {
        let s = commitAnswer(initialInterview(), QUESTIONS, 'web_app');
        s = undoAnswer(s, QUESTIONS);
        expect(s).toEqual({ answers: {}, index: 0 });
        expect(undoAnswer(s, QUESTIONS)).toBe(s);
    });

    it('중간부터 다시 답하면 그 뒤의 답이 모두 지워진다', () => {
        const s = redoFrom(answerAll(), QUESTIONS, 2);
        expect(s.index).toBe(2);
        expect(Object.keys(s.answers)).toEqual(['serviceType', 'concurrentUsers']);
    });
});

describe('toggleMulti', () => {
    it('항목을 켜고 끈다', () => {
        expect(toggleMulti([], 'key_value')).toEqual(['key_value']);
        expect(toggleMulti(['key_value', 'relational'], 'key_value')).toEqual(['relational']);
    });
    it("'없음'을 고르면 나머지가 해제된다", () => {
        expect(toggleMulti(['relational'], 'none')).toEqual(['none']);
    });
    it("'없음' 상태에서 다른 항목을 고르면 '없음'이 해제된다", () => {
        expect(toggleMulti(['none'], 'relational')).toEqual(['relational']);
    });
    it("'없음'을 다시 누르면 해제된다", () => {
        expect(toggleMulti(['none'], 'none')).toEqual([]);
    });
});

describe('parseBudget', () => {
    it.each([
        ['0', 0],
        [' 50000 ', 50000],
        ['100000000', 100000000],
    ])('%s는 허용한다', (raw, value) => {
        expect(parseBudget(raw)).toEqual({ ok: true, value });
    });
    it.each(['', 'abc', '-1', '1.5', '100000001'])('%s는 거절한다', (raw) => {
        expect(parseBudget(raw).ok).toBe(false);
    });
});

describe('answerText', () => {
    const q = (id: string) => QUESTIONS.find((x) => x.id === id)!;
    it('선택은 라벨로 보여 준다', () => {
        expect(answerText(q('serviceType'), 'web_app')).toBe('웹 서비스');
    });
    it('다중 선택은 쉼표로 잇는다', () => {
        expect(answerText(q('dataStorage'), ['key_value', 'file_storage'])).toMatch(/.+, .+/);
    });
    it('예산은 원 단위로, 0원은 Free Tier 안내와 함께 보여 준다', () => {
        expect(answerText(q('monthlyBudget'), 50000)).toBe('50,000원');
        expect(answerText(q('monthlyBudget'), 0)).toBe('0원 (Free Tier 안에서만)');
    });
    it('건너뛴 답은 "건너뜀"이다', () => {
        expect(answerText(q('trafficPattern'), null)).toBe('건너뜀');
        expect(answerText(q('trafficPattern'), undefined)).toBe('건너뜀');
    });
});

describe('toRequirements', () => {
    it('건너뛴 선택 질문은 빼고 만든다', () => {
        const r = toRequirements(fullAnswers());
        expect(r.ok).toBe(true);
        if (r.ok) {
            expect(r.value).toEqual({
                serviceType: 'web_app',
                concurrentUsers: 'under_100',
                monthlyBudget: 50000,
                awsExperience: 'none',
                dataStorage: ['key_value'],
            });
        }
    });

    it('필수 답이 빠지면 실패한다', () => {
        const rest = fullAnswers();
        delete rest.serviceType;
        expect(toRequirements(rest).ok).toBe(false);
    });

    it("저장 데이터 '없음'을 다른 항목과 함께 보내지 않는다", () => {
        const r = toRequirements({ ...fullAnswers(), dataStorage: ['none', 'relational'] });
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.message).toContain('없음');
    });
});
