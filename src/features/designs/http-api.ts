import type { HttpClient } from '@/shared/api/http';
import type { DesignsApi } from './api';
import {
    designJobAcceptedSchema,
    designJobSchema,
    nodeExplanationSchema,
    operationsGuideSchema,
} from './schemas';

const seg = encodeURIComponent;

export function createHttpDesignsApi(http: HttpClient): DesignsApi {
    return {
        createDesign: (answers, opts) =>
            http.post('/designs', { answers }, designJobAcceptedSchema, opts),
        getJob: (jobId, opts) => http.get(`/designs/jobs/${seg(jobId)}`, designJobSchema, opts),
        getGuide: (designId, opts) =>
            http.get(`/designs/${seg(designId)}/guide`, operationsGuideSchema, opts),
        getExplanation: (designId, nodeId, opts) =>
            http.get(
                `/designs/${seg(designId)}/nodes/${seg(nodeId)}/explanation`,
                nodeExplanationSchema,
                opts,
            ),
    };
}
