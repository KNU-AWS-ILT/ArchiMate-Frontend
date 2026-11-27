import { authorityOf, callbackUrl, logoutUrl, type CognitoConfig } from './config';

export interface AuthUser {
    email: string;
    /** 로그인을 건너뛰는 개발 모드에서는 null이다. */
    idToken: string | null;
}

/** 화면은 이 인터페이스만 안다. Cognito인지 개발용인지는 모른다. */
export interface AuthService {
    readonly enabled: boolean;
    getUser(): Promise<AuthUser | null>;
    signIn(): Promise<void>;
    /** `/auth/callback/`에서 한 번 호출한다. */
    completeSignIn(): Promise<AuthUser>;
    signOut(): Promise<void>;
    headers(): Promise<Record<string, string>>;
}

const DEV_KEY = 'archimate-dev-user';
const DEV_USER: AuthUser = { email: 'demo@archimate.dev', idToken: null };
const DEV_USER_ID = 'dev-user';

/**
 * API 요청 인증 헤더. (인프라 #4)
 * - Cognito: ID 토큰을 `Authorization`에 넣는다. `Bearer ` 접두사는 배포 후 확인하기로 했다.
 * - 개발: 토큰이 없어서 임시 사용자 ID를 `X-User-Id`로 보낸다. (백엔드 #12)
 */
export const buildAuthHeaders = (user: AuthUser | null): Record<string, string> => {
    if (!user) return {};
    return user.idToken ? { Authorization: user.idToken } : { 'X-User-Id': DEV_USER_ID };
};

/** 로그인을 건너뛴다. 환경 변수가 없을 때 쓴다. */
export function createDevAuthService(
    storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>,
): AuthService {
    const current = () => (storage.getItem(DEV_KEY) === '1' ? DEV_USER : null);
    return {
        enabled: false,
        getUser: async () => current(),
        signIn: async () => storage.setItem(DEV_KEY, '1'),
        completeSignIn: async () => {
            storage.setItem(DEV_KEY, '1');
            return DEV_USER;
        },
        signOut: async () => storage.removeItem(DEV_KEY),
        headers: async () => buildAuthHeaders(current()),
    };
}

/** `oidc-client-ts`의 `User` 중 쓰는 부분 */
export interface OidcUserLike {
    id_token?: string;
    expired?: boolean;
    profile: { email?: string; [key: string]: unknown };
}

/** `UserManager` 중 쓰는 부분. 테스트에서 가짜로 바꾼다. */
export interface OidcManagerLike {
    getUser(): Promise<OidcUserLike | null>;
    signinRedirect(): Promise<void>;
    signinRedirectCallback(): Promise<OidcUserLike>;
    removeUser(): Promise<void>;
}

const toUser = (u: OidcUserLike): AuthUser => ({
    email: u.profile.email ?? '',
    idToken: u.id_token ?? null,
});

export interface OidcServiceDeps {
    manager: OidcManagerLike;
    config: CognitoConfig;
    origin: string;
    /** 로그아웃 주소로 이동한다. */
    navigate: (url: string) => void;
}

export function createOidcAuthService({
    manager,
    config,
    navigate,
    origin,
}: OidcServiceDeps): AuthService {
    const getUser = async () => {
        const user = await manager.getUser();
        return user && !user.expired ? toUser(user) : null;
    };
    return {
        enabled: true,
        getUser,
        signIn: () => manager.signinRedirect(),
        completeSignIn: async () => toUser(await manager.signinRedirectCallback()),
        signOut: async () => {
            await manager.removeUser();
            navigate(logoutUrl(config, origin));
        },
        headers: async () => buildAuthHeaders(await getUser()),
    };
}

/** 브라우저에서만 쓴다. `oidc-client-ts`는 필요할 때 내려받는다. */
export async function createBrowserAuthService(config: CognitoConfig | null): Promise<AuthService> {
    if (!config) return createDevAuthService(window.sessionStorage);
    const { UserManager, WebStorageStateStore } = await import('oidc-client-ts');
    const origin = window.location.origin;
    const manager = new UserManager({
        authority: authorityOf(config),
        client_id: config.clientId,
        redirect_uri: callbackUrl(origin),
        response_type: 'code',
        scope: 'openid email profile',
        userStore: new WebStorageStateStore({ store: window.sessionStorage }),
    });
    return createOidcAuthService({
        manager,
        config,
        origin,
        navigate: (url) => window.location.assign(url),
    });
}
