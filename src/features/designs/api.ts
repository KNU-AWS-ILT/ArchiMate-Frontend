import type { DesignJob, NodeExplanation, OperationsGuide, Requirements } from './schemas';

/** 서버 호출 경계. 화면은 이 인터페이스만 알고, HTTP인지 목인지는 모른다. (이식성 규칙) */
export interface DesignsApi {
    /** 인터뷰 답변으로 3안 생성을 시작한다. 바로 `jobId`만 받는다. (202) */
    createDesign(
        answers: Requirements,
        opts?: { signal?: AbortSignal },
    ): Promise<{ jobId: string }>;
    /** 작업 상태와 끝난 안을 조회한다. 생성 실패도 HTTP 200이고 `status`로 구분한다. */
    getJob(jobId: string, opts?: { signal?: AbortSignal }): Promise<DesignJob>;
    /** 운영 절차. 3안 응답의 `operationsGuide`와 같은 값이다. */
    getGuide(designId: string, opts?: { signal?: AbortSignal }): Promise<OperationsGuide>;
    /** 노드 설명. 클릭할 때 생성되고 30일 캐시된다. */
    getExplanation(
        designId: string,
        nodeId: string,
        opts?: { signal?: AbortSignal },
    ): Promise<NodeExplanation>;
}
