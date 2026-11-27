import type { Position } from './layout';

export type Side = 'top' | 'right' | 'bottom' | 'left';

const OPPOSITE: Record<Side, Side> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
export const oppositeSide = (s: Side): Side => OPPOSITE[s];

/**
 * 연결선이 어느 변에서 나가고 어느 변으로 들어갈지 정한다. (프로토타입의 `route`와 같은 규칙)
 * 두 상자의 중심을 비교해서, 가로 차이가 세로 차이 이상이면 좌우 변을, 아니면 위아래 변을 쓴다.
 */
export function pickSides(
    from: Position,
    to: Position,
    size: { width: number; height: number },
): { source: Side; target: Side } {
    const dx = to.x + size.width / 2 - (from.x + size.width / 2);
    const dy = to.y + size.height / 2 - (from.y + size.height / 2);
    if (Math.abs(dx) >= Math.abs(dy)) {
        return dx > 0 ? { source: 'right', target: 'left' } : { source: 'left', target: 'right' };
    }
    return dy > 0 ? { source: 'bottom', target: 'top' } : { source: 'top', target: 'bottom' };
}
