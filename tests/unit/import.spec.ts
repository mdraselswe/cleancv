import { describe, expect, it } from 'vitest';

import { applyImport, foundGroups, isTwoColumn, parseHeuristically, toDocument } from '@/features/import';
import type { ExtractedDocument, TextLine } from '@/features/import';
import { createEmptyResume, createSampleResume } from '@/features/resume';
import { guessIcon } from '@/features/templates';

/**
 * The offline parser, driven by the same shape the extractors produce.
 *
 * Written as line geometry rather than a plain string because that is what the
 * parser actually reads: sizes tell it which line is the name, and vertical
 * gaps tell it where one job ends and the next begins.
 */

let cursor = 0;

const line = (text: string, size = 11, options: Partial<TextLine> = {}): TextLine => {
  cursor += size * 1.2;

  return { text, x: 50, y: cursor, page: 1, size, ...options };
};

/** A blank line, which is what the parser reads as an entry boundary. */
const gap = (amount = 30): null => {
  cursor += amount;

  return null;
};

const asDocument = (entries: Array<TextLine | null>): ExtractedDocument => {
  const lines = entries.filter((entry): entry is TextLine => entry !== null);

  return {
    kind: 'pdf',
    lines,
    text: lines.map((entry) => entry.text).join('\n'),
    pageCount: 1,
    empty: lines.length === 0,
  };
};

const sampleCv = () => {
  cursor = 0;

  return asDocument([
    line('MUHAMMAD RASEL', 22),
    line('Senior Software Engineer | Next.js Expert'),
    line('+8801781182143 · mdraselswe@gmail.com · Dhaka, Bangladesh'),
    line('linkedin.com/in/mdraselswe · github.com/mdraselswe'),
    gap(),
    line('PROFESSIONAL SUMMARY', 13),
    line('Senior Frontend Engineer with 8+ years of experience building web applications.'),
    line('WORK EXPERIENCE', 13),
    line('Senior Software Engineer'),
    line('Shikho Technologies Bangladesh Ltd', 11, { x: 300 }),
    line('12/2022 - Present'),
    line('• Spearheaded Bohubrihi development using Next.js, improving load speed by 40%.'),
    line('• Mentored 3+ junior engineers across two teams.'),
    gap(),
    line('Front End Engineer'),
    line('Grameen Digital Health'),
    line('Nov 2020 – Nov 2022'),
    line('• Migrated application state to the React Context API, reducing latency by 15%.'),
    line('EDUCATION', 13),
    line('BSc in Computer Science and Engineering'),
    line('Daffodil International University'),
    line('2014 - 2018'),
    line('CGPA 3.20 out of 4.00'),
    line('SKILLS', 13),
    line('Frontend: React.js, Next.js, TypeScript, Tailwind CSS'),
    line('Backend: Node.js, Express.js, PostgreSQL'),
    line('LANGUAGES', 13),
    line('Bengali (Native), English (Professional)'),
  ]);
};

