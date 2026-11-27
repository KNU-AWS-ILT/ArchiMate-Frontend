/** 설정 가이드 패널 폭 (px). 프로토타입의 `clamp(400px, 28vw, 480px)`을 기본값으로 쓴다. */
export const PANEL_MIN = 360;
export const PANEL_MAX = 640;
export const PANEL_STORAGE_KEY = 'archimate-guide-width';

export const defaultPanelWidth = (viewportWidth: number): number =>
    Math.round(Math.min(480, Math.max(400, viewportWidth * 0.28)));

/** 캔버스가 너무 좁아지지 않게 화면 폭의 60%까지만 허용한다. */
export const clampPanelWidth = (width: number, viewportWidth: number): number =>
    Math.round(Math.min(PANEL_MAX, viewportWidth * 0.6, Math.max(PANEL_MIN, width)));

export function parseStoredWidth(raw: string | null): number | null {
    if (raw === null) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
}
