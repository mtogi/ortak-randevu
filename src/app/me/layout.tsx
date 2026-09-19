import { noindexMetadata } from "@/lib/seo";

export const metadata = noindexMetadata;

export default function MeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
