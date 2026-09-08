import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { PageMain } from "@/components/page-main";

export function MissingNotice({
  message,
  href = "/",
  linkLabel,
}: {
  message: string;
  href?: string;
  linkLabel: string;
}) {
  return (
    <>
      <AppHeader />
      <PageMain width="sm">
        <div className="surface flex flex-col gap-4">
          <p className="text-sm">{message}</p>
          <Link href={href} className="btn btn-primary self-start">
            {linkLabel}
          </Link>
        </div>
      </PageMain>
    </>
  );
}
