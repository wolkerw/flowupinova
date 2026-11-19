const fs = require('fs');

// Read .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx > -1 && !line.startsWith('#')) {
    env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
});

const apiKey = env.ASAAS_API_KEY;
if (!apiKey) {
  console.error("ASAAS_API_KEY não encontrada no .env.local");
  process.exit(1);
}

const DISCOUNTS = [10, 15, 20, 25, 30];

const PLANS = [
  {
    planKey: "mensal",
    displayName: "NumVapt Pro - Plano Mensal",
    basePrice: 490.00,
    chargeType: "DETACHED",
    isRecurrent: false,
    description: (pct, val) => `Assinatura Mensal NumVapt com ${pct}% de desconto promocional aplicado (R$ ${val.toFixed(2).replace('.', ',')} avulso no cartão).`
  },
  {
    planKey: "trimestral",
    displayName: "NumVapt Pro - Plano Trimestral (Cobrança Mensal)",
    basePrice: 441.00,
    chargeType: "RECURRENT",
    isRecurrent: true,
    description: (pct, val) => `Plano Trimestral NumVapt com ${pct}% de desconto promocional (apenas R$ ${val.toFixed(2).replace('.', ',')}/mês no cartão recorrente sem travar limite total).`
  },
  {
    planKey: "semestral",
    displayName: "NumVapt Pro - Plano Semestral (Cobrança Mensal)",
    basePrice: 416.50,
    chargeType: "RECURRENT",
    isRecurrent: true,
    description: (pct, val) => `Plano Semestral NumVapt com ${pct}% de desconto promocional (apenas R$ ${val.toFixed(2).replace('.', ',')}/mês no cartão recorrente sem travar limite total).`
  },
  {
    planKey: "anual",
    displayName: "NumVapt Pro - Plano Anual (+1 Mês Grátis | Cobrança Mensal)",
    basePrice: 399.00,
    chargeType: "RECURRENT",
    isRecurrent: true,
    description: (pct, val) => `Plano Anual NumVapt (+1 mês bônus grátis) com ${pct}% de desconto promocional (apenas R$ ${val.toFixed(2).replace('.', ',')}/mês no cartão recorrente sem travar limite total).`
  },
  {
    planKey: "tudo_pronto",
    displayName: "NumVapt Pro - Módulo Tudo Pronto (Cobrança Mensal)",
    basePrice: 699.00,
    chargeType: "RECURRENT",
    isRecurrent: true,
    description: (pct, val) => `Execução VIP completa NumVapt Tudo Pronto com ${pct}% de desconto promocional (apenas R$ ${val.toFixed(2).replace('.', ',')}/mês no cartão recorrente sem travar limite total).`
  }
];

// Helper para calcular valores arredondados em 2 casas
function calculateDiscountPrice(base, pct) {
  const finalVal = base * (1 - pct / 100);
  return Math.round(finalVal * 100) / 100;
}

// Pequeno delay entre requisições para respeitar rate limiting do Asaas
const sleep = (ms) => new Promise(res => setTimeout(res, ms));

async function createPaymentLink(payload) {
  const res = await fetch("https://api.asaas.com/v3/paymentLinks", {
    method: "POST",
    headers: {
      "access_token": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Asaas API error (${res.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  console.log("🚀 Iniciando geração dos 25 Links Oficiais no Asaas...");
  const results = [];

  for (const plan of PLANS) {
    for (const discount of DISCOUNTS) {
      const finalPrice = calculateDiscountPrice(plan.basePrice, discount);
      const name = `${plan.displayName} - ${discount}% OFF`;
      const description = plan.description(discount, finalPrice);
      const externalRef = `coupon_link:${plan.planKey}:${discount}pct`;

      // Se for Tudo Pronto 20% OFF e já existe o link oficial da empresa:
      if (plan.planKey === "tudo_pronto" && discount === 20) {
        console.log(`ℹ️ [REUTILIZANDO LINK OFICIAL JÁ EXISTENTE] Tudo Pronto 20% OFF: l476dddo1yo84fj4`);
        results.push({
          plan: plan.planKey,
          discountPercentage: discount,
          finalValue: 559.20,
          id: "l476dddo1yo84fj4",
          url: "https://www.asaas.com/c/l476dddo1yo84fj4",
          chargeType: "RECURRENT",
          subscriptionCycle: "MONTHLY",
          name: "NumVapt_TudoPronto_20%"
        });
        continue;
      }

      const payload = {
        name,
        description,
        value: finalPrice,
        billingType: "CREDIT_CARD",
        chargeType: plan.chargeType,
        subscriptionCycle: plan.isRecurrent ? "MONTHLY" : undefined,
        maxInstallmentCount: 1,
        dueDateLimitDays: plan.isRecurrent ? 0 : 3,
        notificationEnabled: true,
        externalReference: externalRef
      };

      try {
        console.log(`⏳ Criando link: ${plan.planKey} (${discount}% OFF) -> R$ ${finalPrice.toFixed(2)} [${plan.chargeType}]...`);
        const created = await createPaymentLink(payload);
        const url = created.url || `https://www.asaas.com/c/${created.id}`;
        console.log(`✅ Sucesso! ID: ${created.id} | URL: ${url}`);

        results.push({
          plan: plan.planKey,
          discountPercentage: discount,
          finalValue: finalPrice,
          id: created.id,
          url: url,
          chargeType: plan.chargeType,
          subscriptionCycle: plan.isRecurrent ? "MONTHLY" : null,
          name: created.name
        });

        // Espera 300ms entre chamadas
        await sleep(300);
      } catch (err) {
        console.error(`❌ Erro ao criar ${plan.planKey} ${discount}%:`, err.message);
      }
    }
  }

  // Salvar registro
  fs.writeFileSync("docs/asaas_coupon_links.json", JSON.stringify(results, null, 2));
  console.log(`\n🎉 Concluído com sucesso! ${results.length} links cadastrados e salvos em docs/asaas_coupon_links.json`);
}

main().catch(console.error);
