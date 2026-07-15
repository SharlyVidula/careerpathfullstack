import React from 'react';

export default function Skeleton({ width = '100%', height = '20px', borderRadius = '12px', style = {}, ...props }) {
    return (
        <div
            style={{
                width,
                height,
                borderRadius,
                background: 'var(--shimmer-grad)',
                backgroundSize: '400% 100%',
                animation: 'skeletonShimmer 2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
                border: '1px solid var(--shimmer-border)',
                ...style
            }}
            {...props}
        >
            <style>
                {`
          @keyframes skeletonShimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}
            </style>
        </div>
    );
}
