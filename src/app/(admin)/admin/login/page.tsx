import { connection } from "next/server";
import AdminLoginForm from "./AdminLoginForm";

export default async function AdminLoginPage() {
  await connection();

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-6">
      <AdminLoginForm />
    </main>
  );
}