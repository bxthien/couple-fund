import { create } from "zustand";
import { supabase } from "@/lib/supabase";

export const USERS = ["Mia", "Ethan"] as const;
export type UserType = typeof USERS[number];

export interface Expense {
  id?: string | number;
  amount: number;
  paid_by: string;
  source: string;
  month: string;
  created_at?: string;
  note?: string;
}

export interface Contribution {
  id?: string | number;
  amount: number;
  paid_by: string;
  month: string;
  created_at?: string;
}

interface FinanceState {
  expenses: Expense[];
  contributions: Contribution[];
  fetch: () => Promise<void>;
  addExpense: (e: Partial<Expense>) => Promise<void>;
  addContribution: (c: Partial<Contribution>) => Promise<void>;
}

export const useFinance = create<FinanceState>((set) => ({
  expenses: [],
  contributions: [],

  fetch: async () => {
    const { data: expenses } = await supabase.from("expenses").select("*");

    const { data: contributions } = await supabase
      .from("contributions")
      .select("*");

    set({
      expenses: expenses || [],
      contributions: contributions || [],
    });
  },

  addExpense: async (e) => {
    const { data } = await supabase.from("expenses").insert(e).select();

    set((state) => ({
      expenses: [...state.expenses, ...(data || [])],
    }));
  },

  addContribution: async (c) => {
    const { data } = await supabase
      .from("contributions")
      .insert(c)
      .select();

    set((state) => ({
      contributions: [...state.contributions, ...(data || [])],
    }));
  },
}));
