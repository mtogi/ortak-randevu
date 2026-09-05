import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    providerId?: string;
    slug?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    providerId?: string;
    slug?: string;
  }
}
