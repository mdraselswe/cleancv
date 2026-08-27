'use client';

import { useCallback, useState } from 'react';
import type { z } from 'zod';

/**
 * The plumbing every auth form shares.
 *
 * Four forms with the same three states — a field's error, the form's error,
 * and whether a request is in flight — written four times would drift on the
 * third change. This holds the state and the validate-then-submit order; each
 * form supplies its schema and what to do with valid values.
 *
 * Validation runs on submit, not on every keystroke: telling somebody their
 * email is invalid while they are typing the third character of it is noise.
 * A field's error clears as soon as they edit that field, which is the moment
 * the complaint stopped being true.
 */

export interface CredentialForm<Values> {
  values: Values;
  /** Per-field messages, keyed by field name. Empty until the first submit. */
  errors: Partial<Record<keyof Values, string>>;
  /** The one message that belongs to the form rather than to a field. */
  formError: string;
  pending: boolean;
  setField: <Key extends keyof Values>(key: Key, value: Values[Key]) => void;
  setFormError: (message: string) => void;
  submit: (event: React.FormEvent) => void;
}

/** Constrained to object schemas: every form here is a record of named fields. */
export type CredentialSchema = z.ZodType<unknown, Record<string, unknown>>;

export interface CredentialFormOptions<Schema extends CredentialSchema> {
  schema: Schema;
  initial: z.input<Schema>;
  /** Runs only with parsed values. Return a message to show as the form error. */
  onSubmit: (values: z.output<Schema>) => Promise<string | void>;
}

export const useCredentialForm = <Schema extends CredentialSchema>({
  schema,
  initial,
  onSubmit,
}: CredentialFormOptions<Schema>): CredentialForm<z.input<Schema>> => {
  type Values = z.input<Schema>;

  const [values, setValues] = useState<Values>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);

  const setField = useCallback(<Key extends keyof Values>(key: Key, value: Values[Key]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => (current[key] ? { ...current, [key]: undefined } : current));
    setFormError('');
  }, []);

  const submit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      if (pending) return;

      const parsed = schema.safeParse(values);

      if (!parsed.success) {
        const next: Partial<Record<keyof Values, string>> = {};

        for (const issue of parsed.error.issues) {
          const key = issue.path[0] as keyof Values | undefined;
          // The first message per field. A list of three complaints about one
          // input is a wall; the reader fixes one thing and asks again.
          if (key !== undefined && !next[key]) next[key] = issue.message;
        }

        setErrors(next);

        return;
      }

      setErrors({});
      setFormError('');
      setPending(true);

      void onSubmit(parsed.data as z.output<Schema>)
        .then((message) => {
          if (message) setFormError(message);
        })
        .catch((error: unknown) => {
          setFormError(error instanceof Error ? error.message : 'Something went wrong. Try again.');
        })
        .finally(() => setPending(false));
    },
    [pending, schema, values, onSubmit],
  );

  return { values, errors, formError, pending, setField, setFormError, submit };
};
