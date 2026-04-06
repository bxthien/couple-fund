// utils/calc.ts
import { Expense, Contribution } from '../store/useFinance';

export function calculateDebt(expenses: Expense[]) {
  let A_owes_B = 0;
  let B_owes_A = 0;

  expenses.forEach((e) => {
    if (e.source === "personal") {
      const half = e.amount / 2;

      if (e.paid_by === "A") {
        B_owes_A += half;
      } else {
        A_owes_B += half;
      }
    }
  });

  return { A_owes_B, B_owes_A };
}

export function calculateSharedBalance(contributions: Contribution[] = [], expenses: Expense[] = []) {
  const totalContribution = contributions.reduce(
    (sum, c) => sum + Number(c.amount || 0),
    0,
  );

  const totalExpense = expenses
    .filter((e) => e.source === "shared_fund")
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return totalContribution - totalExpense;
}
