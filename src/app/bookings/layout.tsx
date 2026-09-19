import { noindexMetadata } from "@/lib/seo";

export const metadata = noindexMetadata;

export default function BookingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
