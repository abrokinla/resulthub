import "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    schoolId?: string;
    schoolSlug?: string;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      schoolId: string;
      schoolSlug: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    schoolId: string;
    schoolSlug: string;
  }
}
