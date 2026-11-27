import { stepKey } from './progress';

type ReadableStorage = Pick<Storage, 'getItem' | 'length' | 'key'>;
type WritableStorage = Pick<Storage, 'setItem' | 'removeItem'>;

const PREFIX = 'guide:';
const DONE = '1';

/** 저장된 완료 체크를 모두 읽는다. 키는 `guide:{designId}:{stepId}`다. (백엔드 #12) */
export function loadDoneSteps(storage: ReadableStorage): Set<string> {
    const done = new Set<string>();
    try {
        for (let i = 0; i < storage.length; i++) {
            const key = storage.key(i);
            if (key?.startsWith(PREFIX) && storage.getItem(key) === DONE) done.add(key);
        }
    } catch {
        // 저장소를 못 읽는 환경(사생활 보호 모드 등)에서는 체크를 저장하지 않고 넘어간다.
    }
    return done;
}

/** 단계 하나의 완료 여부를 저장한다. 저장에 실패해도 화면은 계속 동작한다. */
export function saveStepDone(
    storage: WritableStorage,
    designId: string,
    stepId: string,
    done: boolean,
): void {
    try {
        const key = stepKey(designId, stepId);
        if (done) storage.setItem(key, DONE);
        else storage.removeItem(key);
    } catch {
        // 저장 실패는 무시한다.
    }
}
