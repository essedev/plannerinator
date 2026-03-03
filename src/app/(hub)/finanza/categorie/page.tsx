import { getSession } from "@/lib/auth";
import { getCategories } from "@/features/finance/queries";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewCategoryForm } from "./NewCategoryForm";
import { DeleteCategoryButton } from "./DeleteCategoryButton";

const typeLabels: Record<string, string> = {
  income: "Entrata",
  expense: "Uscita",
  transfer: "Trasferimento",
};

const typeVariants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  income: "default",
  expense: "destructive",
  transfer: "secondary",
};

export default async function CategoriePage() {
  const session = (await getSession())!;

  const categories = await getCategories(session.user.id);

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");

  return (
    <div>
      <PageHeader title="Categorie" description="Gestisci le categorie per le transazioni." />

      <div className="space-y-6">
        {/* Expense Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Categorie Uscite</CardTitle>
            <CardDescription>{expenseCategories.length} categorie</CardDescription>
          </CardHeader>
          <CardContent>
            {expenseCategories.length > 0 && (
              <div className="space-y-2 mb-4">
                {expenseCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      {cat.icon && <span>{cat.icon}</span>}
                      <span className="text-sm font-medium">{cat.name}</span>
                      <Badge variant={typeVariants[cat.type]} className="text-xs">
                        {typeLabels[cat.type]}
                      </Badge>
                    </div>
                    <DeleteCategoryButton id={cat.id} name={cat.name} />
                  </div>
                ))}
              </div>
            )}
            <NewCategoryForm type="expense" />
          </CardContent>
        </Card>

        {/* Income Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Categorie Entrate</CardTitle>
            <CardDescription>{incomeCategories.length} categorie</CardDescription>
          </CardHeader>
          <CardContent>
            {incomeCategories.length > 0 && (
              <div className="space-y-2 mb-4">
                {incomeCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      {cat.icon && <span>{cat.icon}</span>}
                      <span className="text-sm font-medium">{cat.name}</span>
                      <Badge variant={typeVariants[cat.type]} className="text-xs">
                        {typeLabels[cat.type]}
                      </Badge>
                    </div>
                    <DeleteCategoryButton id={cat.id} name={cat.name} />
                  </div>
                ))}
              </div>
            )}
            <NewCategoryForm type="income" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
