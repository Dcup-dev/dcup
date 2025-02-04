import "next-auth";

// next-auth.d.ts
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string
      name?: string | null
      email?: string | null
      image?: string | null
      plan?: "Free" | "Basic" | "Pro" | "Business" | "Enterprise"
      volume?: number,
    };
  }
  interface User {
    id?: string
    name?: string | null
    email?: string | null
    image?: string | null
    plan?: "Free" | "Basic" | "Pro" | "Business" | "Enterprise"
    volume?: number,

  }
  interface JWT {
    id?: string;
    plan?: "Free" | "Basic" | "Pro" | "Business" | "Enterprise"
    volume?: number,
  }

}
