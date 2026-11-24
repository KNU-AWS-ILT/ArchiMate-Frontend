'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function DesignsScreen() {
    const jobId = useSearchParams().get('jobId');
    return <main className="p-8">3안 비교 {jobId}</main>;
}

export default function DesignsPage() {
    return (
        <Suspense>
            <DesignsScreen />
        </Suspense>
    );
}
