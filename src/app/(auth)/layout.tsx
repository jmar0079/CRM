import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = { title: "Sign In | CRM" };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.className} min-h-screen bg-slate-50 flex items-center justify-center p-4`}>
      {children}
    </div>
  );
}
