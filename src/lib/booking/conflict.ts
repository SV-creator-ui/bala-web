/** PostgreSQL exclusion constraint violation (overlapping booking intervals). */
export function isBookingOverlap(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23P01";
}

/** DB atmetė nebegaliojantį arba kitos rezervacijos užimtą nuolaidos claim. */
export function isDiscountClaimConflict(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P0002";
}

export class BookingPaymentConflictError extends Error {
  constructor() {
    super("Mokėjimas gautas, bet rezervacija nepatvirtinta: laikas jau užimtas. Reikalinga rankinė peržiūra arba mokėjimo grąžinimas.");
    this.name = "BookingPaymentConflictError";
  }
}
