// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Badge } from './badge';
import { Button } from './button';
import { Dialog, DialogContent, DialogTrigger } from './dialog';

afterEach(cleanup);

describe('Button', () => {
    it('누르면 onClick을 부른다', async () => {
        const onClick = vi.fn();
        render(<Button onClick={onClick}>생성</Button>);
        await userEvent.click(screen.getByRole('button', { name: '생성' }));
        expect(onClick).toHaveBeenCalledOnce();
    });

    it('disabled이면 누를 수 없다', async () => {
        const onClick = vi.fn();
        render(
            <Button disabled onClick={onClick}>
                생성
            </Button>,
        );
        await userEvent.click(screen.getByRole('button'));
        expect(onClick).not.toHaveBeenCalled();
    });
});

describe('Badge', () => {
    it('내용을 보여 준다', () => {
        render(<Badge tone="success">Free Tier</Badge>);
        expect(screen.getByText('Free Tier')).toBeTruthy();
    });
});

describe('Dialog', () => {
    it('열면 제목이 보인다', async () => {
        render(
            <Dialog>
                <DialogTrigger>열기</DialogTrigger>
                <DialogContent title="비교">내용</DialogContent>
            </Dialog>,
        );
        await userEvent.click(screen.getByText('열기'));
        expect(screen.getByRole('dialog', { name: '비교' })).toBeTruthy();
    });
});
