import type { NextConfig } from 'next';

// 로컬 개발에서만 `/api/v1`을 백엔드로 넘긴다. (코딩 규칙 3번: 프론트는 항상 상대 경로만 호출한다)
// `API_PROXY_TARGET`(예: http://localhost:8000)을 `.env.local`에 넣으면 켜진다.
// 정적 내보내기(빌드)에는 영향이 없다. 배포에서는 CloudFront나 Vercel이 같은 일을 한다.
const devProxyTarget =
    process.env.NODE_ENV === 'development' ? process.env.API_PROXY_TARGET : undefined;

const nextConfig: NextConfig = {
    output: 'export',
    trailingSlash: true,
    images: { unoptimized: true },
    ...(devProxyTarget
        ? {
              // POST /api/v1/designs가 308로 /api/v1/designs/ 로 바뀌지 않게 한다.
              skipTrailingSlashRedirect: true,
              async rewrites() {
                  return [
                      { source: '/api/v1/:path*', destination: `${devProxyTarget}/api/v1/:path*` },
                  ];
              },
          }
        : {}),
};

export default nextConfig;