describe('heuristic parser', () => {
  it('reads the name and headline from the top of the document', () => {
    const parsed = parseHeuristically(sampleCv());

    // Templates often style the name upper-case, and extraction returns what was
    // rendered — importing that verbatim would leave the new CV shouting.
    expect(parsed.basics?.fullName).toBe('Muhammad Rasel');
    expect(parsed.basics?.headline).toContain('Senior Software Engineer');
  });

  it('leaves a name that was not shouted alone', () => {
    cursor = 0;
    const parsed = parseHeuristically(
      asDocument([line("Aisha O'Brien-Rahman", 20), line('Product Designer')]),
    );

    expect(parsed.basics?.fullName).toBe("Aisha O'Brien-Rahman");
  });

  it('keeps the parts of a shouted compound name capitalised', () => {
    cursor = 0;
    const parsed = parseHeuristically(
      asDocument([line("AISHA O'BRIEN-RAHMAN", 20), line('Product Designer')]),
    );

    expect(parsed.basics?.fullName).toBe("Aisha O'Brien-Rahman");
  });

  it('picks contact details out of the header', () => {
    const { contact } = parseHeuristically(sampleCv());

    expect(contact?.email).toBe('mdraselswe@gmail.com');
    expect(contact?.phone).toContain('8801781182143');
    expect(contact?.linkedin).toContain('linkedin.com/in/mdraselswe');
    expect(contact?.github).toContain('github.com/mdraselswe');
  });

  it('finds the summary under its heading', () => {
    const parsed = parseHeuristically(sampleCv());

    expect(parsed.summary?.text).toContain('8+ years of experience');
    // The heading itself is not content.
    expect(parsed.summary?.text).not.toContain('PROFESSIONAL SUMMARY');
  });

  it('splits work experience into one entry per role', () => {
    const parsed = parseHeuristically(sampleCv());

    expect(parsed.experience).toHaveLength(2);
    expect(parsed.experience?.[0].role).toBe('Senior Software Engineer');
    expect(parsed.experience?.[0].company).toBe('Shikho Technologies Bangladesh Ltd');
  });

  it('keeps each role with its own bullets', () => {
    const parsed = parseHeuristically(sampleCv());

    expect(parsed.experience?.[0].bullets).toHaveLength(2);
    expect(parsed.experience?.[0].bullets[0]).toContain('Spearheaded Bohubrihi');
    // Stripped of its bullet glyph, which would otherwise print twice.
    expect(parsed.experience?.[0].bullets[0].startsWith('•')).toBe(false);
    expect(parsed.experience?.[1].bullets).toHaveLength(1);
  });

  it('reads both numeric and written date ranges', () => {
    const parsed = parseHeuristically(sampleCv());

    expect(parsed.experience?.[0].dates).toEqual({ start: '2022-12', end: '', current: true });
    expect(parsed.experience?.[1].dates).toEqual({
      start: '2020-11',
      end: '2022-11',
      current: false,
    });
  });

  it('reads education with its result', () => {
    const parsed = parseHeuristically(sampleCv());

    expect(parsed.education?.[0].degree).toContain('BSc in Computer Science');
    expect(parsed.education?.[0].institute).toBe('Daffodil International University');
    expect(parsed.education?.[0].result).toContain('CGPA 3.20');
  });

  it('keeps labelled skill groups as groups', () => {
    const parsed = parseHeuristically(sampleCv());

    expect(parsed.skills).toHaveLength(2);
    expect(parsed.skills?.[0].category).toBe('Frontend');
    expect(parsed.skills?.[0].items).toContain('Next.js');
  });

  it('maps a language proficiency onto the fixed list', () => {
    const parsed = parseHeuristically(sampleCv());

    expect(parsed.languages?.[0]).toMatchObject({ name: 'Bengali', level: 'native' });
    expect(parsed.languages?.[1]).toMatchObject({ name: 'English', level: 'professional' });
  });

  it('does not treat a sentence mentioning a section name as a heading', () => {
    cursor = 0;
    const parsed = parseHeuristically(
      asDocument([
        line('Jane Roe', 20),
        line('PROFESSIONAL SUMMARY', 13),
        line('I have deep experience in distributed systems, and education matters to me.'),
      ]),
    );

    expect(parsed.experience ?? []).toHaveLength(0);
    expect(parsed.summary?.text).toContain('distributed systems');
  });

  it('returns empty rather than guessing on an unrecognisable document', () => {
    cursor = 0;
    const parsed = parseHeuristically(asDocument([line('lorem ipsum dolor sit amet')]));

    expect(parsed.basics?.fullName).toBe('');
    expect(foundGroups(parsed)).not.toContain('experience');
  });
});

describe('applying an import', () => {
  const parsed = () => parseHeuristically(sampleCv());

  it('writes only the groups that were accepted', () => {
    const next = applyImport(createEmptyResume(), parsed(), {
      accepted: new Set(['basics']),
      strategy: 'replace',
    });

    expect(next.basics.fullName).toBe('Muhammad Rasel');
    expect(next.experience).toHaveLength(0);
  });

  it('leaves an existing value alone when the parse found nothing for it', () => {
    const resume = createEmptyResume();
    resume.contact.email = 'kept@example.com';

    const next = applyImport(
      resume,
      { contact: { email: '', phone: '+8801700000000' } },
      { accepted: new Set(['contact']), strategy: 'replace' },
    );

    expect(next.contact.email).toBe('kept@example.com');
    expect(next.contact.phone).toBe('+8801700000000');
  });

  it('appends to existing lists when asked to', () => {
    const resume = createSampleResume();
    const before = resume.experience.length;

    const next = applyImport(resume, parsed(), {
      accepted: new Set(['experience']),
      strategy: 'append',
    });

    expect(next.experience).toHaveLength(before + 2);
  });

  it('replaces existing lists when asked to', () => {
    const next = applyImport(createSampleResume(), parsed(), {
      accepted: new Set(['experience']),
      strategy: 'replace',
    });

    expect(next.experience).toHaveLength(2);
  });

  it('produces a resume the schema accepts', () => {
    const next = applyImport(createEmptyResume(), parsed(), {
      accepted: new Set(foundGroups(parsed())),
      strategy: 'replace',
    });

    // Every entry keeps a unique id, which normalisation is responsible for.
    const ids = next.experience.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(next.meta.sectionOrder.length).toBeGreaterThan(0);
  });
});

