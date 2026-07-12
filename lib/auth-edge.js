import NextAuth from 'next-auth';

// Lightweight config for middleware — no database adapter, JWT only.
// The full auth() (with Prisma) lives in auth.js and is only called
// in Server Components / API routes that run in the Node.js runtime.
export const { auth: middlewareAuth } = NextAuth({
  session: { strategy: 'jwt' },
  providers: [], // no providers needed — we only read the JWT
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
});
