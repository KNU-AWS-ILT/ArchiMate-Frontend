'use client';

import { Button } from './button';
import { Dialog, DialogClose, DialogContent } from './dialog';

const SHORTCUTS: ReadonlyArray<[string, string]> = [
    ['+ / −', '확대 / 축소'],
    ['0', '화면에 맞추기'],
    ['E', '보기 전용 ↔ 편집 전환'],
    ['Esc', '선택 해제'],
    ['Delete', '선택한 서비스·연결선 삭제 (새 캔버스)'],
    ['빈 곳 드래그', '화면 이동'],
    ['마우스 휠', '확대 / 축소'],
];

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ShortcutsModal({ open, onOpenChange }: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent title="단축키" size="md">
                <dl className="mb-6 grid grid-cols-[auto_1fr] items-center gap-x-5 gap-y-3">
                    {SHORTCUTS.map(([key, desc]) => (
                        <div key={key} className="contents">
                            <dt>
                                <kbd className="rounded-md border border-b-2 border-border px-2 py-0.5 text-body whitespace-nowrap">
                                    {key}
                                </kbd>
                            </dt>
                            <dd className="text-[18px] text-muted">{desc}</dd>
                        </div>
                    ))}
                </dl>
                <DialogClose asChild>
                    <Button>닫기</Button>
                </DialogClose>
            </DialogContent>
        </Dialog>
    );
}
