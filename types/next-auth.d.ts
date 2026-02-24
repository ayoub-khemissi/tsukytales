import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    role: "customer" | "admin";
    customerId?: number;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: "customer" | "admin";
      customerId?: number;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "customer" | "admin";
    customerId?: number;
  }
}
