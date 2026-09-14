import fs from "fs";

// Carregar .env.local manualmente
const envContent = fs.readFileSync(".env.local", "utf8");
for (const line of envContent.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
    const idx = trimmed.indexOf("=");
    const key = trimmed.substring(0, idx).trim();
    const val = trimmed.substring(idx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

import { admin, adminDb } from "../src/lib/firebase-admin";

async function updateData() {
  const asaasLinks = {
    creditLinkMonthly: "https://www.asaas.com/c/53kbnhb6f1hvcmfa",
    creditLinkTrimestral: "https://www.asaas.com/c/1o32ken4bfjqrbo0",
    creditLinkSemestral: "https://www.asaas.com/c/lopf5rrhwt7dkr4e",
    creditLinkYearly: "https://www.asaas.com/c/2unkh9p3t6apkcvm",
    creditLinkYearlyRecurrent: "https://www.asaas.com/c/2unkh9p3t6apkcvm",
    pixKey: "d696cfdb-a875-4219-ae41-494a619a9e00",
    gateway: "asaas",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  // 1. Atualizar settings/payment
  await adminDb.collection("settings").doc("payment").set(asaasLinks, { merge: true });
  console.log("Documento settings/payment atualizado no Firestore!");

  // 2. Atualizar Base de Conhecimento da Maia (Central de Informações)
  const knowledgeContent = `
# Planos e Pagamento com Cartão de Crédito (Asaas) - NumVapt

A NumVapt oferece planos flexíveis com pagamento 100% seguro via Cartão de Crédito e Pix processados pelo gateway Asaas:

1. **Plano Mensal**: R$ 490,00/mês
   - Link de Pagamento: https://www.asaas.com/c/53kbnhb6f1hvcmfa
   - Pagamento à vista no Cartão de Crédito ou Pix.

2. **Plano Trimestral (10% OFF)**: Total de R$ 1.323,00
   - Parcele em até **3x de R$ 441,00 sem juros** no Cartão de Crédito.
   - Link de Pagamento: https://www.asaas.com/c/1o32ken4bfjqrbo0

3. **Plano Semestral (15% OFF)**: Total de R$ 2.499,00
   - Parcele em até **6x de R$ 416,50 sem juros** no Cartão de Crédito.
   - Link de Pagamento: https://www.asaas.com/c/lopf5rrhwt7dkr4e

4. **Plano Anual com Cobrança Mensal no Cartão (+ 1 Mês Grátis)**: R$ 400,00/mês
   - **Vantagem exclusiva**: O valor de R$ 400 é debitado mensalmente no cartão e **NÃO compromete o limite total de R$ 4.800** do cliente!
   - O cliente tem todos os benefícios do plano anual pagando apenas R$ 400 por mês no cartão.
   - **Bônus especial**: Ganha o **13º mês grátis** (+ 1 mês grátis na assinatura).
   - Link de Pagamento Oficial: https://www.asaas.com/c/2unkh9p3t6apkcvm

### Instruções para a Maia ao atender clientes:
- Quando o cliente demonstrar interesse em assinar ou perguntar sobre valores e formas de pagamento, apresente os planos com clareza e cordialidade.
- Para o plano Anual, ofereça **exclusivamente** a modalidade de **Mensal no Cartão por R$ 400,00/mês** (+ 1 mês grátis). Enfatize que o cliente não precisa comprometer o limite total do cartão, pois é cobrado mês a mês!
- Envie o link de pagamento correspondente ao plano que o cliente desejar:
  - Mensal: https://www.asaas.com/c/53kbnhb6f1hvcmfa
  - Trimestral: https://www.asaas.com/c/1o32ken4bfjqrbo0
  - Semestral: https://www.asaas.com/c/lopf5rrhwt7dkr4e
  - Anual (Mensal no Cartão + 1 Mês Grátis): https://www.asaas.com/c/2unkh9p3t6apkcvm
- A liberação da conta na plataforma é imediata e automática assim que o pagamento for aprovado pelo Asaas!
`.trim();

  await adminDb.collection("knowledge_base").doc("planos-pagamentos-asaas").set(
    {
      title: "Planos e Pagamento Cartão de Crédito (Asaas)",
      category: "planos",
      content: knowledgeContent,
      tags: [
        "planos",
        "preços",
        "pagamento",
        "cartão",
        "asaas",
        "parcelamento",
        "mensal",
        "anual",
        "trimestral",
        "semestral",
      ],
      isActive: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log("Base de Conhecimento da Maia atualizada com sucesso no Firestore!");
  process.exit(0);
}

updateData().catch((err) => {
  console.error("Erro ao atualizar dados:", err);
  process.exit(1);
});
