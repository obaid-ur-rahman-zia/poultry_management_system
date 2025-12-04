import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
            include: {
              cash_in_hand_account: true,
            },
          });

          if (!user || user.status !== 1) {
            return null;
          }

          // const isPasswordValid = await bcrypt.compare(
          //   credentials.password,
          //   user.password
          // );

          // if (!isPasswordValid) {
          //   return null;
          // }

          return {
            id: user.user_id.toString(),
            email: user.email,
            name: user.user_nam,
            role: user.role,
            image: user.profile_picture,
            cashInHandAccountId: user.cash_in_hand_account_id?.toString(),
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.cashInHandAccountId = user.cashInHandAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.cashInHandAccountId = token.cashInHandAccountId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