describe('reading order', () => {
  /** A rail on the left and the narrative on the right, as a designed CV does. */
  const twoColumn = (): TextLine[] => {
    const rail = ['SKILLS', 'React', 'Node.js', 'GraphQL', 'LANGUAGES', 'Bengali', 'English'].map(
      (text, index): TextLine => ({ text, x: 40, y: 100 + index * 14, page: 1, size: 11 }),
    );
    const main = [
      'WORK EXPERIENCE',
      'Senior Software Engineer',
      'Shikho Technologies',
      'Front End Engineer',
      'Grameen Digital Health',
      'EDUCATION',
      'Daffodil International University',
    ].map((text, index): TextLine => ({ text, x: 260, y: 100 + index * 14, page: 1, size: 11 }));

    return [...rail, ...main];
  };

  it('flags a two-column page so the reviewer is warned', () => {
    expect(isTwoColumn(twoColumn())).toBe(true);
  });

  it('keeps the source order rather than re-sorting by position', () => {
    /*
     * The source's own order is the reading order for any document whose markup
     * follows it. Re-sorting by vertical position would interleave this rail
     * with the narrative beside it — destroying an order that was correct.
     */
    const order = toDocument('pdf', twoColumn(), 1).lines.map((entry) => entry.text);

    expect(order.indexOf('English')).toBeLessThan(order.indexOf('WORK EXPERIENCE'));
    expect(order.indexOf('Senior Software Engineer')).toBeLessThan(
      order.indexOf('Front End Engineer'),
    );
  });

  it('keeps a dates-beside-entries layout in row order', () => {
    /*
     * The common designed-CV shape: a narrow strip of dates and places beside
     * each job. Reading the strip as its own column would detach every date
     * from the role it belongs to — the opposite of what a sidebar needs.
     */
    const meta: TextLine[] = [
      { text: 'WORK EXPERIENCE', x: 40, y: 80, page: 1, size: 13 },
      { text: '12/2022 - Present', x: 40, y: 100, page: 1, size: 10 },
      { text: 'Senior Software Engineer', x: 260, y: 100, page: 1, size: 11 },
      { text: 'Dhaka, Bangladesh', x: 40, y: 114, page: 1, size: 10 },
      { text: 'Shikho Technologies', x: 260, y: 114, page: 1, size: 11 },
      { text: '11/2020 - 11/2022', x: 40, y: 140, page: 1, size: 10 },
      { text: 'Front End Engineer', x: 260, y: 140, page: 1, size: 11 },
      { text: 'Dhaka, Bangladesh', x: 40, y: 154, page: 1, size: 10 },
      { text: 'Grameen Digital Health', x: 260, y: 154, page: 1, size: 11 },
    ];

    expect(isTwoColumn(meta)).toBe(false);

    const order = toDocument('pdf', meta, 1).lines.map((entry) => entry.text);
    expect(order.indexOf('Senior Software Engineer')).toBeLessThan(
      order.indexOf('11/2020 - 11/2022'),
    );

    const parsed = parseHeuristically(toDocument('pdf', meta, 1));
    expect(parsed.experience).toHaveLength(2);
    expect(parsed.experience?.[0].dates.current).toBe(true);
    expect(parsed.experience?.[1].dates.start).toBe('2020-11');
  });

  it('leaves a single-column document alone', () => {
    const lines: TextLine[] = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'].map(
      (text, index) => ({ text, x: 50, y: index * 14, page: 1, size: 11 }),
    );

    expect(isTwoColumn(lines)).toBe(false);
    expect(toDocument('pdf', lines, 1).lines.map((entry) => entry.text)).toEqual([
      'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight',
    ]);
  });
});

describe('icon guessing', () => {
  it('reads the common group names', () => {
    expect(guessIcon('Frontend')).toBe('monitor');
    expect(guessIcon('Backend')).toBe('database');
    // "State & API" is about data flow, so it must not land on the server glyph.
    expect(guessIcon('State & API')).toBe('chart');
    expect(guessIcon('AI')).toBe('brain');
    expect(guessIcon('Leadership')).toBe('diamond');
  });

  it('returns nothing rather than a wrong guess', () => {
    expect(guessIcon('Soft Skills')).toBeNull();
    expect(guessIcon('Military Service')).toBeNull();
  });
});

