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
            Duomenų bazė sukonfigūruota, bet nenustatytas <code className="text-volt">ADMIN_PASSWORD</code>.
            Pridėkite jį aplinkos kintamuosiuose ir perkraukite.
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
