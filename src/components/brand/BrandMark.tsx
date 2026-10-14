import { cn } from '@/lib/cn';

export interface BrandMarkProps {
  className?: string;
}

/**
 * CleanCV's mark: a resume page, scanned and passed.
 *
 * The page is the CV, the teal line is the ATS scan, and the green badge is the
 * result. Colours are fixed rather than themed on purpose — the tile carries
 * its own background, so it reads the same on every design and in both light
 * and dark. The same shape is `src/app/icon.svg`, which the favicon and the
 * app icons are rendered from.
 */
export const BrandMark = ({ className }: BrandMarkProps) => (
  <svg aria-hidden="true" viewBox="0 0 64 64" fill="none" className={cn('shrink-0', className)}>
    <rect width="64" height="64" rx="16" fill="#4F46E5" />
    <rect x="17" y="10" width="30" height="40" rx="4" fill="#fff" />
    <rect x="22" y="17" width="12" height="4" rx="2" fill="#4F46E5" />
    <rect x="22" y="25" width="20" height="3" rx="1.5" fill="#C7D2FE" />
    <rect x="22" y="38" width="20" height="3" rx="1.5" fill="#C7D2FE" />
    <rect x="11" y="31" width="42" height="3.5" rx="1.75" fill="#2DD4BF" />
    <circle cx="48" cy="47" r="10" fill="#10B981" stroke="#fff" strokeWidth="3" />
    <path
      d="m43.5 47 3 3 5-6"
      stroke="#fff"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
