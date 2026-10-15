/**
 * English for the Bangla strings the generator cannot pair on its own.
 *
 * `dictionary.ts` is built by comparing each file with the English it
 * replaced. That works where the two have the same shape; it cannot where
 * Bangla gained a label table of its own, or where a sentence needs a plural.
 * Those are written here.
 *
 * `{{n:one|many}}` in a replacement picks the singular when capture `n` is 1.
 */

const SECTION_LABELS: Record<string, string> = {
  'ব্যক্তিগত তথ্য': 'Personal Information',
  প্রোফাইল: 'Profile',
  'সংক্ষিপ্ত পরিচিতি': 'Professional Summary',
  'কাজের অভিজ্ঞতা': 'Work Experience',
  শিক্ষা: 'Education',
  দক্ষতা: 'Skills',
  প্রজেক্ট: 'Projects',
  সার্টিফিকেশন: 'Certifications',
  'প্রধান অর্জন': 'Key Achievements',
  'পুরস্কার ও সম্মাননা': 'Awards & Honors',
  প্রকাশনা: 'Publications',
  'প্রশিক্ষণ ও ওয়ার্কশপ': 'Training & Workshops',
  ভাষা: 'Languages',
  স্বেচ্ছাসেবা: 'Volunteering',
  'সহশিক্ষা ও নেতৃত্ব': 'Extracurricular & Leadership',
  'পেশাগত সদস্যপদ': 'Professional Memberships',
  'সম্মেলন ও বক্তব্য': 'Conferences & Talks',
  পেটেন্ট: 'Patents',
  'আগ্রহ ও শখ': 'Interests & Hobbies',
  রেফারেন্স: 'References',
  ঘোষণা: 'Declaration',
  সই: 'Signature',
  সেকশন: 'Sections',
  অভিজ্ঞতা: 'Experience',
};

const OPTION_LABELS: Record<string, string> = {
  'ফুল-টাইম': 'Full-time',
  'পার্ট-টাইম': 'Part-time',
  চুক্তিভিত্তিক: 'Contract',
  ফ্রিল্যান্স: 'Freelance',
  ইন্টার্নশিপ: 'Internship',
  রিমোট: 'Remote',
  মাতৃভাষা: 'Native',
  সাবলীল: 'Fluent',
  'পেশাগত কাজ চালানোর মতো': 'Professional working',
  'কথোপকথনের মতো': 'Conversational',
  প্রাথমিক: 'Basic',
  শিক্ষানবিস: 'Beginner',
  মাঝারি: 'Intermediate',
  উন্নত: 'Advanced',
  বিশেষজ্ঞ: 'Expert',
  অবিবাহিত: 'Single',
  বিবাহিত: 'Married',
  বিবাহবিচ্ছিন্ন: 'Divorced',
  'স্বামী/স্ত্রী মৃত': 'Widowed',
  'পেশাগত সংক্ষিপ্ত পরিচিতি': 'Professional Summary',
  'ক্যারিয়ারের লক্ষ্য': 'Career Objective',
  'রেফারি তালিকা করুন': 'List referees',
  'চাইলে দেওয়া হবে': 'Available upon request',
  'টাইপ করা': 'Typed',
  'ছবি আপলোড': 'Upload image',
  'দেওয়া নেই': 'Not specified',
  'দেখানো হবে না': 'Not shown',
};

/** What one entry is called, for "Untitled role" and "Actions for role 1". */
const NOUNS: Array<[string, string]> = [
  ['পদ', 'role'],
  ['শিক্ষাগত যোগ্যতা', 'qualification'],
  ['দক্ষতার গ্রুপ', 'skill group'],
  ['প্রজেক্ট', 'project'],
  ['সার্টিফিকেশন', 'certification'],
  ['অর্জন', 'achievement'],
  ['পুরস্কার', 'award'],
  ['প্রশিক্ষণ', 'training'],
  ['প্রকাশনা', 'publication'],
  ['বক্তব্য', 'talk'],
  ['পেটেন্ট', 'patent'],
  ['সদস্যপদ', 'membership'],
  ['স্বেচ্ছাসেবা', 'volunteering'],
  ['কার্যক্রম', 'activity'],
  ['ভাষা', 'language'],
];

