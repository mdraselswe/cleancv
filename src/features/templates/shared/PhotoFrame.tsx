import type { PhotoFrame as Frame } from '@/features/resume';

export interface PhotoFrameProps {
  src: string;
  /** How the image sits inside the frame. */
  frame: Frame;
  /** The template's own class, carrying the frame's size, shape and spacing. */
  className: string;
}

/**
 * The photo, framed.
 *
 * A wrapper around the image rather than a bare `<img>`, because zoom needs
 * something to clip against: `transform: scale()` on an image overflows its own
 * box, and only an ancestor with `overflow: hidden` cuts it back to the frame.
 * The template's class stays on the wrapper, so every design keeps deciding the
 * size and the shape and none of them has to know about framing. See ADR-025.
 *
 * The image itself is never altered. `object-position` chooses which point the
 * frame centres on and `transform-origin` magnifies about that same point, so
 * what the reader picked stays put as they zoom.
 */
export const PhotoFrame = ({ src, frame, className }: PhotoFrameProps) => (
  <span className={`rz-photo ${className}`}>
    {/* A data URL of unknown dimensions; next/image would add nothing. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src={src}
      alt=""
      className="rz-photo__img"
      style={{
        objectPosition: `${frame.x}% ${frame.y}%`,
        transform: `scale(${frame.zoom})`,
        transformOrigin: `${frame.x}% ${frame.y}%`,
      }}
    />
  </span>
);
