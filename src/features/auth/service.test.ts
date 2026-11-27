import { describe, expect, it, vi } from 'vitest';
import type { CognitoConfig } from './config';
import {
    buildAuthHeaders,
    createDevAuthService,
    createOidcAuthService,
    type OidcManagerLike,
    type OidcUserLike,
} from './service';

const config: CognitoConfig = {
    userPoolId: 'p',
    clientId: 'c',
    region: 'ap-southeast-2',
    domain: 'd.example.com',
};

const memoryStorage = () => {
    const map = new Map<string, string>();
    return {
        getItem: (k: string) => map.get(k) ?? null,
        setItem: (k: string, v: string) => void map.set(k, v),
        removeItem: (k: string) => void map.delete(k),
    };
};

describe('buildAuthHeaders', () => {
    it('로그인 전이면 비어 있다', () => {
        expect(buildAuthHeaders(null)).toEqual({});
    });
    it('ID 토큰이 있으면 Authorization에 그대로 넣는다', () => {
        expect(buildAuthHeaders({ email: 'a@b.c', idToken: 'tok' })).toEqual({
            Authorization: 'tok',
        });
    });
    it('토큰이 없으면 X-User-Id를 보낸다', () => {
        expect(buildAuthHeaders({ email: 'a@b.c', idToken: null })).toEqual({
            'X-User-Id': 'dev-user',
        });
    });
});

describe('개발용 로그인', () => {
    it('로그인하면 사용자가 생기고 로그아웃하면 사라진다', async () => {
        const s = createDevAuthService(memoryStorage());
        expect(await s.getUser()).toBeNull();
        await s.signIn();
        expect((await s.getUser())?.email).toBe('demo@archimate.dev');
        expect(await s.headers()).toEqual({ 'X-User-Id': 'dev-user' });
        await s.signOut();
        expect(await s.getUser()).toBeNull();
    });
});

describe('Cognito 로그인', () => {
    const user = (over: Partial<OidcUserLike> = {}): OidcUserLike => ({
        id_token: 'id-token',
        expired: false,
        profile: { email: 'me@example.com' },
        ...over,
    });
    const make = (stored: OidcUserLike | null) => {
        const manager: OidcManagerLike = {
            getUser: vi.fn(async () => stored),
            signinRedirect: vi.fn(async () => {}),
            signinRedirectCallback: vi.fn(async () => user()),
            removeUser: vi.fn(async () => {}),
        };
        const navigate = vi.fn();
        const service = createOidcAuthService({
            manager,
            config,
            origin: 'https://a.net',
            navigate,
        });
        return { manager, navigate, service };
    };

    it('저장된 사용자의 이메일과 ID 토큰을 돌려준다', async () => {
        const { service } = make(user());
        expect(await service.getUser()).toEqual({ email: 'me@example.com', idToken: 'id-token' });
        expect(await service.headers()).toEqual({ Authorization: 'id-token' });
    });

    it('만료된 사용자는 로그아웃 상태로 본다', async () => {
        const { service } = make(user({ expired: true }));
        expect(await service.getUser()).toBeNull();
        expect(await service.headers()).toEqual({});
    });

    it('로그인은 리다이렉트를 시작한다', async () => {
        const { service, manager } = make(null);
        await service.signIn();
        expect(manager.signinRedirect).toHaveBeenCalledOnce();
    });

    it('콜백을 끝내면 사용자 정보를 돌려준다', async () => {
        const { service } = make(null);
        expect(await service.completeSignIn()).toEqual({
            email: 'me@example.com',
            idToken: 'id-token',
        });
    });

    it('로그아웃하면 저장된 사용자를 지우고 Cognito 로그아웃 주소로 간다', async () => {
        const { service, manager, navigate } = make(user());
        await service.signOut();
        expect(manager.removeUser).toHaveBeenCalledOnce();
        expect(navigate).toHaveBeenCalledWith(
            expect.stringContaining('https://d.example.com/logout?'),
        );
    });
});
