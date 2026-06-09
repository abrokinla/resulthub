import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { queryOne } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const rows = await queryOne<{
          id: string;
          email: string;
          name: string;
          role: string;
          schoolId: string;
          passwordHash: string;
          slug: string;
        }>(
          `SELECT u.id, u.email, u.name, u.role, u."schoolId", u."passwordHash", s.slug
           FROM "User" u JOIN "School" s ON u."schoolId" = s.id
           WHERE u.email = $1`,
          [credentials.email]
        );

        if (!rows) return null;

        const isValid = await compare(
          credentials.password as string,
          rows.passwordHash
        );
        if (!isValid) return null;

        return {
          id: rows.id,
          email: rows.email,
          name: rows.name,
          role: rows.role,
          schoolId: rows.schoolId,
          schoolSlug: rows.slug,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.schoolId = (user as any).schoolId;
        token.schoolSlug = (user as any).schoolSlug;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.schoolId = token.schoolId as string;
        session.user.schoolSlug = token.schoolSlug as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
