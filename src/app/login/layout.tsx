import { noindexMetadata } from "@/lib/seo";

export const metadata = noindexMetadata;

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
