/**
 * "or" between the Google button and the email form.
 *
 * A hairline with a word in it, drawn with two flex children rather than a
 * pseudo-element on a container, so the word sits on the background it is
 * actually over in either theme.
 */
export const AuthDivider = ({ label = 'or' }: { label?: string }) => (
  <div className="flex items-center gap-3" aria-hidden="true">
    <span className="bg-border-base h-px flex-1" />
    <span className="text-fg-subtle text-ui-xs">{label}</span>
    <span className="bg-border-base h-px flex-1" />
  </div>
);
