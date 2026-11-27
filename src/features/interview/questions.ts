import { z } from 'zod';
import raw from '@contracts/examples/interview_questions.json';

// 질문은 백엔드 계약 예시(`contracts/examples/interview_questions.json`) 그대로다.
// 질문을 내려주는 API는 없고, 질문 id가 곧 답변(`Requirements`)의 필드명이다.
const optionSchema = z.object({
    value: z.string(),
    label: z.string(),
    description: z.string().nullish(),
});

export const interviewQuestionSchema = z.object({
    id: z.string(),
    text: z.string(),
    help: z.string().nullish(),
    inputType: z.enum(['single', 'multi', 'number', 'text']),
    options: z.array(optionSchema),
    required: z.boolean(),
    unit: z.string().nullish(),
    placeholder: z.string().nullish(),
});
export type InterviewQuestion = z.infer<typeof interviewQuestionSchema>;

export const QUESTIONS: readonly InterviewQuestion[] = z
    .object({ questions: z.array(interviewQuestionSchema) })
    .parse(raw).questions;

/** 답변 요약에 쓰는 짧은 이름 */
export const QUESTION_LABEL: Record<string, string> = {
    serviceType: '서비스 종류',
    concurrentUsers: '동시 접속',
    monthlyBudget: '월 예산',
    awsExperience: 'AWS 경험',
    dataStorage: '저장 데이터',
    trafficPattern: '접속 패턴',
    availability: '멈춤 허용',
    freeText: '자유 서술',
};
