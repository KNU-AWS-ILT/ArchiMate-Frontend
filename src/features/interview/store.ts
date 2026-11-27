import { create } from 'zustand';
import {
    commitAnswer,
    initialInterview,
    redoFrom,
    undoAnswer,
    type AnswerValue,
    type InterviewState,
} from './flow';
import { QUESTIONS } from './questions';

interface InterviewStore extends InterviewState {
    commit: (value: AnswerValue) => void;
    undo: () => void;
    redo: (index: number) => void;
    reset: () => void;
}

/** 화면 이동(인터뷰 ↔ 3안 화면) 사이에도 답변을 유지한다. 새로고침하면 처음부터 다시 한다. */
export const useInterviewStore = create<InterviewStore>((set) => ({
    ...initialInterview(),
    commit: (value) => set((s) => commitAnswer(s, QUESTIONS, value)),
    undo: () => set((s) => undoAnswer(s, QUESTIONS)),
    redo: (index) => set((s) => redoFrom(s, QUESTIONS, index)),
    reset: () => set(initialInterview()),
}));
