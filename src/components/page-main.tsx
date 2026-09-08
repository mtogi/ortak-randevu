const widths = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-3xl",
} as const;

export function PageMain({
  children,
  width = "md",
}: {
  children: React.ReactNode;
  width?: keyof typeof widths;
}) {
  return <main className={`page-main ${widths[width]}`}>{children}</main>;
}
