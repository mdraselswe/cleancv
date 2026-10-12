import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/*
 * The app's own scale names, told to the merger.
 *
 * `tailwind-merge` only knows Tailwind's built-in sizes. Given `text-ui-lg` it
 * could not tell a font size from a colour, treated the two as one group, and
 * dropped whichever came first — so a primary button's `text-primary-fg` was
 * discarded in favour of its size class and the label rendered in the page's
 * dark text colour on a blue background. Naming the sizes, radii and shadows
 * here is what keeps a size from erasing a colour.
 */
const merge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['ui-2xs', 'ui-xs', 'ui', 'ui-md', 'ui-lg'] }],
      rounded: [{ rounded: ['control', 'card', 'panel'] }],
      shadow: [{ shadow: ['app', 'pop', 'sheet'] }],
    },
  },
});

/** Conditional class names with later Tailwind utilities winning. */
export const cn = (...inputs: ClassValue[]): string => merge(clsx(inputs));
