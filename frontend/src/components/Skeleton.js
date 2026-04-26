import React from 'react';
import theme from '../theme';

export default function Skeleton({ width = '100%', height = '20px', borderRadius = '12px', style = {}, ...props }) {
    return (
        <div
            style={{
                width,
                height,
                borderRadius,
                background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.02) 75%)',
                backgroundSize: '400% 100%',
                animation: 'skeletonShimmer 2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
                border: '1px solid rgba(255,255,255,0.03)',
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
