"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  Eye,
  Users,
  MousePointer,
  ShoppingCart,
  DollarSign,
  Share2
} from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

export default function Relatorios() {
  const performanceData = [
    { month: 'Jan', impressions: 15000, clicks: 890, conversions: 45 },
    { month: 'Fev', impressions: 18500, clicks: 1240, conversions: 62 },
    { month: 'Mar', impressions: 22100, clicks: 1580, conversions: 78 },
    { month: 'Abr', impressions: 19800, clicks: 1350, conversions: 71 },
    { month: 'Mai', impressions: 25600, clicks: 1890, conversions: 95 },
    { month: 'Jun', impressions: 28300, clicks: 2150, conversions: 112 }
  ];

  const channelData = [
    { name: 'Google Ads', value: 45, color: '#3B82F6' },
    { name: 'Facebook', value: 30, color: '#8B5CF6' },
    { name: 'Instagram', value: 15, color: '#10B981' },
    { name: 'LinkedIn', value: 10, color: '#F59E0B' }
  ];

  const kpis = [
    {
      title: "ROI Geral",
      value: "340%",
      change: "+15%",
      trend: "up",
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      title: "CPA Médio",
      value: "R$ 45",
      change: "-8%",
      trend: "down",
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      title: "Taxa de Conversão",
      value: "3.2%",
      change: "+0.5%",
      trend: "up",
      icon: ShoppingCart,
      color: "text-green-600"
    },
    {
      title: "CTR Médio",
      value: "2.8%",
      change: "-0.2%",
      trend: "down",
      icon: MousePointer,
      color: "text-red-600"
    }
  ];

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600 mt-1">Análise detalhada de performance</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select defaultValue="30">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="shadow-lg border-none">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{kpi.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                    <div className={`flex items-center gap-1 text-sm mt-1 ${kpi.color}`}>
                      {kpi.trend === 'up' ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span>{kpi.change}</span>
                    </div>
                  </div>
                  <kpi.icon className={`w-8 h-8 ${kpi.color.replace('text-', 'text-').split('-')[1] === 'green' ? 'text-green-500' : 'text-red-500'}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de performance */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                Performance Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="impressions" fill="#3B82F6" name="Impressões" />
                  <Bar dataKey="clicks" fill="#8B5CF6" name="Cliques" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Distribuição por canal */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-purple-500" />
                Distribuição por Canal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center mb-6">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={channelData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {channelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-3">
                {channelData.map((channel) => (
                  <div key={channel.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: channel.color }}
                      ></div>
                      <span className="text-sm text-gray-700">{channel.name}</span>
                    </div>
                    <span className="font-semibold">{channel.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Gráfico de conversões */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Tendência de Conversões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="conversions" 
                  stroke="#10B981" 
                  strokeWidth={3} 
                  name="Conversões"
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Insights e recomendações */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-orange-500" />
              Insights & Recomendações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">📈 Performance Positiva</h4>
                <p className="text-sm text-green-700">
                  Suas campanhas no Google Ads estão 15% acima da média do setor. Continue investindo neste canal.
                </p>
              </div>
              
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Atenção Necessária</h4>
                <p className="text-sm text-yellow-700">
                  O CTR do Facebook diminuiu. Considere testar novos criativos ou ajustar o público-alvo.
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">💡 Oportunidade</h4>
                <p className="text-sm text-blue-700">
                  LinkedIn mostra potencial de crescimento. Teste aumentar o orçamento em 20%.
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-2">🎯 Meta do Mês</h4>
                <p className="text-sm text-purple-700">
                  Você está 78% perto da meta de conversões. Faltam apenas 25 conversões.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
