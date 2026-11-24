/** 월 비용은 프론트가 계산하지 않고, 받은 값에 천 단위 콤마만 붙여 보여 준다. */
export const formatKRW = (amount: number): string => `${amount.toLocaleString('ko-KR')}원`;

export const formatUSD = (amount: number): string =>
    `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
