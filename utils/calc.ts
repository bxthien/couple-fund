// utils/calc.ts
import { Expense, Contribution, USERS } from "../store/useFinance";

export function calculateDebt(expenses: Expense[]) {
  let netBalance = 0;
  let totalMiaPaid = 0;
  let totalEthanPaid = 0;

  expenses.forEach((e) => {
    if (e.source === "personal") {
      const half = e.amount / 2;

      if (e.paid_by === USERS[0] || e.paid_by === "A") { // Fallback to "A" for older records
        netBalance -= half;
        totalMiaPaid += e.amount;
      } else {
        netBalance += half;
        totalEthanPaid += e.amount;
      }
    } else if (e.source === "settlement") {
      if (e.paid_by === USERS[0] || e.paid_by === "A") {
        netBalance -= e.amount;
      } else {
        netBalance += e.amount;
      }
    }
  });

  return {
    netBalance,
    totalMiaPaid,
    totalEthanPaid,
    [USERS[0] + "_owes_" + USERS[1]]: netBalance > 0 ? netBalance : 0,
    [USERS[1] + "_owes_" + USERS[0]]: netBalance < 0 ? Math.abs(netBalance) : 0,
    // Add legacy fallback for old references (if UI still accesses A_owes_B)
    A_owes_B: netBalance > 0 ? netBalance : 0,
    B_owes_A: netBalance < 0 ? Math.abs(netBalance) : 0,
  };
}

export function calculateSharedBalance(
  contributions: Contribution[] = [],
  expenses: Expense[] = [],
) {
  const totalContribution = contributions.reduce(
    (sum, c) => sum + Number(c.amount || 0),
    0,
  );

  const totalExpense = expenses
    .filter((e) => e.source === "shared_fund")
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return totalContribution - totalExpense;
}
