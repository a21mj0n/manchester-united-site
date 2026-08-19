import type { Metadata } from "next";
import LoginForm from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Kirish — Red Devils Uzbekistan",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="auth">
      <div className="auth__card">
        <h1 className="auth__title">Admin panel</h1>
        <p className="auth__sub">Fan-klub arizalarini boshqarish uchun kiring</p>
        <LoginForm />
      </div>
    </main>
  );
}
