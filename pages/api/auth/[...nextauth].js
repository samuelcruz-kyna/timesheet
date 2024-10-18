import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      authorize: async (credentials) => {
        try {
          const user = await prisma.user.findUnique({
            where: { username: credentials.username },
          });

          if (!user) {
            console.error('User not found');
            return null; // User not found
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          if (!isPasswordValid) {
            console.error('Invalid password');
            return null; // Invalid password
          }

          return user; // Return user object on success
        } catch (error) {
          console.error('Error in authorize method:', error);
          return null; // Handle any unexpected errors
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
    signOut: '/auth/logout',
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add user information to the token if user exists
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.employeeID = user.employeeID;
      }
      return token;
    },
    async session({ session, token }) {
      // Include user information in the session
      if (token) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.employeeID = token.employeeID;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
