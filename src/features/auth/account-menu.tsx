'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-provider';

/** 오른쪽 위 계정 버튼. 로그인한 이메일을 보여 주고 로그아웃한다. */
export function AccountMenu() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const email = user?.email || '로그인한 계정';
    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger
                aria-label="계정 메뉴"
                title={email}
                className="grid size-8 place-items-center rounded-full bg-accent text-sub font-bold text-on-accent"
            >
                {email[0]?.toUpperCase()}
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align="end"
                    sideOffset={8}
                    className="z-50 min-w-48 rounded-lg border border-border bg-surface p-1 shadow-card"
                >
                    <div className="px-3 py-2">
                        <small className="block text-cap text-muted">로그인한 계정</small>
                        <b className="text-sub break-all">{email}</b>
                    </div>
                    <DropdownMenu.Separator className="my-1 h-px bg-border" />
                    <DropdownMenu.Item
                        className="cursor-pointer rounded-md px-3 py-2 text-sub outline-none data-[highlighted]:bg-surface-2"
                        onSelect={async () => {
                            await signOut();
                            router.replace('/');
                        }}
                    >
                        로그아웃
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
