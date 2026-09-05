/**
 * Q-T10: public booking URLs live under `/book/[providerSlug]` so reserved
 * app routes never collide with a dietitian slug. The page itself is M2c.
 */
export function publicBookingPath(providerSlug: string): string {
  return `/book/${providerSlug}`;
}
