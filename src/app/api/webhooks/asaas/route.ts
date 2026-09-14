import { NextResponse, type NextRequest } from "next/server";
import { admin, adminDb } from "@/lib/firebase-admin";
import type { AsaasWebhookPayload } from "@/lib/services/asaas-service";
import nodemailer from "nodemailer";

export const maxDuration = 60;

// Configuração do transporter de e-mail (opcional)
const getTransporter = () => {
  const host = process.env.SMTP_HOST || "";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

export async function POST(request: NextRequest) {
  try {
    // 1. Verificação de Segurança (Token do Webhook Asaas)
    const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;
    const receivedToken = request.headers.get("asaas-access-token");

    if (webhookToken && receivedToken && receivedToken !== webhookToken) {
      console.warn("[ASAAS_WEBHOOK] Token inválido recebido:", receivedToken);
      return NextResponse.json({ error: "Token de webhook não autorizado." }, { status: 401 });
    }

    const payload = (await request.json()) as AsaasWebhookPayload;
    const { event, payment } = payload;

    console.log(`[ASAAS_WEBHOOK] Evento recebido: ${event} | Cobrança: ${payment?.id} | Valor: R$ ${payment?.value}`);

    if (!payment || !event) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }

    // Identificar usuário e plano a partir do externalReference (formato userId:plan:timestamp)
    let userId = "";
    let plan = "mensal";

    if (payment.externalReference) {
      const parts = payment.externalReference.split(":");
      if (parts.length >= 2) {
        userId = parts[0];
        plan = parts[1];
      }
    }

    // Se não veio pelo externalReference, tentar localizar na coleção transactions pelo paymentLink ou customer
    if (!userId && payment.paymentLink) {
      const transQuery = await adminDb
        .collection("transactions")
        .where("asaasPaymentLinkId", "==", payment.paymentLink)
        .limit(1)
        .get();

      if (!transQuery.empty) {
        const transDoc = transQuery.docs[0].data();
        userId = transDoc.userId;
        plan = transDoc.plan || "mensal";
      }
    }

    // Tratar eventos de Confirmação ou Recebimento de Pagamento
    if (event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED") {
      console.log(`[ASAAS_WEBHOOK] Pagamento Aprovado para usuário ${userId || "desconhecido"}, plano ${plan}.`);

      // 1. Se identificamos o usuário, ativar assinatura Pro
      if (userId) {
        let durationDays = 30;
        if (plan === "trimestral") durationDays = 90;
        else if (plan === "semestral") durationDays = 180;
        else if (plan === "anual") durationDays = 395;
        else if (plan === "anual_recorrente") durationDays = 30;

        const userDocRef = adminDb.collection("users").doc(userId);
        const userDocSnap = await userDocRef.get();
        const currentData = userDocSnap.exists ? userDocSnap.data() : null;

        // Se já tiver uma expiração válida no futuro, soma os dias a partir dela (renovação contínua)
        let baseDate = new Date();
        if (currentData?.subscriptionExpiresAt) {
          const currentExp = currentData.subscriptionExpiresAt.toDate ? currentData.subscriptionExpiresAt.toDate() : new Date(currentData.subscriptionExpiresAt);
          if (currentExp > baseDate) {
            baseDate = currentExp;
          }
        }

        const expirationDate = new Date(baseDate);
        expirationDate.setDate(expirationDate.getDate() + durationDays);

        await userDocRef.set(
          {
            role: "pro",
            subscriptionStatus: "active",
            subscriptionPlan: plan === "anual_recorrente" ? "anual" : plan,
            billingCycle: plan === "anual_recorrente" ? "monthly_recurrent" : "standard",
            subscriptionExpiresAt: admin.firestore.Timestamp.fromDate(expirationDate),
            asaasCustomerId: payment.customer || null,
            lastPaymentId: payment.id,
            lastPaymentMethod: payment.billingType?.toLowerCase() || "credit_card",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        console.log(`[ASAAS_WEBHOOK] Usuário ${userId} ativado/renovado como PRO com sucesso até ${expirationDate.toISOString()}.`);
      }

      // 2. Registrar ou Atualizar Transação
      const transactionRef = adminDb.collection("transactions").doc(`asaas_${payment.id}`);
      await transactionRef.set(
        {
          id: `asaas_${payment.id}`,
          asaasPaymentId: payment.id,
          userId: userId || null,
          plan,
          price: payment.value,
          netValue: payment.netValue || payment.value,
          method: payment.billingType?.toLowerCase() || "credit_card",
          gateway: "asaas",
          status: "approved",
          customer: payment.customer,
          paymentLink: payment.paymentLink || null,
          externalReference: payment.externalReference || null,
          creditCardBrand: payment.creditCard?.creditCardBrand || null,
          confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // 3. Notificação por e-mail para o Administrador
      const transporter = getTransporter();
      const adminEmail = process.env.ADMIN_EMAIL || "flowupinova@gmail.com";

      if (transporter) {
        try {
          const emailSubject = `[NumVapt] Pagamento Confirmado no Asaas - R$ ${payment.value?.toFixed(2)}`;
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
              <h2 style="color: #0083C7; border-bottom: 2px solid #0083C7; padding-bottom: 10px;">Pagamento Confirmado no Asaas 🚀</h2>
              <p>Uma nova assinatura foi confirmada automaticamente via Cartão de Crédito/Asaas.</p>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">ID do Pagamento:</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${payment.id}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">ID do Usuário:</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${userId || "Não identificado"}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Plano:</td>
                  <td style="padding: 10px; border: 1px solid #ddd; text-transform: capitalize;">${plan}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Valor:</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">R$ ${payment.value?.toFixed(2)}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Método:</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${payment.billingType}</td>
                </tr>
              </table>
            </div>
          `;

          await transporter.sendMail({
            from: `"NumVapt Notificações" <${process.env.SMTP_USER}>`,
            to: adminEmail,
            subject: emailSubject,
            html: emailHtml,
          });
        } catch (mailErr) {
          console.warn("[ASAAS_WEBHOOK] Falha ao enviar e-mail de notificação:", mailErr);
        }
      }
    }

    // Tratar eventos de Estorno ou Reembolso
    else if (event === "PAYMENT_REFUNDED" || event === "PAYMENT_CHARGEBACK_REQUESTED") {
      console.warn(`[ASAAS_WEBHOOK] Pagamento ${payment.id} foi reembolsado/estornado.`);
      if (userId) {
        await adminDb.collection("users").doc(userId).set(
          {
            role: "free",
            subscriptionStatus: "inactive",
            subscriptionPlan: null,
            subscriptionExpiresAt: null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }

      await adminDb.collection("transactions").doc(`asaas_${payment.id}`).set(
        {
          status: "refunded",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    return NextResponse.json({ success: true, event, paymentId: payment.id });
  } catch (error: any) {
    console.error("[ASAAS_WEBHOOK_ERROR] Erro ao processar webhook:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar webhook Asaas", details: error.message },
      { status: 500 }
    );
  }
}
