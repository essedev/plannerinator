import { getSession } from "@/lib/auth";
import { getCategories, getBankAccounts } from "@/features/finance/queries";
import { NewTransactionForm } from "./NewTransactionForm";

export default async function NewTransactionPage() {
  const session = (await getSession())!;

  const [categories, accounts] = await Promise.all([
    getCategories(session.user.id),
    getBankAccounts(session.user.id, true),
  ]);

  return (
    <NewTransactionForm
      categories={categories.map((c) => ({ id: c.id, name: c.name, type: c.type }))}
      accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
    />
  );
}
