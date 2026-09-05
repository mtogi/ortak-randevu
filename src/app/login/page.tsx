import { getTranslations } from "next-intl/server";
import { requestMagicLink } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const t = await getTranslations("auth");
  const { error } = await searchParams;
  const errorMessage =
    error === "invalid-email" ? t("invalidEmail") : error ? t("sendFailed") : null;

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-sm opacity-80">{t("description")}</p>
      {errorMessage ? (
        <p className="rounded-lg border border-red-500/40 px-3 py-2 text-sm" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <form action={requestMagicLink} className="flex flex-col gap-3">
        <label htmlFor="email" className="text-sm">
          {t("emailLabel")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded border border-current/20 bg-transparent px-3 py-2"
        />
        <button
          type="submit"
          className="rounded border border-current/20 px-3 py-2 text-sm"
        >
          {t("submit")}
        </button>
      </form>
    </main>
  );
}
