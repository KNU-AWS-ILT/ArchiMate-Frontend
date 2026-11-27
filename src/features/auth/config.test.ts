import { describe, expect, it } from 'vitest';
import { authorityOf, callbackUrl, logoutUrl, readCognitoConfig } from './config';

const env = {
    NEXT_PUBLIC_COGNITO_USER_POOL_ID: 'ap-southeast-2_abc',
    NEXT_PUBLIC_COGNITO_CLIENT_ID: 'client123',
    NEXT_PUBLIC_COGNITO_REGION: 'ap-southeast-2',
    NEXT_PUBLIC_COGNITO_DOMAIN: 'demo.auth.ap-southeast-2.amazoncognito.com',
};

describe('readCognitoConfig', () => {
    it('값이 모두 있으면 설정을 돌려준다', () => {
        expect(readCognitoConfig(env)).toEqual({
            userPoolId: 'ap-southeast-2_abc',
            clientId: 'client123',
            region: 'ap-southeast-2',
            domain: 'demo.auth.ap-southeast-2.amazoncognito.com',
        });
    });

    it('하나라도 비어 있으면 null이다 (로그인 건너뜀)', () => {
        expect(readCognitoConfig({ ...env, NEXT_PUBLIC_COGNITO_CLIENT_ID: '' })).toBeNull();
        expect(readCognitoConfig({})).toBeNull();
    });

    it('도메인 앞의 https://는 떼어 낸다', () => {
        const cfg = readCognitoConfig({
            ...env,
            NEXT_PUBLIC_COGNITO_DOMAIN: 'https://x.example.com',
        });
        expect(cfg?.domain).toBe('x.example.com');
    });
});

describe('주소 만들기', () => {
    const cfg = readCognitoConfig(env)!;

    it('콜백은 /auth/callback/ 이다', () => {
        expect(callbackUrl('https://a.cloudfront.net')).toBe(
            'https://a.cloudfront.net/auth/callback/',
        );
    });

    it('로그아웃 주소는 /로 돌아온다', () => {
        expect(logoutUrl(cfg, 'https://a.cloudfront.net')).toBe(
            'https://demo.auth.ap-southeast-2.amazoncognito.com/logout?client_id=client123&logout_uri=https%3A%2F%2Fa.cloudfront.net%2F',
        );
    });

    it('authority는 리전과 풀 ID로 만든다', () => {
        expect(authorityOf(cfg)).toBe(
            'https://cognito-idp.ap-southeast-2.amazonaws.com/ap-southeast-2_abc',
        );
    });
});
