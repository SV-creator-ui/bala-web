import type { Metadata } from "next";
import Link from "next/link";
import { verifyUnsubscribeToken } from "@/lib/promo/unsubscribe";

export const metadata: Metadata = {
  title: "Atsisakyti laiškų",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || "";
  const email = one(sp.e);
  const token = one(sp.t);
  const done = one(sp.done) === "1";
  const valid = verifyUnsubscribeToken(email.trim().toLowerCase(), token);

  return (
    <main className="min-h-screen bg-ink text-white grid place-items-center px-6 py-16">
      <div className="w-full max-w-[460px] rounded-2xl border border-line bg-ink-card p-7 text-center">
        <div className="font-display text-2xl uppercase tracking-wide">
          BALA <span className="text-volt">VR</span>
        </div>

        {done ? (
          <>
            <h1 className="mt-6 font-display text-xl uppercase">Atsisakyta</h1>
            <p className="mt-3 text-[15px] text-smoke">
              Daugiau pasiūlymų laiškų jums nebesiųsime. Rezervacijų patvirtinimai ir priminimai apie jūsų
              užsakymus vis tiek bus siunčiami.
            </p>
          </>
        ) : valid ? (
          <>
            <h1 className="mt-6 font-display text-xl uppercase">Atsisakyti pasiūlymų?</h1>
            <p className="mt-3 text-[15px] text-smoke">
              Nebesiųsime nuolaidų ir priminimų apie šventes adresu <b className="text-white">{email}</b>.
              Užsakymų patvirtinimai ir priminimai apie jūsų rezervacijas vis tiek bus siunčiami.
            </p>
            <form method="POST" action="/api/unsubscribe" className="mt-6">
              <input type="hidden" name="e" value={email} />
              <input type="hidden" name="t" value={token} />
              <button
                type="submit"
                className="w-full rounded-xl bg-volt px-5 py-3 font-display text-base uppercase tracking-wide text-volt-ink hover:brightness-105"
              >
                Atsisakyti
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="mt-6 font-display text-xl uppercase">Nuoroda netinkama</h1>
            <p className="mt-3 text-[15px] text-smoke">
              Nuoroda neteisinga arba pasenusi. Parašykite bala.pramogos@gmail.com ir pašalinsime jus iš sąrašo.
            </p>
          </>
        )}

        <Link href="/" className="mt-6 inline-block text-[13px] text-smoke-2 underline underline-offset-4 hover:text-white">
          Į pradžią
        </Link>
      </div>
    </main>
  );
}
