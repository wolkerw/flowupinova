"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Tag, Trash2, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Coupon {
  id: string;
  code: string;
  discountPercentage: number;
  active: boolean;
  createdAt: any;
}

export default function AdminCuponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  
  const [newCode, setNewCode] = useState("");
  const [newDiscount, setNewDiscount] = useState("");
  
  const { toast } = useToast();

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/cupons");
      const data = await res.json();
      if (res.ok && data.coupons) {
        setCoupons(data.coupons);
      } else {
        toast({ title: "Erro", description: data.error || "Falha ao buscar cupons", variant: "destructive" });
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
          discountPercentage: Number(newDiscount)
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Sucesso", description: "Cupom criado!" });
        setNewCode("");
        setNewDiscount("");
        fetchCoupons();
      } else {
        toast({ title: "Erro", description: data.error || "Falha ao criar", variant: "destructive" });
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
        method: "DELETE"
      });
      
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Sucesso", description: "Cupom removido!" });
        fetchCoupons();
      } else {
        toast({ title: "Erro", description: data.error || "Falha ao deletar", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Erro de rede.", variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

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
          <CardDescription>Crie cupons de desconto para parceiros e influenciadores.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="space-y-2 flex-1">
              <Label htmlFor="code">Código do Cupom (ex: PARCEIRO50)</Label>
              <Input 
                id="code" 
                value={newCode} 
                onChange={e => setNewCode(e.target.value.toUpperCase())} 
                placeholder="PROMO20" 
                required 
              />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="discount">Desconto em % (ex: 50 para 50%)</Label>
              <Input 
                id="discount" 
                type="number" 
                min="1" 
                max="100" 
                value={newDiscount} 
                onChange={e => setNewDiscount(e.target.value)} 
                placeholder="20" 
                required 
              />
            </div>
            <Button type="submit" disabled={creating} className="w-full md:w-auto">
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Criar Cupom
            </Button>
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
            <div className="text-center p-8 text-gray-500">
              Nenhum cupom criado ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">Código</th>
                    <th className="px-6 py-3">Desconto</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => (
                    <tr key={coupon.id} className="bg-white border-b">
                      <td className="px-6 py-4 font-bold text-gray-900 font-mono">
                        {coupon.code}
                      </td>
                      <td className="px-6 py-4 font-medium text-green-600">
                        {coupon.discountPercentage}% OFF
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={coupon.active ? "default" : "secondary"}>
                          {coupon.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
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
