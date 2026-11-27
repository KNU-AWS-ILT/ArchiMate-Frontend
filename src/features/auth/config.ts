/** Cognito 호스팅 로그인 설정. 값이 하나라도 비어 있으면 로그인 없이 동작한다(개발용). */
export interface CognitoConfig {
    userPoolId: string;
    clientId: string;
    region: string;
    /** `https://` 없는 호스팅 도메인 */
    domain: string;
}

export interface AuthEnv {
    NEXT_PUBLIC_COGNITO_USER_POOL_ID?: string;
    NEXT_PUBLIC_COGNITO_CLIENT_ID?: string;
    NEXT_PUBLIC_COGNITO_REGION?: string;
    NEXT_PUBLIC_COGNITO_DOMAIN?: string;
}

export function readCognitoConfig(env: AuthEnv): CognitoConfig | null {
    const userPoolId = env.NEXT_PUBLIC_COGNITO_USER_POOL_ID?.trim();
    const clientId = env.NEXT_PUBLIC_COGNITO_CLIENT_ID?.trim();
    const region = env.NEXT_PUBLIC_COGNITO_REGION?.trim();
    const domain = env.NEXT_PUBLIC_COGNITO_DOMAIN?.trim().replace(/^https?:\/\//, '');
    if (!userPoolId || !clientId || !region || !domain) return null;
    return { userPoolId, clientId, region, domain };
}

export const CALLBACK_PATH = '/auth/callback/';

export const callbackUrl = (origin: string) => `${origin}${CALLBACK_PATH}`;

/** 로그아웃 뒤 돌아올 주소. 인프라에 등록된 `/`다. */
export const logoutUrl = (config: CognitoConfig, origin: string) =>
    `https://${config.domain}/logout?client_id=${encodeURIComponent(config.clientId)}&logout_uri=${encodeURIComponent(`${origin}/`)}`;

export const authorityOf = (config: CognitoConfig) =>
    `https://cognito-idp.${config.region}.amazonaws.com/${config.userPoolId}`;
