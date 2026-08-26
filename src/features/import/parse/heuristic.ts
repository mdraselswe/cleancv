import {
  LANGUAGE_LEVELS,
  PROFICIENCY_LEVELS,
  type LanguageLevel,
  type ProficiencyLevel,
  type SectionKey,
} from '@/constants';
import {
  createCertificationEntry,
  createEducationEntry,
  createExperienceEntry,
  createLanguageEntry,
  createProjectEntry,
  createSkillGroup,
  type Resume,
} from '@/features/resume';
import { ensureProtocol } from '@/lib/url';

import type { ExtractedDocument, ParsedResume, TextLine } from '../types';
import {
  EMAIL_PATTERN,
  PHONE_PATTERN,
  URL_PATTERN,
  findDateRange,
  isBulletLine,
  looksLikeName,
  softenShoutedName,
  splitLabelled,
  splitList,
  stripBullet,
} from './fields';
import { bodyTextSize, splitIntoSections, type DocumentSection } from '../headings';

/**
 * The offline parser.
 *
 * No network, no key, no cost — and no understanding either. It reads structure
 * (headings, date ranges, bullet glyphs, label-colon-list) and refuses to guess
 * beyond it. On a single-column CV that is most of the document; on a heavily
 * designed one it will miss things, which is what the review screen and the
 * smart provider are for.
 */

/** A blank line's worth of vertical space starts a new entry. */
const ENTRY_GAP_FACTOR = 1.6;

/** A left column has to be a column, not the indent in front of a bullet. */
const META_GAP_FACTOR = 3;

/** How far past the text column a line must start to read as indented. */
const INDENT_FACTOR = 0.4;

/**
 * And how far is too far. A bullet sits a few points in from its entry; a line
 * half the page across is something else — a right-aligned date, a second
 * column — and reading it as a bullet loses it entirely.
 */
const INDENT_MAX_FACTOR = 8;

/** A run holding only a marker glyph, which some PDFs emit on its own. */
const MARKER_ONLY = /^[\s•▪◦‣·*–—-]+$/;

