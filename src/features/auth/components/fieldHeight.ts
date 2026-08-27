/**
 * How tall a control is on the sign-in pages.
 *
 * Taller than the editor's `h-9`, and deliberately so. The editor's fields sit
 * in a dense form somebody works through with a mouse beside a live preview;
 * these four are typed on a phone, once, by somebody who has been sent here
 * from a button they pressed — and a 36px box is under the 44px a thumb needs.
 *
 * Applied as a class rather than by changing `Input`, because changing the
 * primitive would move every row of the editor to fix four fields here.
 */
export const AUTH_FIELD_CLASS = 'h-11';