const NOUN_EXACT: Record<string, string> = Object.fromEntries(
  NOUNS.map(([bn, en]) => [`নামহীন ${bn}`, `Untitled ${en}`]),
);

const NOUN_ADD: Record<string, string> = Object.fromEntries(
  NOUNS.map(([bn, en]) => [`${bn} যোগ করুন`, `Add ${en}`]),
);

export const MANUAL_EXACT: Record<string, string> = {
  ...SECTION_LABELS,
  ...OPTION_LABELS,
  ...NOUN_EXACT,
  ...NOUN_ADD,
  'ডকুমেন্টে ফোন নম্বর নেই।': 'No phone on the document.',
  'ডকুমেন্টে ইমেইল নেই।': 'No email on the document.',
  'ডকুমেন্টে ফোন নম্বর ও ইমেইল নেই।': 'No phone or email on the document.',
  '১০০% ফ্রি': '100% free',
  'আপনার CV': 'Your CV',
  'ATS স্কোর': 'ATS score',
  সেভ: 'Save',
  'বাতিল': 'Cancel',
  'ডাউনলোড': 'Download',
  'নতুন CV': 'New CV',
  'আমার CV': 'My CVs',
  সিঙ্ক: 'Sync',
  'ঠিক করুন': 'Fix it',
  'শুধু এই ডিভাইসে': 'This device only',
  'সরানোর জন্য একটি আইটেম তুলতে স্পেস বার চাপুন। টানার সময় তীর কী দিয়ে আইটেমটি সরান। আবার স্পেস বার চাপলে আইটেমটি নতুন জায়গায় বসবে, আর Esc চাপলে সরানো বাতিল হবে।':
    'To pick up a draggable item, press the space bar. While dragging, use the arrow keys to move the item. Press space again to drop it in its new position, or press escape to cancel.',
  'সরানোর জন্য একটি বাক্স তুলতে স্পেস বার চাপুন। টানার সময় তীর কী দিয়ে বাক্সটি সরান। আবার স্পেস বার চাপলে বাক্সটি নতুন জায়গায় বসবে, আর Esc চাপলে সরানো বাতিল হবে।':
    'To pick up a draggable box, press the space bar. While dragging, use the arrow keys to move the box. Press space again to drop it in its new position, or press escape to cancel.',
  'বিজ্ঞপ্তি': 'Notifications',
  'পেজটি পাওয়া যায়নি': 'Page not found',
  'সাইন-ইন': 'Sign in',
  'অ্যাকাউন্ট খুলুন': 'Create an account',
  'গোপনীয়তা নীতি': 'Privacy Policy',
  'ব্যবহারের শর্তাবলি': 'Terms of Service',
  'পাসওয়ার্ড রিসেট করুন': 'Reset your password',
  'নতুন পাসওয়ার্ড বেছে নিন': 'Choose a new password',
  'ইমেইল নিশ্চিত হয়েছে': 'Email confirmed',
  'এডিটর': 'Editor',
  'কী কী আছে': 'What’s included',
  'ব্যাকআপ ফাইল ফিরিয়ে আনুন': 'Restore a backup file',
  এখন: 'just now',
  গতকাল: 'yesterday',
  আজ: 'today',
  আগামীকাল: 'tomorrow',
  জানুয়ারি: 'January',
  ফেব্রুয়ারি: 'February',
  মার্চ: 'March',
  এপ্রিল: 'April',
  মে: 'May',
  জুন: 'June',
  জুলাই: 'July',
  আগস্ট: 'August',
  সেপ্টেম্বর: 'September',
  অক্টোবর: 'October',
  নভেম্বর: 'November',
  ডিসেম্বর: 'December',
};

