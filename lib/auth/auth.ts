import type { CustomerRow } from "@/types/db.types";

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { ResultSetHeader } from "mysql2";

import { authConfig } from "./auth.config";

import { pool } from "@/lib/db/connection";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    // Customer login — email + password
    Credentials({
      id: "customer-credentials",
      name: "Customer",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        if (!email || !password) return null;

        const [rows] = await pool.execute<CustomerRow[]>(
          "SELECT * FROM customers WHERE email = ? LIMIT 1",
          [email],
        );
        const customer = rows[0];

        if (!customer) return null;

        const valid = await bcrypt.compare(password, customer.password);

        if (!valid) return null;

        return {
          id: String(customer.id),
          email: customer.email,
          name:
            [customer.first_name, customer.last_name]
              .filter(Boolean)
              .join(" ") || null,
          role: "customer" as const,
          customerId: customer.id,
        };
      },
    }),

    // Google OAuth — auto-creates customer if email unknown
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      // Google OAuth: create customer if doesn't exist
      if (account?.provider === "google" && user.email) {
        const [rows] = await pool.execute<CustomerRow[]>(
          "SELECT id FROM customers WHERE email = ? LIMIT 1",
          [user.email],
        );

        if (rows.length === 0) {
          const [namePart1, ...rest] = (user.name ?? "").split(" ");
          const [result] = await pool.execute<ResultSetHeader>(
            "INSERT INTO customers (first_name, last_name, email, password, has_account) VALUES (?, ?, ?, ?, ?)",
            [
              namePart1 || null,
              rest.join(" ") || null,
              user.email,
              await bcrypt.hash(crypto.randomUUID(), 10),
              true,
            ],
          );

          user.customerId = result.insertId;
        } else {
          user.customerId = rows[0].id;
        }
        user.role = "customer";
      }

      return true;
    },
  },
});
