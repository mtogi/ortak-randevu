import { requestMagicLink } from "@/app/login/actions";

export function EmailCapture({
  emailLabel,
  emailPlaceholder,
  submitLabel,
  inputId,
  className,
}: {
  emailLabel: string;
  emailPlaceholder: string;
  submitLabel: string;
  inputId: string;
  className?: string;
}) {
  return (
    <form
      action={requestMagicLink}
      className={className ? `landing-cta ${className}` : "landing-cta"}
    >
      <label htmlFor={inputId} className="sr-only">
        {emailLabel}
      </label>
      <input
        id={inputId}
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder={emailPlaceholder}
        className="field"
      />
      <button type="submit" className="btn btn-primary">
        {submitLabel}
      </button>
    </form>
  );
}