const UNITS: Array<[string, string, string]> = [
  ['সেকেন্ড', 'second', 'seconds'],
  ['মিনিট', 'minute', 'minutes'],
  ['ঘণ্টা', 'hour', 'hours'],
  ['দিন', 'day', 'days'],
  ['সপ্তাহ', 'week', 'weeks'],
  ['মাস', 'month', 'months'],
  ['বছর', 'year', 'years'],
];

const MONTHS: Array<[string, string]> = [
  ['জানুয়ারি', 'January'],
  ['ফেব্রুয়ারি', 'February'],
  ['মার্চ', 'March'],
  ['এপ্রিল', 'April'],
  ['মে', 'May'],
  ['জুন', 'June'],
  ['জুলাই', 'July'],
  ['আগস্ট', 'August'],
  ['সেপ্টেম্বর', 'September'],
  ['অক্টোবর', 'October'],
  ['নভেম্বর', 'November'],
  ['ডিসেম্বর', 'December'],
];

/** [regex source over the Bangla text, English replacement]. First match wins. */
export const MANUAL_TEMPLATES: Array<[string, string]> = [
  ...UNITS.flatMap(([bn, one, many]): Array<[string, string]> => [
    [`([\\s\\S]+?) ${bn} (?:আগে|পূর্বে)`, `$1 {{1:${one}|${many}}} ago`],
    [`([\\s\\S]+?) ${bn} পরে`, `in $1 {{1:${one}|${many}}}`],
  ]),
  ...MONTHS.map(([bn, en]): [string, string] => [`([\\s\\S]+?) ${bn},? ([\\s\\S]+?)`, `$1 ${en} $2`]),
  ['([\\s\\S]+?)-এ ফিরে যান', 'Back to $1'],
  ['([\\s\\S]+?) — CleanCV', '$1 — CleanCV'],
  ['বিজ্ঞপ্তি ([\\s\\S]+)', 'Notifications $1'],
  ['পরামর্শ: ([\\s\\S]+)', 'Suggestions: $1'],
  ['([\\s\\S]+?)-এর শিরোনাম', 'Heading for $1'],
  ['([\\s\\S]+?) entries', '$1 entries'],
  ['([\\s\\S]+?) ([\\d\u09E6-\u09EF]+)', '$1 $2'],
  ['· ([\\s\\S]+)', '· $1'],
  ['বন্ধ করুন: ([\\s\\S]+)', 'Close $1'],
  ['([\\s\\S]+?)টি বিষয় ঠিক করা দরকার, সবচেয়ে জরুরিগুলো আগে।', '$1 {{1:check|checks}} to look at, worst first.'],
  ['([\\s\\S]+?)টি পদ যোগ করা আছে।', '$1 {{1:role|roles}} listed.'],
  ['([\\s\\S]+?)টি এন্ট্রিতে শুরুর তারিখ নেই।', '$1 {{1:entry is|entries are}} missing a start date.'],
  ['([\\s\\S]+?)টি প্রোফাইল লিংক দেওয়া আছে।', '$1 profile {{1:link|links}} included.'],
  ['([\\s\\S]+?)টি এন্ট্রি শুরু হওয়ার আগেই শেষ হয়েছে।', '$1 {{1:entry ends|entries end}} before they start.'],
  ['প্রায় ([\\s\\S]+?) পেজ — স্বাভাবিক সীমার ভেতরে।', 'About $1 {{1:page|pages}} — within the usual limit.'],
  ['প্রায় ([\\s\\S]+?) পেজ।', 'About $1 pages.'],
  ['([\\s\\S]+?)টি পদে কোনো বুলেট নেই।', '$1 {{1:role has|roles have}} no bullets.'],
  ['বুলেটে ([\\s\\S]+?)টি জায়গায় “I”, “my”, “we”-এর মতো শব্দ আছে।', '$1 first-person {{1:pronoun|pronouns}} in the bullets.'],
  ['অন্য কোথাও উল্লেখ নেই: ([\\s\\S]+)', 'Not mentioned anywhere else: $1'],
  ['আরও ([\\s\\S]+?)টি', '+$1 more'],
  ['([\\s\\S]+?)টি সেকশনের নাম বদলানো হয়েছে: ([\\s\\S]+)।', '$1 {{1:section|sections}} renamed: $2.'],
  ['নেই: ([\\s\\S]+)।', 'Missing: $1.'],
  [
    '([\\s\\S]+?) দেখানোর জন্য বানানো ডিজাইন; ATS সফটওয়্যার এর কিছু অংশ পড়তে পারবে না।',
    '$1 is a display design; automated parsers will lose parts of it.',
  ],
  ['([\\s\\S]+?) \\(([A-Za-z&, ]+)\\)', '$2'],
  ['“([\\s\\S]+?)” এ ফিরুন', 'Reset to “$1”'],
  ['([\\s\\S]+?)টি CV ফিরিয়ে আনা হয়েছে', 'Restored $1 {{1:CV|CVs}}'],
  ['([\\s\\S]+?)টি CV-এর ব্যাকআপ নেওয়া হয়েছে', 'Backed up $1 {{1:CV|CVs}}'],
  ['([\\s\\S]+?)টি ডকুমেন্ট এক্সপোর্ট হয়েছে।', 'Exported $1 {{1:document|documents}}.'],
  ['([\\s\\S]+?)টি ডকুমেন্টের ব্যাকআপ নেওয়া হয়েছে', 'Backed up $1 {{1:document|documents}}'],
  ['ফোল্ডার থেকে ([\\s\\S]+?)টি ডকুমেন্ট ফিরিয়ে আনা হয়েছে।', 'Restored $1 {{1:document|documents}} from the folder.'],
  ['([\\s\\S]+?)টি ডকুমেন্ট ফিরিয়ে আনা হয়েছে।', 'Restored $1 {{1:document|documents}}.'],
  ['([\\s\\S]+?)টি সেভ করা — সীমা ([\\s\\S]+?)টি', '$1 saved — the limit is $2'],
  ['([\\s\\S]+?)টি সেভ করা', '$1 saved'],
  [
    '([\\s\\S]+?)টির মধ্যে ([\\s\\S]+?)টি CV আপনার অ্যাকাউন্টে রাখা আছে, শেষ সিঙ্ক: ([\\s\\S]+?)। বাকি সব CV এই ডিভাইসেই থাকে।',
    '$2 of $1 CVs are kept on your account, last synced $3. Every other CV stays on this device.',
  ],
  [
    '([\\s\\S]+?)টির মধ্যে ([\\s\\S]+?)টি CV আপনার অ্যাকাউন্টে রাখা আছে। বাকি সব CV এই ডিভাইসেই থাকে।',
    '$2 of $1 CVs are kept on your account. Every other CV stays on this device.',
  ],
  ['([\\s\\S]+?)। আপনার মূল CV আগের মতোই আছে।', '$1. Your original is unchanged.'],
  ['([\\s\\S]+?)টি বুলেট সাজানো হয়েছে', '$1 bullets reordered'],
  ['([\\s\\S]+?)টি শব্দ বোল্ড হয়েছে', '$1 terms bolded'],
  ['([\\s\\S]+?)টি দক্ষতা যোগ হয়েছে', '$1 skills added'],
  ['([\\s\\S]+?)টি বুলেট AI দিয়ে গুছিয়ে লেখা হয়েছে', '$1 bullets polished by AI'],
  ...NOUNS.flatMap(([bn, en]): Array<[string, string]> => [
    [`${bn} ([\\s\\S]+?)-এর অ্যাকশন`, `Actions for ${en} $1`],
  ]),
  ['([\\s\\S]+?)-এর অ্যাকশন', 'Actions for $1'],
];
