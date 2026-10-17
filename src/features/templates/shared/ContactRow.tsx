import type { ReactNode } from 'react';

import type { Resume } from '@/features/resume';
import { isBlank } from '@/lib/text';
import { displayUrl, ensureProtocol, mailtoHref, telHref } from '@/lib/url';

import {
  GithubIcon,
  GlobeIcon,
  LinkIcon,
  LinkedInIcon,
  MailIcon,
  PhoneIcon,
  PinIcon,
} from './Icons';

interface ContactItem {
  key: string;
  icon: ReactNode;
  text: string;
  href?: string;
}

const buildItems = (
  contact: Resume['contact'],
  fullUrls: boolean,
  locationLast: boolean,
  locationFirst: boolean,
): ContactItem[] => {
  const label = (url: string) => (fullUrls ? ensureProtocol(url) : displayUrl(url));
  const items: ContactItem[] = [];
  const placed: ContactItem | null = isBlank(contact.location)
    ? null
    : { key: 'location', icon: <PinIcon />, text: contact.location };

  if (placed && locationFirst) items.push(placed);

  if (!isBlank(contact.phone)) {
    items.push({
      key: 'phone',
      icon: <PhoneIcon />,
      text: contact.phone,
      href: telHref(contact.phone),
    });
  }
  if (!isBlank(contact.email)) {
    items.push({
      key: 'email',
      icon: <MailIcon />,
      text: contact.email,
      href: mailtoHref(contact.email),
    });
  }
  const location = locationFirst ? null : placed;

  if (location && !locationLast) items.push(location);
  if (!isBlank(contact.linkedin)) {
    items.push({
      key: 'linkedin',
      icon: <LinkedInIcon />,
      text: label(contact.linkedin),
      href: ensureProtocol(contact.linkedin),
    });
  }
  if (!isBlank(contact.github)) {
    items.push({
      key: 'github',
      icon: <GithubIcon />,
      text: label(contact.github),
      href: ensureProtocol(contact.github),
    });
  }
  if (!isBlank(contact.portfolio)) {
    items.push({
      key: 'portfolio',
      icon: <GlobeIcon />,
      text: label(contact.portfolio),
      href: ensureProtocol(contact.portfolio),
    });
  }

  if (location && locationLast) items.push(location);

  contact.links.forEach((link) => {
    if (isBlank(link.url)) return;
    items.push({
      key: link.id,
      icon: <LinkIcon />,
      text: isBlank(link.label) ? label(link.url) : link.label,
      href: ensureProtocol(link.url),
    });
  });

  return items;
};

export interface ContactRowProps {
  contact: Resume['contact'];
  className?: string;
  /** Hides the SVG glyphs; the plain ATS design prints text only. */
  withIcons?: boolean;
  /**
   * Prints links as their full `https://…` form rather than a trimmed one.
   * The reference layout shows the whole address, and a recruiter reading a
   * printed page cannot expand a shortened one.
   */
  fullUrls?: boolean;
  /**
   * Printed between items, as a real text node.
   *
   * Designs without icons need something to separate one detail from the next,
   * and a CSS `::after` would not reach the text layer — the phone number and
   * the email would extract fused into one token.
   */
  separator?: string;
  /**
   * Moves the location behind the links rather than keeping it beside the email.
   *
   * A content decision, so it changes the order the line is *read* in, not just
   * the order it is drawn in — a centred one-line header ends better on a city
   * than on a repository address. See ADR-004.
   */
  locationLast?: boolean;
  /** Leads the line with the location, as "City, Country · phone · email". Reading order, so markup. */
  locationFirst?: boolean;
}

/**
 * The contact line under the name.
 *
 * Each item is `icon + text` where the icon is inline SVG — an icon font would
 * put a Private Use Area codepoint immediately before the phone number in the
 * extracted text, which is what breaks parsing on most "designed" PDFs.
 */
export const ContactRow = ({
  contact,
  className,
  withIcons = true,
  fullUrls = false,
  separator,
  locationLast = false,
  locationFirst = false,
}: ContactRowProps) => {
  const items = buildItems(contact, fullUrls, locationLast, locationFirst);
  if (items.length === 0) return null;

  return (
    <div className={`rz-contact ${className ?? ''}`.trim()}>
      {items.map((item, index) => (
        <span key={item.key} className="rz-contact__item">
          {withIcons ? item.icon : null}
          {item.href ? <a href={item.href}>{item.text}</a> : <span>{item.text}</span>}
          {separator && index < items.length - 1 ? (
            <span className="rz-contact__sep">{separator}</span>
          ) : null}
        </span>
      ))}
    </div>
  );
};
