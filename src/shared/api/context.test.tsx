// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DesignsApi } from '@/features/designs';
import { DesignsApiProvider, useDesignsApi } from './context';

afterEach(cleanup);

function Probe() {
    useDesignsApi();
    return <p>ok</p>;
}

describe('useDesignsApi', () => {
    it('Provider 안에서는 API를 돌려준다', () => {
        render(
            <DesignsApiProvider api={{} as DesignsApi}>
                <Probe />
            </DesignsApiProvider>,
        );
        expect(screen.getByText('ok')).toBeTruthy();
    });

    it('Provider 밖에서는 오류를 던진다', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(() => render(<Probe />)).toThrow();
        spy.mockRestore();
    });
});
