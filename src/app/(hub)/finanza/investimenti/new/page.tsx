"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createInvestment, createCryptoHolding } from "@/features/finance/actions";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function NewInvestmentPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"investment" | "crypto">("investment");

  function handleInvestmentSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      await createInvestment({
        name: fd.get("name") as string,
        type: (fd.get("type") as string) || "etf",
        ticker: (fd.get("ticker") as string) || null,
        quantity: (fd.get("quantity") as string) || null,
        purchasePrice: (fd.get("purchasePrice") as string) || null,
        purchaseDate: (fd.get("purchaseDate") as string) || null,
        currentValue: (fd.get("currentValue") as string) || null,
        notes: (fd.get("notes") as string) || null,
      });
      router.push("/finanza/investimenti");
    });
  }

  function handleCryptoSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      await createCryptoHolding({
        symbol: fd.get("symbol") as string,
        name: fd.get("name") as string,
        quantity: fd.get("quantity") as string,
        purchasePrice: (fd.get("purchasePrice") as string) || null,
        exchange: (fd.get("exchange") as string) || null,
        walletType: (fd.get("walletType") as string) || null,
        notes: (fd.get("notes") as string) || null,
      });
      router.push("/finanza/investimenti");
    });
  }

  return (
    <div>
      <PageHeader title="Nuovo investimento" backButton />

      <div className="flex gap-2 mb-6">
        <Button
          variant={mode === "investment" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("investment")}
        >
          Investimento
        </Button>
        <Button
          variant={mode === "crypto" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("crypto")}
        >
          Crypto
        </Button>
      </div>

      {mode === "investment" ? (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleInvestmentSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input id="name" name="name" required placeholder="Es. Vanguard S&P 500" />
                </div>
                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <select
                    id="type"
                    name="type"
                    defaultValue="etf"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="etf">ETF</option>
                    <option value="stock">Azione</option>
                    <option value="bond">Obbligazione</option>
                    <option value="fund">Fondo</option>
                    <option value="other">Altro</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="ticker">Ticker</Label>
                  <Input id="ticker" name="ticker" placeholder="VWCE" />
                </div>
                <div>
                  <Label htmlFor="quantity">Quantita</Label>
                  <Input id="quantity" name="quantity" type="number" step="0.000001" />
                </div>
                <div>
                  <Label htmlFor="purchaseDate">Data acquisto</Label>
                  <Input id="purchaseDate" name="purchaseDate" type="date" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="purchasePrice">Prezzo acquisto</Label>
                  <Input id="purchasePrice" name="purchasePrice" type="number" step="0.01" />
                </div>
                <div>
                  <Label htmlFor="currentValue">Valore attuale</Label>
                  <Input id="currentValue" name="currentValue" type="number" step="0.01" />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Note</Label>
                <Textarea id="notes" name="notes" rows={2} />
              </div>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Salvataggio..." : "Salva investimento"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleCryptoSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="symbol">Simbolo *</Label>
                  <Input id="symbol" name="symbol" required placeholder="BTC" />
                </div>
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input id="name" name="name" required placeholder="Bitcoin" />
                </div>
                <div>
                  <Label htmlFor="quantity">Quantita *</Label>
                  <Input id="quantity" name="quantity" type="number" step="0.00000001" required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="purchasePrice">Prezzo acquisto</Label>
                  <Input id="purchasePrice" name="purchasePrice" type="number" step="0.01" />
                </div>
                <div>
                  <Label htmlFor="exchange">Exchange</Label>
                  <Input id="exchange" name="exchange" placeholder="Binance" />
                </div>
                <div>
                  <Label htmlFor="walletType">Tipo wallet</Label>
                  <select
                    id="walletType"
                    name="walletType"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">—</option>
                    <option value="exchange">Exchange</option>
                    <option value="cold">Cold wallet</option>
                    <option value="hot">Hot wallet</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Note</Label>
                <Textarea id="notes" name="notes" rows={2} />
              </div>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Salvataggio..." : "Salva crypto"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
