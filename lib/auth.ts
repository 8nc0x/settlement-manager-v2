import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verifyUserPassword, getUserById } from '@/lib/db';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Only use secure cookies if explicitly running on HTTPS; allows HTTP IP:port hosting
  useSecureCookies: Boolean(process.env.NEXTAUTH_URL?.startsWith('https://')),
  secret: process.env.NEXTAUTH_SECRET || 'settletrack-production-secret-key-32chars',
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }
        const user = verifyUserPassword(credentials.email, credentials.password);
        if (!user) {
          throw new Error('Invalid email or password');
        }
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          businessName: user.businessName,
          phone: user.phone,
          defaultUpiId: user.defaultUpiId,
          subAdminId: user.subAdminId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.businessName = (user as any).businessName;
        token.phone = (user as any).phone;
        token.defaultUpiId = (user as any).defaultUpiId;
        token.subAdminId = (user as any).subAdminId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
        session.user.businessName = token.businessName as string;
        session.user.phone = token.phone as string;
        session.user.defaultUpiId = token.defaultUpiId as string;
        session.user.subAdminId = token.subAdminId as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      try {
        const parsedUrl = new URL(url);
        const parsedBase = new URL(baseUrl);
        if (parsedUrl.origin === parsedBase.origin || parsedUrl.host === parsedBase.host) return url;
      } catch {
        // ignore
      }
      return baseUrl;
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
};
