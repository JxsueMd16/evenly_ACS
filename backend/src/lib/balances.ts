/**
 * Cálculo de balances de un grupo.
 *
 * net > 0: al integrante le deben dinero.
 * net < 0: el integrante debe dinero.
 * La suma de todos los net de un grupo siempre es 0.
 */

export interface ExpenseForBalance {
  pagadoPorId: string;
  montoCentavos: number;
  items: { usuarioId: string; montoCentavos: number }[];
}

/** Pago confirmado: el deudor le pagó al acreedor fuera de la app (efectivo o transferencia). */
export interface PaymentForBalance {
  deudorId: string;
  acreedorId: string;
  montoCentavos: number;
}

export interface Settlement {
  fromUserId: string;
  toUserId: string;
  cents: number;
}

export function computeNetCents(
  memberIds: string[],
  expenses: ExpenseForBalance[],
  payments: PaymentForBalance[] = [],
): Map<string, number> {
  const net = new Map<string, number>(memberIds.map((id) => [id, 0]));
  for (const expense of expenses) {
    net.set(expense.pagadoPorId, (net.get(expense.pagadoPorId) ?? 0) + expense.montoCentavos);
    for (const item of expense.items) {
      net.set(item.usuarioId, (net.get(item.usuarioId) ?? 0) - item.montoCentavos);
    }
  }
  // Un pago confirmado reduce la deuda del deudor y lo que le deben al acreedor.
  for (const payment of payments) {
    net.set(payment.deudorId, (net.get(payment.deudorId) ?? 0) + payment.montoCentavos);
    net.set(payment.acreedorId, (net.get(payment.acreedorId) ?? 0) - payment.montoCentavos);
  }
  return net;
}

/**
 * Sugerencia de pagos para saldar el grupo: el que más debe le paga al que
 * más le deben, hasta que todos quedan en 0. No es el mínimo teórico en todos
 * los casos, pero produce como máximo (n - 1) pagos.
 */
export function suggestSettlements(net: Map<string, number>): Settlement[] {
  const debtors = [...net].filter(([, v]) => v < 0).map(([id, v]) => ({ id, cents: -v }));
  const creditors = [...net].filter(([, v]) => v > 0).map(([id, v]) => ({ id, cents: v }));
  debtors.sort((a, b) => b.cents - a.cents || a.id.localeCompare(b.id));
  creditors.sort((a, b) => b.cents - a.cents || a.id.localeCompare(b.id));

  const settlements: Settlement[] = [];
  let d = 0;
  let c = 0;
  while (d < debtors.length && c < creditors.length) {
    const debtor = debtors[d]!;
    const creditor = creditors[c]!;
    const cents = Math.min(debtor.cents, creditor.cents);
    settlements.push({ fromUserId: debtor.id, toUserId: creditor.id, cents });
    debtor.cents -= cents;
    creditor.cents -= cents;
    if (debtor.cents === 0) d++;
    if (creditor.cents === 0) c++;
  }
  return settlements;
}
