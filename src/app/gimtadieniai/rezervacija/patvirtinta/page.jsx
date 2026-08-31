import Footer from "@/components/gimt/Footer";
import { formatEur } from "@/lib/booking/pricing";
import { getPartyPackage } from "@/lib/booking/packages";
import { resolveBooking, resolveByRef, readConfirmParams } from "@/lib/booking/confirm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Rezervacija patvirtinta | BALA VR gimtadieniai",
};

const MONTHS = ["sausio","vasario","kovo","balandžio","gegužės","birželio","liepos","rugpjūčio","rugsėjo","spalio","lapkričio","gruodžio"];
function fmtDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function serviceLabel(booking) {
  const pkg = getPartyPackage(booking.package_id ?? "");
  return pkg ? `Gimtadienio paketas ${pkg.name}` : "Gimtadienio šventė";
}

function Header() {
  return (
    <header className="gimt-res-header">
      <div className="container gimt-res-bar">
        <a href="/gimtadieniai" className="nav-brand" aria-label="BALA VR — atgal į gimtadienius">
          <span className="nav-brand-text">
            <span className="brand-bala">BALA</span>
            <span className="brand-vr">VR</span>
          </span>
        </a>
        <a href="tel:+37068426686" className="nav-phone">+370 684 26686</a>
      </div>
    </header>
  );
}

export default async function Page({ searchParams }) {
  const sp = await searchParams;
  const { token, ref } = readConfirmParams(sp);
  const { status, booking } = token ? await resolveBooking(token) : await resolveByRef(ref);

  return (
    <>
      <Header />
      <main className="gimt-conf-main">
        <div className="gimt-conf">
          {status === "paid" && booking && (
            <>
              <div className="gimt-conf-check" aria-hidden="true">✓</div>
              <h1 className="gimt-conf-title">Rezervacija patvirtinta!</h1>
              <p className="gimt-conf-lead">
                Patvirtinimą išsiuntėme el. paštu <strong>{booking.customer_email}</strong>.
                Iki pasimatymo BALA VR šventėje! 🎉
              </p>

              <div className="gimt-ticket">
                <div className="gimt-ticket-top">
                  <span>BALA · BILIETAS</span>
                  <span className="gimt-ticket-ref">{booking.merchant_reference}</span>
                </div>
                <div className="gimt-ticket-body">
                  <Item k="Paslauga" v={serviceLabel(booking)} full />
                  <Item k="Data" v={fmtDate(booking.date)} />
                  <Item k="Pradžia" v={booking.time} />
                  <Item k="Dalyviai" v={`${booking.players} asm.`} />
                  <Item
                    k="Sumokėtas avansas"
                    v={`${formatEur(Number(booking.deposit_eur))} € (iš ${formatEur(Number(booking.total_eur))} €)`}
                    full
                  />
                </div>
                <div className="gimt-ticket-foot">
                  📍 BALA VR, Klaipėda · atvykite ~15 min. anksčiau · likutį sumokėsite vietoje
                </div>
              </div>
            </>
          )}

          {status === "pending" && booking && (
            <>
              <div className="gimt-conf-check gimt-conf-wait" aria-hidden="true">⏳</div>
              <h1 className="gimt-conf-title">Laukiama apmokėjimo</h1>
              <p className="gimt-conf-lead">
                Jūsų mokėjimas dar apdorojamas. Kai tik jis patvirtinamas, gausite el. laišką.
                Jei apmokėjote — palaukite kelias minutes.
              </p>
              <a href="/gimtadieniai" className="btn btn-primary">Grįžti į gimtadienius</a>
            </>
          )}

          {status === "error" && (
            <>
              <div className="gimt-conf-check gimt-conf-err" aria-hidden="true">!</div>
              <h1 className="gimt-conf-title">Nepavyko rasti rezervacijos</h1>
              <p className="gimt-conf-lead">
                Jei apmokėjote, bet matote šį pranešimą — susisiekite su mumis, ir viską sutvarkysime.
              </p>
              <a href="/gimtadieniai/rezervacija" className="btn btn-primary">Bandyti dar kartą</a>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function Item({ k, v, full = false }) {
  return (
    <div className={full ? "gimt-ticket-item gimt-ticket-item--full" : "gimt-ticket-item"}>
      <div className="gimt-ticket-k">{k}</div>
      <div className="gimt-ticket-v">{v}</div>
    </div>
  );
}
