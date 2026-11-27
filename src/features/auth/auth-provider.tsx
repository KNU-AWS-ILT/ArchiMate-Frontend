'use client';

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { readCognitoConfig } from './config';
import { createBrowserAuthService, type AuthService, type AuthUser } from './service';

export interface AuthState {
    /** 시작할 때 저장된 로그인 상태를 읽는 동안 `loading`이다. */
    status: 'loading' | 'signedOut' | 'signedIn';
    user: AuthUser | null;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
    /** API 클라이언트용. 호출할 때마다 최신 토큰을 읽는다. */
    headers: () => Promise<Record<string, string>>;
    /** 콜백 화면에서 쓴다. */
    completeSignIn: () => Promise<AuthUser>;
}

const AuthContext = createContext<AuthState | null>(null);

export const useAuth = (): AuthState => {
    const auth = useContext(AuthContext);
    if (!auth) throw new Error('AuthProvider 안에서만 쓸 수 있습니다.');
    return auth;
};

const envConfig = () =>
    readCognitoConfig({
        NEXT_PUBLIC_COGNITO_USER_POOL_ID: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
        NEXT_PUBLIC_COGNITO_CLIENT_ID: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
        NEXT_PUBLIC_COGNITO_REGION: process.env.NEXT_PUBLIC_COGNITO_REGION,
        NEXT_PUBLIC_COGNITO_DOMAIN: process.env.NEXT_PUBLIC_COGNITO_DOMAIN,
    });

interface AuthProviderProps {
    children: ReactNode;
    /** 테스트에서 가짜 서비스를 넣는다. */
    service?: AuthService;
}

export function AuthProvider({ children, service }: AuthProviderProps) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [status, setStatus] = useState<AuthState['status']>('loading');
    const servicePromise = useRef<Promise<AuthService> | null>(null);
    const getService = useCallback(() => {
        servicePromise.current ??= service
            ? Promise.resolve(service)
            : createBrowserAuthService(envConfig());
        return servicePromise.current;
    }, [service]);

    useEffect(() => {
        let cancelled = false;
        void getService()
            .then((s) => s.getUser())
            .then((u) => {
                if (cancelled) return;
                setUser(u);
                setStatus(u ? 'signedIn' : 'signedOut');
            })
            .catch(() => {
                if (!cancelled) setStatus('signedOut');
            });
        return () => {
            cancelled = true;
        };
    }, [getService]);

    const value = useMemo<AuthState>(
        () => ({
            status,
            user,
            signIn: async () => {
                const s = await getService();
                await s.signIn();
                if (!s.enabled) {
                    const u = await s.getUser();
                    setUser(u);
                    setStatus(u ? 'signedIn' : 'signedOut');
                }
            },
            signOut: async () => {
                const s = await getService();
                await s.signOut();
                setUser(null);
                setStatus('signedOut');
            },
            headers: async () => (await getService()).headers(),
            completeSignIn: async () => {
                const u = await (await getService()).completeSignIn();
                setUser(u);
                setStatus('signedIn');
                return u;
            },
        }),
        [status, user, getService],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
