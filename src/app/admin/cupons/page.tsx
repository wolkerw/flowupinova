"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Tag, Trash2, CheckCircle2, Clock, CalendarX2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Coupon {
  id: string;
  code: string;
  discountPercentage: number;
  active: boolean;
  createdAt: any;
  expiresAt?: string;
}

function formatExpiryDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CouponExpiryBadge({ expiresAt }: { expiresAt?: string }) {
  if (!expiresAt) {
    return <Badge variant="outline" className="text-gray-500">Sem prazo</Badge>;
  }

  const isExpired = new Date() > new Date(expiresAt);

  if (isExpired) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <CalendarX2 className="h-3 w-3" />
        Expirado
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="flex items-center gap-1 text-orange-700 bg-orange-50 border-orange-200">
      <Clock className="h-3 w-3" />
      até {formatExpiryDate(expiresAt)}
    </Badge>
  );
}

export default function AdminCuponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [newCode, setNewCode] = useState("");
  const [newDiscount, setNewDiscount] = useState("");
  const [newExpiresAt, setNewExpiresAt] = useState("");

  const { toast } = useToast();

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/cupons");
      const data = await res.json();
      if (res.ok && data.coupons) {
        setCoupons(data.coupons);
      } else {
        toast({
          title: "Erro",
          description: data.error || "Falha ao buscar cupons",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Erro de rede.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newDiscount) return;

    try {
      setCreating(true);
      const res = await fetch("/api/admin/cupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCode,
          discountPercentage: Number(newDiscount),
          expiresAt: newExpiresAt || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast({ title: "Sucesso", description: "Cupom criado!" });
        setNewCode("");
        setNewDiscount("");
        setNewExpiresAt("");
        fetchCoupons();
      } else {
        toast({
          title: "Erro",
          description: data.error || "Falha ao criar",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Erro de rede.", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm(`Deseja realmente deletar o cupom ${code}?`)) return;

    try {
      setDeleting(code);
      const res = await fetch(`/api/admin/cupons?code=${encodeURIComponent(code)}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (res.ok) {
        toast({ title: "Sucesso", description: "Cupom removido!" });
        fetchCoupons();
      } else {
        toast({
          title: "Erro",
          description: data.error || "Falha ao deletar",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Erro de rede.", variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  // Data/hora mínima: agora (para impedir criar cupons já expirados)
  const minDateTime = new Date().toISOString().slice(0, 16);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Gerenciamento de Cupons</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Tag className="mr-2 h-5 w-5 text-primary" />
            Criar Novo Cupom
          </CardTitle>
          <CardDescription>
            Crie cupons de desconto para parceiros e influenciadores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col items-end gap-4 md:flex-row">
              <div className="flex-1 space-y-2">
                <Label htmlFor="code">Código do Cupom (ex: PARCEIRO50)</Label>
                <Input
                  id="code"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="PROMO20"
                  required
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="discount">Desconto em % (ex: 50 para 50%)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="1"
                  max="100"
                  value={newDiscount}
                  onChange={(e) => setNewDiscount(e.target.value)}
                  placeholder="20"
                  required
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="expiresAt" className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-orange-500" />
                  Válido até (opcional)
                </Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={newExpiresAt}
                  onChange={(e) => setNewExpiresAt(e.target.value)}
                  min={minDateTime}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={creating} className="w-full md:w-auto">
                {creating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Criar Cupom
              </Button>
            </div>
            {newExpiresAt && (
              <p className="text-xs text-gray-500">
                ⏱ Este cupom expirará em <strong>{formatExpiryDate(newExpiresAt)}</strong>. Após esta data, o cupom será automaticamente invalidado.
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cupons Ativos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : coupons.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Nenhum cupom criado ainda.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-500">
                <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                  <tr>
                    <th className="px-6 py-3">Código</th>
                    <th className="px-6 py-3">Desconto</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Validade</th>
                    <th className="px-6 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => (
                    <tr key={coupon.id} className="border-b bg-white">
                      <td className="px-6 py-4 font-mono font-bold text-gray-900">{coupon.code}</td>
                      <td className="px-6 py-4 font-medium text-green-600">
                        {coupon.discountPercentage}% OFF
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={coupon.active ? "default" : "secondary"}>
                          {coupon.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <CouponExpiryBadge expiresAt={coupon.expiresAt} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 hover:text-red-800"
                          onClick={() => handleDelete(coupon.code)}
                          disabled={deleting === coupon.code}
                        >
                          {deleting === coupon.code ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
