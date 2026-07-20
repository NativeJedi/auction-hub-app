import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// Apple touch icon (home-screen / bookmark). Same gavel mark as app/icon.tsx,
// scaled to the 180x180 Apple recommends.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: '#dbeafe',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="100"
          height="100"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m14 13-8.381 8.38a1 1 0 0 1-3.001-3l8.384-8.381" />
          <path d="m16 16 6-6" />
          <path d="m21.5 10.5-8-8" />
          <path d="m8 8 6-6" />
          <path d="m8.5 7.5 8 8" />
        </svg>
      </div>
    ),
    size
  );
}
