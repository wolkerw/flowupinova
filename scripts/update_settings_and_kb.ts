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
    creditLinkYearly: "https://www.asaas.com/c/nei7jpqtx5n8wtuj",
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

4. **Plano Anual Especial (13 Meses - Melhor Custo-Benefício)**: Total de R$ 4.800,00
   - Parcele em até **12x de R$ 400,00 sem juros** no Cartão de Crédito.
   - Você ganha 1 mês bônus (13 meses de acesso completo pelo valor de 12).
   - Link de Pagamento: https://www.asaas.com/c/nei7jpqtx5n8wtuj

### Instruções para a Maia ao atender clientes:
- Quando o cliente demonstrar interesse em assinar ou perguntar sobre valores e formas de pagamento, apresente os planos com clareza e cordialidade.
- Destaque que todos os planos podem ser parcelados no cartão de crédito sem juros (até 12x no plano anual).
- Envie o link de pagamento correspondente ao plano que o cliente desejar.
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
