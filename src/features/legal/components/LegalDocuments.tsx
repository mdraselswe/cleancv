'use client';

import { useLang } from '@/i18n';

import { PrivacyPolicy, type PrivacyPolicyProps } from './PrivacyPolicy';
import { PrivacyPolicyEn } from './PrivacyPolicy.en';
import { TermsOfService, type TermsOfServiceProps } from './TermsOfService';
import { TermsOfServiceEn } from './TermsOfService.en';

/**
 * The two published documents, in the reader's language.
 *
 * These are long legal prose rather than interface strings, so each language
 * is its own written document instead of a phrase-by-phrase translation of the
 * other: the English one is the original, the Bangla one a rewrite of it.
 */
export const PrivacyPolicyView = (props: PrivacyPolicyProps) =>
  useLang() === 'en' ? <PrivacyPolicyEn {...props} /> : <PrivacyPolicy {...props} />;

export const TermsOfServiceView = (props: TermsOfServiceProps) =>
  useLang() === 'en' ? <TermsOfServiceEn {...props} /> : <TermsOfService {...props} />;
