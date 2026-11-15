import React from 'react';

interface OmniLogoProps {
  className?: string;
}

/**
 * Monochrome geometric mark for OmniID:
 * An outer octagon vault frame with 3 interlocking key-node bars (representing 3-of-5 recovery).
 */
export function OmniLogo({ className = 'h-5 w-5' }: OmniLogoProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M11 3H21L29 11V21L21 29H11L3 21V11L11 3Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <rect x="9.5" y="10.5" width="13" height="2.4" rx="1.2" fill="currentColor" />
      <rect x="9.5" y="14.8" width="9" height="2.4" rx="1.2" fill="currentColor" />
      <rect x="9.5" y="19.1" width="13" height="2.4" rx="1.2" fill="currentColor" />
      <circle cx="21.3" cy="16" r="1.4" fill="currentColor" />
    </svg>
  );
}
