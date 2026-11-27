'use client';

import { Suspense } from 'react';
import { DesignsScreen } from '@/features/designs/designs-screen';

export default function DesignsPage() {
    return (
        <Suspense>
            <DesignsScreen />
        </Suspense>
    );
}
