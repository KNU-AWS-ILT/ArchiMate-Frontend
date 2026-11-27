export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** React Flow의 뷰포트와 같은 모양: 화면 위치(x, y)와 확대 배율(zoom) */
export interface View {
    x: number;
    y: number;
    zoom: number;
}

/** 캔버스 안에서 실제로 보이는 영역. 채팅 창이나 상단 바에 가리는 부분은 뺀다. */
export interface VisibleArea {
    left: number;
    top: number;
    width: number;
    height: number;
}

export function boundsOf(rects: Rect[]): Rect | null {
    if (rects.length === 0) return null;
    const x1 = Math.min(...rects.map((r) => r.x));
    const y1 = Math.min(...rects.map((r) => r.y));
    const x2 = Math.max(...rects.map((r) => r.x + r.width));
    const y2 = Math.max(...rects.map((r) => r.y + r.height));
    return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
}

export interface FitOptions {
    /** 영역 둘레에 더하는 여백 (구성도 좌표 기준) */
    padding?: number;
    /** 화면 가장자리 여백 (px) */
    margin?: number;
    maxZoom?: number;
}

/**
 * 영역(`bounds`)이 보이는 곳 한가운데에 꽉 차도록 하는 뷰를 계산한다.
 * 전체 화면 맞춤(`Fit`)과 "설정 단계 서비스로 확대" 둘 다 이 함수를 쓴다.
 */
export function viewForBounds(
    bounds: Rect,
    area: VisibleArea,
    { padding = 0, margin = 0, maxZoom = 2.2 }: FitOptions = {},
): View {
    const x1 = bounds.x - padding;
    const y1 = bounds.y - padding;
    const w = bounds.width + padding * 2;
    const h = bounds.height + padding * 2;
    const availW = Math.max(area.width - margin * 2, 1);
    const availH = Math.max(area.height - margin * 2, 1);
    const zoom = Math.min(availW / w, availH / h, maxZoom);
    return {
        zoom,
        x: area.left + margin + (availW - w * zoom) / 2 - x1 * zoom,
        y: area.top + margin + (availH - h * zoom) / 2 - y1 * zoom,
    };
}
