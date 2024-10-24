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
        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
          include: {
            employee: true, // Include employee details (firstName, lastName)
          }
        });

        if (user && await bcrypt.compare(credentials.password, user.password)) {
          return {
            ...user,
            firstName: user.employee.firstName, // Add firstName from employee data
            lastName: user.employee.lastName,   // Add lastName from employee data
          };
        }
        return null;  // Return null if login fails
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
        token.firstName = user.firstName;  // Add firstName to the token
        token.lastName = user.lastName;    // Add lastName to the token
      }
      return token;
    },
    async session({ session, token }) {
      // Include user information in the session
      if (token) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.employeeID = token.employeeID;
        session.user.firstName = token.firstName; 
        session.user.lastName = token.lastName;  
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);