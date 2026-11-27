'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AccountMenu } from '@/features/auth/account-menu';
import { AuthGuard } from '@/features/auth/auth-guard';
import { useDesignsApi } from '@/shared/api/context';
import { isApiError } from '@/shared/api/errors';
import { Button } from '@/shared/ui/button';
import { answerText, isDone, toRequirements } from './flow';
import { QuestionInput } from './question-input';
import { QUESTIONS, QUESTION_LABEL } from './questions';
import { useInterviewStore } from './store';

const bubble = 'max-w-[85%] rounded-2xl px-4 py-3';

export function InterviewScreen() {
    return (
        <AuthGuard>
            <InterviewContent />
        </AuthGuard>
    );
}

function InterviewContent() {
    const { answers, index, commit, undo, redo } = useInterviewStore();
    const api = useDesignsApi();
    const router = useRouter();
    const [error, setError] = useState('');
    const logRef = useRef<HTMLDivElement>(null);
    const done = isDone({ answers, index }, QUESTIONS);
    const q = QUESTIONS[index];

    const create = useMutation({
        mutationFn: async () => {
            const req = toRequirements(answers);
            if (!req.ok) throw new Error(req.message);
            return api.createDesign(req.value);
        },
        onSuccess: ({ jobId }) => router.push(`/designs/?jobId=${encodeURIComponent(jobId)}`),
        onError: (e) => setError(isApiError(e) ? e.userMessage : e.message),
    });

    useEffect(() => {
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    }, [index]);

    return (
        <div className="flex h-screen flex-col">
            <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-3">
                <b className="text-title">ArchiMate</b>
                <div className="flex items-center gap-4">
                    <span className="text-sub text-muted">
                        {done ? '답변 확인' : `질문 ${index + 1} / ${QUESTIONS.length}`}
                    </span>
                    <AccountMenu />
                </div>
            </header>
            <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={QUESTIONS.length}
                aria-valuenow={Math.min(index, QUESTIONS.length)}
                className="h-1 bg-border"
            >
                <i
                    className="block h-full bg-accent transition-all"
                    style={{
                        width: `${(Math.min(index, QUESTIONS.length) / QUESTIONS.length) * 100}%`,
                    }}
                />
            </div>
            <main
                ref={logRef}
                className="mx-auto w-full max-w-3xl flex-1 space-y-3 overflow-y-auto p-6"
            >
                <div className={`${bubble} bg-surface shadow-card`}>
                    안녕하세요! 질문 몇 개에 답해 주시면 예산과 경험에 맞는 AWS 구성도 3안을 만들어
                    드릴게요.
                </div>
                {QUESTIONS.slice(0, index).map((x) => (
                    <div key={x.id} className="space-y-3">
                        <Question q={x} />
                        <div className={`${bubble} ml-auto bg-accent-soft`}>
                            {answerText(x, answers[x.id])}
                        </div>
                    </div>
                ))}
                {!done && <Question q={q} />}
                {done && (
                    <>
                        <div className={`${bubble} bg-surface shadow-card`}>
                            <b className="block">답변을 확인해 주세요.</b>
                            <small className="text-muted">
                                맞으면 &quot;3안 만들기&quot;를 눌러 주세요. 고치고 싶은 답은
                                &quot;여기부터 다시 답하기&quot;를 누르세요.
                            </small>
                        </div>
                        <dl className="divide-y divide-border rounded-xl border border-border bg-surface">
                            {QUESTIONS.map((x, i) => (
                                <div key={x.id} className="flex items-center gap-3 px-4 py-2">
                                    <dt className="w-28 shrink-0 text-sub text-muted">
                                        {QUESTION_LABEL[x.id] ?? x.id}
                                    </dt>
                                    <dd className="min-w-0 flex-1 break-words">
                                        {answerText(x, answers[x.id])}
                                    </dd>
                                    <button
                                        type="button"
                                        className="text-cap text-accent-text underline"
                                        onClick={() => {
                                            setError('');
                                            redo(i);
                                        }}
                                    >
                                        여기부터 다시 답하기
                                    </button>
                                </div>
                            ))}
                        </dl>
                    </>
                )}
            </main>
            <footer className="border-t border-border bg-surface p-4">
                <div className="mx-auto w-full max-w-3xl">
                    {error && (
                        <p role="alert" className="mb-2 text-sub text-danger-text">
                            {error}
                        </p>
                    )}
                    {done ? (
                        <div className="flex items-center gap-2">
                            <Button variant="secondary" onClick={undo}>
                                ← 이전 답변 취소
                            </Button>
                            <Button
                                className="ml-auto py-3 text-body"
                                disabled={create.isPending}
                                onClick={() => {
                                    setError('');
                                    create.mutate();
                                }}
                            >
                                {create.isPending ? '요청하는 중…' : '3안 만들기'}
                            </Button>
                        </div>
                    ) : (
                        <>
                            <QuestionInput key={q.id} question={q} onAnswer={commit} />
                            {index > 0 && (
                                <Button variant="secondary" className="mt-3" onClick={undo}>
                                    ← 이전 답변 취소
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </footer>
        </div>
    );
}

function Question({ q }: { q: (typeof QUESTIONS)[number] }) {
    return (
        <div className={`${bubble} bg-surface shadow-card`}>
            <b className="block">{q.text}</b>
            {q.help && <small className="block text-muted">{q.help}</small>}
            {!q.required && (
                <small className="block text-muted">(선택 질문이에요. 건너뛰어도 돼요.)</small>
            )}
        </div>
    );
}
