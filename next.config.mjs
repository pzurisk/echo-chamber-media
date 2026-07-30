/** @type {import('next').NextConfig} */

// Security headers, added 2026-07-30 after a security review. Every response
// carries these. scripts/security-audit.mjs checks they stay present and that
// every third-party host a page loads from is allowed by the CSP below. If you
// add a new external script, embed, image host, or fetch() target anywhere in
// src/, you MUST add its host to the matching CSP directive here, or browsers
// will silently block it in production.
const csp = [
  "default-src 'self'",
  // 'unsafe-inline' is required by Next.js hydration scripts and the GA4 snippet.
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://i.ytimg.com https://www.google-analytics.com https://www.googletagmanager.com",
  "font-src 'self'",
  // GA4 beacons + the contact form's AJAX post to FormSubmit.
  "connect-src 'self' https://*.google-analytics.com https://www.googletagmanager.com https://formsubmit.co",
  // YouTube demo embeds + Kuula 360 walkthrough embeds.
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://kuula.co",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://formsubmit.co",
  "frame-ancestors 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/contact",
        destination: "/#contact",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
