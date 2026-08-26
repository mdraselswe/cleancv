/**
 * A band of colour down the left of the paper, for a design that declares one.
 *
 * The shape and the one way of painting it live here, in the layer both sides
 * can reach: the preview paints it on each sheet and the PDF renderer on the
 * page canvas, and a design that came out with two different bands would be a
 * preview that lies. Resolving *whether* a design has one needs a template, so
 * that part stays in `features/templates`. See ADR-036.
 */

export interface PageBleed {
  /** Hex, from the theme — the resume schema constrains it to one. */
  color: string;
  /** Measured from the paper's left edge. */
  width: string;
}

/** The band as a background, for the page area a background can reach. */
export const pageBleedBackground = ({ color, width }: PageBleed): string =>
  `linear-gradient(to right, ${color} 0 ${width}, #ffffff ${width})`;
