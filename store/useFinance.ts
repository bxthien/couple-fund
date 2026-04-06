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
  is_edited?: boolean;
}

export interface Contribution {
  id?: string | number;
  amount: number;
  paid_by: string;
  month: string;
  created_at?: string;
  is_edited?: boolean;
}

interface FinanceState {
  expenses: Expense[];
  contributions: Contribution[];
  fetch: () => Promise<void>;
  addExpense: (e: Partial<Expense>) => Promise<void>;
  addContribution: (c: Partial<Contribution>) => Promise<void>;
  updateExpense: (id: string | number, e: Partial<Expense>) => Promise<void>;
  updateContribution: (id: string | number, c: Partial<Contribution>) => Promise<void>;
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

  updateExpense: async (id, e) => {
    const payload = { ...e, is_edited: true };
    const { data } = await supabase.from("expenses").update(payload).eq("id", id).select();
    
    if (data && data.length > 0) {
      set((state) => ({
        expenses: state.expenses.map((ex) => (ex.id === id ? data[0] : ex)),
      }));
    }
  },

  updateContribution: async (id, c) => {
    const payload = { ...c, is_edited: true };
    const { data } = await supabase.from("contributions").update(payload).eq("id", id).select();
    
    if (data && data.length > 0) {
      set((state) => ({
        contributions: state.contributions.map((ct) => (ct.id === id ? data[0] : ct)),
      }));
    }
  },

}));