describe('designed two-column CVs', () => {
  /**
   * The shape most "designed" CV builders produce, and the one that used to
   * come in scrambled: dates and place in a narrow left column, the role and
   * employer beside them, bullets that wrap, and every bullet glyph emitted as
   * its own run at the end of the page rather than beside its text.
   */
  const designedCv = () =>
    asDocument([
      { text: 'MUHAMMAD RASEL', x: 31, y: 46, page: 1, size: 22 },
      { text: 'PROFESSIONAL EXPERIENCE', x: 31, y: 172, page: 1, size: 11 },

      { text: '12/2022 - Present', x: 31, y: 188, page: 1, size: 8 },
      { text: 'Banani, Dhaka Bangladesh', x: 31, y: 205, page: 1, size: 8 },
      { text: 'Senior Software Engineer', x: 179, y: 188, page: 1, size: 10 },
      { text: 'Shikho Technologies Bangladesh Ltd', x: 179, y: 202, page: 1, size: 9 },
      { text: 'A technology company focused on learning.', x: 179, y: 214, page: 1, size: 8 },
      { text: 'Spearheaded Bohubrihi development, achieving a 40%', x: 189, y: 226, page: 1, size: 8 },
      { text: 'improvement in site loading speed.', x: 189, y: 237, page: 1, size: 8 },
      { text: 'Mentored 3+ junior engineers through PR reviews.', x: 189, y: 247, page: 1, size: 8 },

      { text: '11/2020 - 11/2022', x: 31, y: 318, page: 1, size: 8 },
      { text: 'Bashundhara, Dhaka', x: 31, y: 334, page: 1, size: 8 },
      { text: 'Front End Engineer', x: 179, y: 318, page: 1, size: 10 },
      { text: 'Grameen Digital Health', x: 179, y: 331, page: 1, size: 9 },
      { text: 'Enhanced core web components across all platforms.', x: 189, y: 356, page: 1, size: 8 },

      // Emitted last, exactly as the reference document does.
      { text: '•', x: 181, y: 226, page: 1, size: 8 },
      { text: '•', x: 181, y: 247, page: 1, size: 8 },
      { text: '•', x: 181, y: 356, page: 1, size: 8 },
    ]);

  it('keeps each value in its own field instead of shifting them along', () => {
    const parsed = parseHeuristically(designedCv());

    expect(parsed.experience).toHaveLength(2);
    expect(parsed.experience?.[0]).toMatchObject({
      role: 'Senior Software Engineer',
      company: 'Shikho Technologies Bangladesh Ltd',
      location: 'Banani, Dhaka Bangladesh',
    });
    expect(parsed.experience?.[0].dates).toEqual({ start: '2022-12', end: '', current: true });
  });

  it('does not split one job into two because reading order crosses columns', () => {
    // The gap between a left-column line and the right-column line beside it is
    // negative; treating that as a paragraph break split every entry in half.
    const roles = parseHeuristically(designedCv()).experience?.map((entry) => entry.role);

    expect(roles).toEqual(['Senior Software Engineer', 'Front End Engineer']);
  });

  it('joins a wrapped bullet instead of counting each line as its own', () => {
    const parsed = parseHeuristically(designedCv());

    expect(parsed.experience?.[0].bullets).toEqual([
      'Spearheaded Bohubrihi development, achieving a 40% improvement in site loading speed.',
      'Mentored 3+ junior engineers through PR reviews.',
    ]);
  });

  it('reads skills written as a name above its list', () => {
    cursor = 0;
    const parsed = parseHeuristically(
      asDocument([
        line('TECHNICAL SKILLS', 15),
        // The group name is set larger than the list beneath it; that size
        // difference is the only thing separating the two.
        line('Frontend', 13),
        line('React.js, Next.js, TypeScript'),
        line('Tailwind CSS, Framer Motion'),
        line('Backend', 13),
        line('Node.js, Express.js, PostgreSQL'),
        line('Redis, Kafka'),
      ]),
    );

    expect(parsed.skills?.map((group) => `${group.category}=${group.items.length}`)).toEqual([
      'Frontend=5',
      'Backend=5',
    ]);
  });

  it('keeps a certificate together with its issuer and date', () => {
    cursor = 0;
    const parsed = parseHeuristically(
      asDocument([
        line('CERTIFICATIONS', 11),
        line('JavaScript Essential Training', 9),
        line('Lynda.com'),
        line('Issued Sep 2017'),
        line('CSS Essential Training 3', 9),
        line('Lynda.com'),
        line('Issued Oct 2017'),
      ]),
    );

    expect(parsed.certifications).toHaveLength(2);
    expect(parsed.certifications?.[0]).toMatchObject({
      name: 'JavaScript Essential Training',
      issuer: 'Lynda.com',
    });
    expect(parsed.certifications?.[0].issued).toContain('2017');
  });
});
