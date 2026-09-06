/** Absolute origin of this deployment, used for links inside emails. */
export function appOrigin(): string {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

export function absoluteUrl(path: string): string {
  return `${appOrigin()}${path.startsWith("/") ? path : `/${path}`}`;
}
