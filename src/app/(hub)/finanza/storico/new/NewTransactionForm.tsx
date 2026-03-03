"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { createTransaction } from "@/features/finance/actions";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  categories: Array<{ id: string; name: string; type: string }>;
  accounts: Array<{ id: string; name: string }>;
}

export function NewTransactionForm({ categories, accounts }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const type = fd.get("type") as string;
    const amount = fd.get("amount") as string;
    const date = fd.get("date") as string;
    const description = (fd.get("description") as string) || undefined;
    const categoryId = (fd.get("categoryId") as string) || undefined;
    const bankAccountId = (fd.get("bankAccountId") as string) || undefined;
    const toAccountId = (fd.get("toAccountId") as string) || undefined;
    const notes = (fd.get("notes") as string) || undefined;

    startTransition(async () => {
      await createTransaction({
        type,
        amount,
        date,
        description,
        categoryId: categoryId || null,
        bankAccountId: bankAccountId || null,
        toAccountId: toAccountId || null,
        notes: notes || null,
      });
      router.push("/finanza/storico");
    });
  }

  const today = new Date().toISOString().slice(0, 10);

  // Filter categories by selected type
  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");

  return (
    <div>
      <PageHeader title="Nuova transazione" backButton />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="type">Tipo *</Label>
                <select
                  id="type"
                  name="type"
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  defaultValue="expense"
                >
                  <option value="expense">Uscita</option>
                  <option value="income">Entrata</option>
                  <option value="transfer">Trasferimento</option>
                </select>
              </div>
              <div>
                <Label htmlFor="amount">Importo *</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="date">Data *</Label>
                <Input id="date" name="date" type="date" required defaultValue={today} />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrizione</Label>
              <Input
                id="description"
                name="description"
                placeholder="Es. Spesa supermercato"
                maxLength={500}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="categoryId">Categoria</Label>
                <select
                  id="categoryId"
                  name="categoryId"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">— Nessuna —</option>
                  {expenseCategories.length > 0 && (
                    <optgroup label="Uscite">
                      {expenseCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {incomeCategories.length > 0 && (
                    <optgroup label="Entrate">
                      {incomeCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
              <div>
                <Label htmlFor="bankAccountId">Conto</Label>
                <select
                  id="bankAccountId"
                  name="bankAccountId"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">— Nessuno —</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {accounts.length > 0 && (
              <div>
                <Label htmlFor="toAccountId">Conto destinazione (trasferimenti)</Label>
                <select
                  id="toAccountId"
                  name="toAccountId"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">— Nessuno —</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <Label htmlFor="notes">Note</Label>
              <Textarea id="notes" name="notes" rows={2} maxLength={2000} />
            </div>

            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvataggio..." : "Salva transazione"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
