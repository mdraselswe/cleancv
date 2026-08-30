import { cn } from '@/lib/cn';

export interface BrandMarkProps {
  className?: string;
}

/** CleanCV's document-and-check mark, shared by the product chrome and favicon. */
export const BrandMark = ({ className }: BrandMarkProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 64 64"
    fill="none"
    className={cn('shrink-0', className)}
  >
    <rect width="64" height="64" rx="16" fill="#4F46E5" />
    <path
      d="M19 13h19l9 9v27a4 4 0 0 1-4 4H19a4 4 0 0 1-4-4V17a4 4 0 0 1 4-4Z"
      fill="#fff"
    />
    <path d="M38 13v9h9" fill="#C7D2FE" />
    <path d="M38 13v9h9" stroke="#4F46E5" strokeWidth="2.5" strokeLinejoin="round" />
    <path
      d="m23 36 6 6 13-14"
      stroke="#4F46E5"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