const joinLines = (lines: TextLine[]): string =>
  lines
    .map((line) => line.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

const isDated = (line: TextLine): boolean => findDateRange(line.text) !== null;

/**
 * Where a section's columns begin.
 *
 * Designed CVs put dates and places in a narrow left column and the role,
 * employer and bullets in a wider one beside it. Read as a flat list those
 * interleave, and every field lands one slot out — the location becomes the
 * job title. Finding the columns is what keeps each value in its own field.
 *
 * The gap has to be a real corridor: an indented bullet sits a few points in,
 * a second column sits a third of the page away.
 */
interface SectionColumns {
  /** Where the narrow left column starts, when there is one. */
  metaX: number | null;
  /** Where the entry's own text starts. */
  contentX: number;
}

const columnsOf = (lines: TextLine[], bodySize: number): SectionColumns => {
  const starts = [...new Set(lines.map((line) => Math.round(line.x)))].sort((a, b) => a - b);
  if (starts.length === 0) return { metaX: null, contentX: 0 };

  let widest = 0;
  let at = 0;

  for (let index = 1; index < starts.length; index += 1) {
    const gap = starts[index] - starts[index - 1];
    if (gap > widest) {
      widest = gap;
      at = index;
    }
  }

  if (widest < bodySize * META_GAP_FACTOR) return { metaX: null, contentX: starts[0] };

  /*
   * Counted from the middle of the corridor, not from where the text column
   * starts: a line whose x is a fraction under that start would otherwise be
   * counted on the wrong side, and four lines split two-and-two became
   * three-and-one — enough to reject a real column.
   */
  const boundary = (starts[at - 1] + starts[at]) / 2;
  const left = lines.filter((line) => line.x < boundary).length;

  /*
   * The text column has to be the bigger one. Without this a single
   * right-aligned line — a date pushed to the margin, a company name set flush
   * right — reads as a column of its own, and every field shifts into it.
   */
  if (lines.length - left < left) return { metaX: null, contentX: starts[0] };

  return { metaX: starts[0], contentX: starts[at] };
};

/** One entry, with each line already sorted into the field it belongs to. */
interface EntryParts {
  /** Left-column lines: dates and where it happened. */
  meta: TextLine[];
  /** Text-column lines that are not indented: title, organisation, note. */
  head: TextLine[];
  bullets: string[];
  /**
   * How much of `head` was already accounted for when the entry last took a
   * bullet or a date. Anything after that is the *next* entry's title, read
   * before its own date arrived — see `splitEntries`.
   */
  headMark: number;
}

/**
 * The vertical positions of marker glyphs a PDF emitted on their own.
 *
 * The reference document writes every bullet's dot as a separate run, and
 * collects all of them at the *end of the page* — long after the text they
 * belong to. They are useless as text, but they say exactly which lines a
 * bullet starts on, which is what tells a wrapped second line apart from the
 * next bullet. Gathered once for the whole document precisely because their
 * position in the run order says nothing about which section they serve.
 */
export interface MarkerRow {
  page: number;
  y: number;
}

const markerRows = (lines: TextLine[]): MarkerRow[] =>
  lines
    .filter((line) => MARKER_ONLY.test(line.text))
    .map((line) => ({ page: line.page, y: line.y }));

const classify = (line: TextLine, columns: SectionColumns, bodySize: number) => {
  if (columns.metaX !== null && line.x < columns.contentX - bodySize) return 'meta' as const;

  /*
   * A bullet is recognised by its glyph *or* by its indent. Both are needed:
   * plenty of PDFs emit the marker as a separate run — the reference document
   * puts every one of them at the end of the page — which leaves the text
   * itself unmarked and, without the indent test, indistinguishable from a
   * heading line.
   */
  if (isBulletLine(line.text)) return 'bullet' as const;

  const indent = line.x - columns.contentX;
  if (indent > bodySize * INDENT_FACTOR && indent < bodySize * INDENT_MAX_FACTOR) {
    return 'bullet' as const;
  }

  return 'head' as const;
};

/**
 * The line spacing a section actually uses.
 *
 * Taken from the document rather than assumed, because "a blank line" is only
 * meaningful relative to the leading around it: this section sets its titles a
 * third larger than the body, so a fixed multiple of the body size reads normal
 * spacing as a paragraph break.
 */
const medianGap = (lines: TextLine[]): number => {
  const gaps: number[] = [];

  for (let index = 1; index < lines.length; index += 1) {
    const gap = lines[index].y - lines[index - 1].y;
    if (lines[index].page === lines[index - 1].page && gap > 0) gaps.push(gap);
  }

  if (gaps.length === 0) return 0;
  gaps.sort((a, b) => a - b);

  return gaps[Math.floor(gaps.length / 2)];
};

/**
 * Splits a section into entries, each with its lines already sorted by role.
 *
 * How an entry begins depends on how the section is laid out:
 *
 * - **With a left column**, the dates live there and every entry has one, so a
 *   new date in that column *is* the boundary and nothing else is consulted.
 *   Vertical gaps are worse than useless here: reading order crosses from one
 *   column back up to the other, so the gap between consecutive lines is
 *   routinely negative or large in the middle of a single entry.
 * - **Without one**, a date starts an entry only once the current entry has its
 *   own — otherwise "role, employer, dates" splits a single job in three — and
 *   a gap noticeably larger than the section's own line spacing also starts one.
 */
const splitEntries = (
  lines: TextLine[],
  bodySize: number,
  markers: MarkerRow[],
): EntryParts[] => {
  const usable = lines.filter((line) => !MARKER_ONLY.test(line.text));
  const columns = columnsOf(usable, bodySize);
  const paragraphGap = medianGap(usable) * ENTRY_GAP_FACTOR;
  const entries: EntryParts[] = [];

  /**
   * Whether a bullet line begins a new point or continues the one above.
   *
   * A long bullet wraps, and every wrapped line arrives as its own run at the
   * same indent — counted naively, one four-point list becomes eight. The
   * marker glyphs settle it when the PDF emitted them separately; otherwise an
   * inline glyph marks the start and anything else continues.
   */
  const startsBullet = (line: TextLine): boolean => {
    if (isBulletLine(line.text)) return true;
    if (markers.length === 0) return false;

    return markers.some(
      (marker) => marker.page === line.page && Math.abs(marker.y - line.y) <= bodySize * 0.6,
    );
  };

  usable.forEach((line, index) => {
    const kind = classify(line, columns, bodySize);
    const current = entries.at(-1);
    const previous = usable[index - 1];
    const gap = previous && line.page === previous.page ? line.y - previous.y : 0;

    const startsHere =
      !current ||
      (columns.metaX !== null
        ? kind === 'meta' && isDated(line) && current.meta.some(isDated)
        : (kind === 'head' && isDated(line) && current.meta.some(isDated)) ||
          (kind !== 'bullet' && paragraphGap > 0 && gap > paragraphGap && current.head.length > 0));

    /*
     * A tight single-column layout gives the next role's title and employer
     * before its dates, so those lines land on the entry being built. When the
     * date finally arrives they move across with it; without that they stay
     * behind and the new entry has nothing to name it.
     */
    const carried = startsHere && current ? current.head.splice(current.headMark) : [];
    const target = startsHere
      ? { meta: [], head: carried, bullets: [], headMark: carried.length }
      : current!;
    if (startsHere) entries.push(target);

    if (kind === 'bullet') {
      const text = stripBullet(line.text);
      const open = target.bullets.at(-1);

      if (startsBullet(line) || open === undefined) target.bullets.push(text);
      else target.bullets[target.bullets.length - 1] = `${open} ${text}`.trim();

      target.headMark = target.head.length;
    } else if (
      kind === 'meta' ||
      (columns.metaX === null && isDated(line) && target.head.length > 0)
    ) {
      target.meta.push(line);
      target.headMark = target.head.length;
    } else {
      target.head.push(line);
    }
  });

  /*
   * An entry needs something to name it. A stray dated line with no text beside
   * it is a page artefact, and letting it through produces a blank row in the
   * review screen that the reader has to work out and reject.
   */
  return entries.filter((entry) => entry.head.length > 0 || entry.bullets.length > 0);
};

/** The date range an entry carries, wherever it was written. */
const entryDates = (entry: EntryParts) => {
  const line = [...entry.meta, ...entry.head].find(isDated);

  return line ? findDateRange(line.text) : null;
};

/** Left-column text that is not the dates: the place. */
const entryPlace = (entry: EntryParts): string =>
  joinLines(entry.meta.filter((line) => !isDated(line)));

/** Head lines with any date range stripped out, blanks dropped. */
const headTexts = (entry: EntryParts): string[] => {
  const dates = entryDates(entry);

  return entry.head
    .map((line) => (dates ? line.text.replace(dates.matched, '') : line.text))
    .map((text) => text.replace(/^[\s•|,–—-]+|[\s•|,–—-]+$/g, '').trim())
    .filter((text) => text.length > 1);
};

const parseExperience = (section: DocumentSection, ctx: ParseContext): Resume['experience'] =>
  splitEntries(section.lines, ctx.bodySize, ctx.markers).map((entry) => {
    const dates = entryDates(entry);
    const texts = headTexts(entry);

    return {
      ...createExperienceEntry(),
      role: texts[0] ?? '',
      company: texts[1] ?? '',
      location: entryPlace(entry),
      // Whatever follows the employer is the one-line description of it.
      companyNote: texts[2] ?? '',
      dates: dates
        ? { start: dates.start, end: dates.end, current: dates.current }
        : { start: '', end: '', current: false },
      bullets: entry.bullets.length > 0 ? entry.bullets : texts.slice(3),
    };
  });

/**
 * Words that mark a line as the grade rather than the school.
 *
 * A word list rather than a regex with a word boundary: written as a string,
 * a `\b` escape becomes an actual backspace character and the pattern then
 * matches nothing at all, silently.
 */
const RESULT_WORDS = ['cgpa', 'gpa', 'grade', 'division', 'class', '%'];

const looksLikeResult = (text: string): boolean => {
  const value = text.toLowerCase();

  return RESULT_WORDS.some((word) => value.includes(word));
};

/**
 * An entry has to name something. A design that stands the place and the dates
 * in a right margin can wrap one over two lines, and the second of them sits on
 * a row of its own below the head — which reads as the start of another entry
 * and produces a degree with no degree in it. Better a detail lost than a row
 * the reader has to delete.
 */
const isNamed = (entry: { degree?: string; institute?: string }): boolean =>
  Boolean(entry.degree || entry.institute);

const parseEducation = (section: DocumentSection, ctx: ParseContext): Resume['education'] =>
  splitEntries(section.lines, ctx.bodySize, ctx.markers)
    .map((entry) => {
      const dates = entryDates(entry);
      const texts = headTexts(entry);
      const result = texts.find(looksLikeResult) ?? '';

      return {
        ...createEducationEntry(),
        degree: texts[0] ?? '',
        institute: texts.find((text) => text !== texts[0] && text !== result) ?? '',
        location: entryPlace(entry),
        dates: dates
          ? { start: dates.start, end: dates.end, current: dates.current }
          : { start: '', end: '', current: false },
        result,
        bullets: entry.bullets,
      };
    })
    .filter(isNamed);

/**
 * Pulls a trailing proficiency off a group name: `Frontend — Expert`.
 *
 * Templates that show a level print it beside the category, so without this an
 * import of such a CV — including one this app produced — ends up with a group
 * literally named "Frontend — Expert".
 */
const splitProficiency = (category: string): [string, ProficiencyLevel | ''] => {
  const match = /^(.*?)\s*[—–|-]\s*([A-Za-z]+)$/.exec(category.trim());
  if (!match) return [category.trim(), ''];

  const level = PROFICIENCY_LEVELS.find((entry) => entry === match[2].toLowerCase());

  return level ? [match[1].trim(), level] : [category.trim(), ''];
};

/**
 * Skills, in whichever of the three common shapes the CV used: labelled groups,
 * a group name on its own line above its items, or one flat list.
 */
const parseSkills = (section: DocumentSection, ctx: ParseContext): Resume['skills'] => {
  const lines = section.lines.filter((line) => !MARKER_ONLY.test(line.text));

  const labelled = lines
    .map((line) => splitLabelled(stripBullet(line.text)))
    .filter((entry): entry is [string, string] => entry !== null);

  if (labelled.length > 0) {
    return labelled.map(([rawCategory, items]) => {
      const [category, level] = splitProficiency(rawCategory);

      return { ...createSkillGroup(category), level, items: splitList(items) };
    });
  }

  /*
   * "Frontend" on one line, its items on the next. The group name is set larger
   * than the list under it, which is the only thing separating the two — the
   * text alone gives nothing away.
   */
  const headed: Resume['skills'] = [];
  for (const line of lines) {
    const text = stripBullet(line.text);
    const isHeading = line.size > ctx.bodySize && text.length <= 40 && !text.includes(',');

    if (isHeading) {
      const [category, level] = splitProficiency(text);
      headed.push({ ...createSkillGroup(category), level, items: [] });
      continue;
    }

    const current = headed.at(-1);
    if (current) current.items.push(...splitList(text));
  }

  const named = headed.filter((group) => group.items.length > 0);
  if (named.length > 0) return named;

  const items = lines.flatMap((line) => splitList(stripBullet(line.text)));

  return items.length > 0 ? [{ ...createSkillGroup(), items }] : [];
};

const parseProjects = (section: DocumentSection, ctx: ParseContext): Resume['projects'] =>
  splitEntries(section.lines, ctx.bodySize, ctx.markers).map((entry) => {
    const dates = entryDates(entry);
    const urls: string[] = [];
    const texts = headTexts(entry).filter((text) => {
      const url = URL_PATTERN.exec(text)?.[0];
      if (url) urls.push(url);

      // A line that is only a link belongs in the link fields, not the title.
      return text.replace(url ?? '', '').replace(/^(live|source code|code|demo|repo)\s*link?\s*:?/i, '').trim().length > 1;
    });

    return {
      ...createProjectEntry(),
      name: texts[0] ?? '',
      subtitle: texts[1] ?? '',
      liveUrl: urls[0] ? ensureProtocol(urls[0]) : '',
      sourceUrl: urls[1] ? ensureProtocol(urls[1]) : '',
      dates: dates
        ? { start: dates.start, end: dates.end, current: dates.current }
        : { start: '', end: '', current: false },
      bullets: entry.bullets.length > 0 ? entry.bullets : texts.slice(2),
    };
  });

/**
 * `Issued Sep 2017`, `Expires 2020`, or a bare month.
 *
 * A word list compared against a lower-cased string, deliberately not a
 * regex: the literal this replaced carried a stray control character from a
 * shell edit, so it silently never matched and every "Issued ..." line became
 * a certificate of its own.
 */
const ISSUED_WORDS = ['issued', 'expires', 'valid', 'awarded'];

const startsWithIssued = (text: string): boolean => {
  const value = text.trim().toLowerCase();

  return ISSUED_WORDS.some((word) => value.startsWith(word));
};

/**
 * Certifications, which arrive as a run of short lines rather than as dated
 * entries: a name, the body that issued it, and when.
 *
 * Grouped by what each line *is* rather than by spacing, because these are set
 * two-up as often as in a list and a column grid interleaves the two. A line
 * saying when belongs to the certificate above it; so does the first short line
 * after a name. Anything else starts a new one.
 */
const parseCertifications = (section: DocumentSection): Resume['certifications'] => {
  const entries: Resume['certifications'] = [];

  for (const line of section.lines) {
    const text = stripBullet(line.text).trim();
    if (text.length < 3) continue;

    const current = entries.at(-1);
    const dated = startsWithIssued(text) || findDateRange(text) !== null;

    if (current && dated) {
      current.issued = text.replace(/^\w+\s+/, '').trim() || text;
      continue;
    }

    if (current && !current.issuer && text.length <= 60 && !current.issued) {
      current.issuer = text;
      continue;
    }

    entries.push({ ...createCertificationEntry(), name: text });
  }

  return entries;
};

/** Free text like "Bengali (Native)" onto the fixed proficiency list, or ''. */
const toLanguageLevel = (raw: string): LanguageLevel | '' => {
  const value = raw.trim().toLowerCase();

  return LANGUAGE_LEVELS.find((level) => value.startsWith(level)) ?? '';
};

const parseLanguages = (section: DocumentSection): Resume['languages'] =>
  section.lines
    .flatMap((line) => splitList(stripBullet(line.text)))
    .filter((text) => text.length > 1)
    .map((text) => {
      const labelled = splitLabelled(text);
      const bracketed = /^(.+?)\s*[([](.+)[)\]]$/.exec(text);

      return {
        ...createLanguageEntry(),
        name: (labelled?.[0] ?? bracketed?.[1] ?? text).trim(),
        level: toLanguageLevel(labelled?.[1] ?? bracketed?.[2] ?? ''),
      };
    });

/**
 * Name, headline and every contact detail above the first heading.
 *
 * `rest` is everything below it, and is read only for the details the header
 * did not give up. A one-column CV puts them all at the top and never touches
 * it; a design that stands its contact details in a side panel under their own
 * heading puts them below the *other* column's first heading, and the header
 * window then holds a name and nothing else. Losing an email to that is worse
 * than reading one from further down, which is what a real parser does anyway.
 */
const parseHeader = (
  lines: TextLine[],
  rest: TextLine[] = [],
): Pick<ParsedResume, 'basics' | 'contact'> => {
  const joined = lines.map((line) => line.text).join(' \n ');
  const everything = [...lines, ...rest].map((line) => line.text).join(' \n ');
  const largest = Math.max(0, ...lines.map((line) => line.size));

  // The name is normally the biggest text on the page; fall back to the first
  // line that reads like a name at all.
  const nameLine =
    lines.find((line) => line.size === largest && looksLikeName(line.text)) ??
    lines.find((line) => looksLikeName(line.text));

  const nameIndex = nameLine ? lines.indexOf(nameLine) : -1;
  const headline = lines
    .slice(nameIndex + 1)
    .find(
      (line) =>
        line.text.length > 3 &&
        line.text.length < 90 &&
        !EMAIL_PATTERN.test(line.text) &&
        !PHONE_PATTERN.test(line.text) &&
        !URL_PATTERN.test(line.text),
    );

  const urls =
    joined.match(new RegExp(URL_PATTERN, 'gi')) ??
    everything.match(new RegExp(URL_PATTERN, 'gi')) ??
    [];
  const pick = (host: string) => {
    const found = urls.find((url) => url.toLowerCase().includes(host));

    return found ? ensureProtocol(found) : '';
  };

  const linkedin = pick('linkedin.');
  const github = pick('github.');
  const portfolio = urls
    .map((url) => ensureProtocol(url))
    .find((url) => url !== linkedin && url !== github && !/@/.test(url));

  return {
    basics: {
      fullName: softenShoutedName(nameLine?.text.trim() ?? ''),
      headline: headline?.text.trim() ?? '',
    },
    contact: {
      email: (EMAIL_PATTERN.exec(joined) ?? EMAIL_PATTERN.exec(everything))?.[0] ?? '',
      phone: (PHONE_PATTERN.exec(joined) ?? PHONE_PATTERN.exec(everything))?.[0]?.trim() ?? '',
      linkedin,
      github,
      portfolio: portfolio ?? '',
    },
  };
};

/** What every section parser needs beyond its own lines. */
interface ParseContext {
  bodySize: number;
  markers: MarkerRow[];
}

const SECTION_PARSERS: Partial<
  Record<SectionKey, (section: DocumentSection, ctx: ParseContext) => Partial<ParsedResume>>
> = {
  summary: (section) => ({ summary: { text: joinLines(section.lines) } }),
  experience: (section, ctx) => ({ experience: parseExperience(section, ctx) }),
  education: (section, ctx) => ({ education: parseEducation(section, ctx) }),
  skills: (section, ctx) => ({ skills: parseSkills(section, ctx) }),
  projects: (section, ctx) => ({ projects: parseProjects(section, ctx) }),
  certifications: (section) => ({ certifications: parseCertifications(section) }),
  languages: (section) => ({ languages: parseLanguages(section) }),
};

export const parseHeuristically = (document: ExtractedDocument): ParsedResume => {
  /*
   * Marker glyphs are gathered before the document is cut into sections, and
   * dropped from the text: a PDF that emits them separately puts them wherever
   * it likes in the run order, which is usually the end of a page and therefore
   * the wrong section entirely.
   */
  const markers = markerRows(document.lines);
  const content = document.lines.filter((line) => !MARKER_ONLY.test(line.text));

  const { header, sections } = splitIntoSections(content);
  const ctx: ParseContext = { bodySize: bodyTextSize(content), markers };

  /*
   * Everything below the header, so a contact detail the design put in a column
   * of its own is still found. Only consulted where the header came up empty.
   */
  const belowHeader = sections.flatMap((section) => section.lines);
  let parsed: ParsedResume = parseHeader(header, belowHeader);

  for (const section of sections) {
    const parser = SECTION_PARSERS[section.key];
    if (!parser) continue;

    // A CV can repeat a heading across pages; merge rather than overwrite.
    const produced = parser(section, ctx);

    for (const [key, value] of Object.entries(produced)) {
      const existing = parsed[key as keyof ParsedResume];

      parsed = {
        ...parsed,
        [key]:
          Array.isArray(existing) && Array.isArray(value) ? [...existing, ...value] : value,
      };
    }
  }

  return parsed;
};
