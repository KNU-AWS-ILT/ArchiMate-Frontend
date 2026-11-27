// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './auth-provider';
import { AuthGuard } from './auth-guard';
import { LoginScreen } from './login-screen';
import { createDevAuthService } from './service';

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));

const memoryStorage = () => {
    const map = new Map<string, string>();
    return {
        getItem: (k: string) => map.get(k) ?? null,
        setItem: (k: string, v: string) => void map.set(k, v),
        removeItem: (k: string) => void map.delete(k),
    };
};

afterEach(() => {
    cleanup();
    replace.mockReset();
});

describe('로그인 화면', () => {
    it('버튼을 누르면 로그인하고 인터뷰로 이동한다', async () => {
        render(
            <AuthProvider service={createDevAuthService(memoryStorage())}>
                <LoginScreen />
            </AuthProvider>,
        );
        await userEvent.click(await screen.findByRole('button', { name: '로그인하고 시작하기' }));
        await waitFor(() => expect(replace).toHaveBeenCalledWith('/interview/'));
    });

    it('이미 로그인했으면 바로 인터뷰로 이동한다', async () => {
        const service = createDevAuthService(memoryStorage());
        await service.signIn();
        render(
            <AuthProvider service={service}>
                <LoginScreen />
            </AuthProvider>,
        );
        await waitFor(() => expect(replace).toHaveBeenCalledWith('/interview/'));
    });
});

describe('AuthGuard', () => {
    it('로그인하지 않았으면 내용을 숨기고 /로 보낸다', async () => {
        render(
            <AuthProvider service={createDevAuthService(memoryStorage())}>
                <AuthGuard>비밀 화면</AuthGuard>
            </AuthProvider>,
        );
        await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
        expect(screen.queryByText('비밀 화면')).toBeNull();
    });

    it('로그인했으면 내용을 보여 준다', async () => {
        const service = createDevAuthService(memoryStorage());
        await service.signIn();
        render(
            <AuthProvider service={service}>
                <AuthGuard>비밀 화면</AuthGuard>
            </AuthProvider>,
        );
        expect(await screen.findByText('비밀 화면')).toBeTruthy();
    });
});
