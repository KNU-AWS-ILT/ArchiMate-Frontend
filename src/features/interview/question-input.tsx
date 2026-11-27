'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { parseBudget, toggleMulti, type AnswerValue } from './flow';
import type { InterviewQuestion } from './questions';

const BUDGET_CHIPS: ReadonlyArray<[number, string]> = [
    [0, '0원 (Free Tier만)'],
    [30000, '3만 원'],
    [50000, '5만 원'],
    [100000, '10만 원'],
];

interface Props {
    question: InterviewQuestion;
    onAnswer: (value: AnswerValue) => void;
}

const optionClass =
    'flex w-full items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-left hover:border-accent';

/** 질문 하나의 입력 위젯. 질문이 바뀌면 부모가 `key`로 새로 만든다. */
export function QuestionInput({ question: q, onAnswer }: Props) {
    const skip = q.required ? null : (
        <Button variant="secondary" onClick={() => onAnswer(null)}>
            건너뛰기
        </Button>
    );

    if (q.inputType === 'single') {
        return (
            <div>
                <div className="grid gap-2 sm:grid-cols-2">
                    {q.options.map((o) => (
                        <button
                            key={o.value}
                            type="button"
                            className={optionClass}
                            onClick={() => onAnswer(o.value)}
                        >
                            <span>
                                <b className="block">{o.label}</b>
                                {o.description && (
                                    <small className="text-sub text-muted">{o.description}</small>
                                )}
                            </span>
                        </button>
                    ))}
                </div>
                {skip && <div className="mt-3 flex justify-end">{skip}</div>}
            </div>
        );
    }
    if (q.inputType === 'multi') return <MultiInput question={q} onAnswer={onAnswer} skip={skip} />;
    if (q.inputType === 'number') return <NumberInput question={q} onAnswer={onAnswer} />;
    return <TextInput question={q} onAnswer={onAnswer} skip={skip} />;
}

function MultiInput({ question: q, onAnswer, skip }: Props & { skip: React.ReactNode }) {
    const [selected, setSelected] = useState<string[]>([]);
    return (
        <div>
            <div className="grid gap-2 sm:grid-cols-2">
                {q.options.map((o) => {
                    const checked = selected.includes(o.value);
                    return (
                        <button
                            key={o.value}
                            type="button"
                            role="checkbox"
                            aria-checked={checked}
                            className={cn(optionClass, checked && 'border-accent bg-accent-soft')}
                            onClick={() => setSelected((s) => toggleMulti(s, o.value))}
                        >
                            <span
                                aria-hidden
                                className={cn(
                                    'mt-0.5 grid size-5 shrink-0 place-items-center rounded border border-border text-cap',
                                    checked && 'border-accent bg-accent text-on-accent',
                                )}
                            >
                                {checked ? '✓' : ''}
                            </span>
                            <span>
                                <b className="block">{o.label}</b>
                                {o.description && (
                                    <small className="text-sub text-muted">{o.description}</small>
                                )}
                            </span>
                        </button>
                    );
                })}
            </div>
            <div className="mt-3 flex items-center justify-end gap-2">
                <span className="mr-auto text-sub text-muted">여러 개를 고를 수 있어요.</span>
                {skip}
                <Button disabled={selected.length === 0} onClick={() => onAnswer(selected)}>
                    선택 완료
                </Button>
            </div>
        </div>
    );
}

function NumberInput({ question: q, onAnswer }: Omit<Props, never>) {
    const [raw, setRaw] = useState('');
    const [error, setError] = useState('');
    const submit = () => {
        const r = parseBudget(raw);
        if (r.ok) onAnswer(r.value);
        else setError(r.message);
    };
    return (
        <div>
            <form
                noValidate
                className="flex items-center gap-2"
                onSubmit={(e) => {
                    e.preventDefault();
                    submit();
                }}
            >
                <input
                    autoFocus
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={100000000}
                    step={1000}
                    aria-label={q.text}
                    placeholder={q.placeholder ?? ''}
                    value={raw}
                    onChange={(e) => {
                        setRaw(e.target.value);
                        setError('');
                    }}
                    className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2"
                />
                <span className="text-muted">{q.unit === 'KRW' ? '원' : q.unit}</span>
                <Button type="submit">확인</Button>
            </form>
            <div className="mt-2 flex flex-wrap gap-2">
                {BUDGET_CHIPS.map(([value, label]) => (
                    <button
                        key={value}
                        type="button"
                        className="rounded-full border border-border bg-surface px-3 py-1 text-sub hover:border-accent"
                        onClick={() => {
                            setRaw(String(value));
                            setError('');
                        }}
                    >
                        {label}
                    </button>
                ))}
            </div>
            {error && (
                <p role="alert" className="mt-2 text-sub text-danger-text">
                    {error}
                </p>
            )}
        </div>
    );
}

function TextInput({ question: q, onAnswer, skip }: Props & { skip: React.ReactNode }) {
    const [text, setText] = useState('');
    return (
        <div>
            <textarea
                autoFocus
                aria-label={q.text}
                maxLength={1000}
                placeholder={q.placeholder ?? ''}
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="h-28 w-full resize-none rounded-lg border border-border bg-surface px-3 py-2"
            />
            <div className="mt-2 flex items-center justify-end gap-2">
                <span className="mr-auto text-cap text-muted">{text.length} / 1000</span>
                {skip}
                <Button onClick={() => onAnswer(text.trim() || null)}>보내기</Button>
            </div>
        </div>
    );
}
