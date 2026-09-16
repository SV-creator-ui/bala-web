import type { Metadata } from "next";
import { isAuthed, demoMode, adminLocked } from "@/lib/admin/auth";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin — BALA rezervacijos",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const locked = adminLocked();
  const authed = !locked && (await isAuthed());
  const demo = demoMode();

  return (
    <main className="min-h-screen bg-ink text-white">
      {locked ? (
        <div className="mx-auto max-w-[520px] px-6 py-24 text-center">
          <h1 className="font-display text-3xl uppercase mb-3">Admin užrakinta</h1>
          <p className="text-smoke">
            Patikrinkite <code className="text-volt">ADMIN_PASSWORD</code> ir <code className="text-volt">ADMIN_SESSION_SECRET</code> aplinkos kintamuosius.
            Sesijos raktas turi būti atskiras, kriptografiškai atsitiktinis ir bent 32 UTF-8 baitų ilgio, be tarpų pradžioje ar pabaigoje.
          </p>
        </div>
      ) : authed ? (
        <AdminDashboard demo={demo} />
      ) : (
        <AdminLogin demo={demo} />
      )}
    </main>
  );
}
