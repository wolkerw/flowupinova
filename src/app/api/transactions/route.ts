import { NextResponse, type NextRequest } from "next/server";
import { admin, adminDb } from "@/lib/firebase-admin";
import { validateAdminToken } from "@/lib/admin-auth";
import { getAuthenticatedUser } from "@/lib/api-auth";
import nodemailer from "nodemailer";

export const maxDuration = 60;

// Configuração do transporter do nodemailer baseado em variáveis de ambiente
const getTransporter = () => {
  const host = process.env.SMTP_HOST || "";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";

  if (!host || !user || !pass) {
    console.warn(
      "[TRANSACTIONS] SMTP não configurado completamente. Notificações por e-mail ficarão inativas."
    );
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
};

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    // Action: Enviar Comprovante de Pagamento (Usuário autenticado)
    if (!action || action === "submit-receipt") {
      const authUser = await getAuthenticatedUser(request);
      if (!authUser) {
        return NextResponse.json(
          { error: "Autenticação obrigatória para enviar comprovante." },
          { status: 401 }
        );
      }

      const { userId, plan, method, receiptUrl } = await request.json();

      if (!userId || !plan || !method || !receiptUrl) {
        return NextResponse.json(
          { error: "Campos obrigatórios ausentes: userId, plan, method, receiptUrl." },
          { status: 400 }
        );
      }

      if (authUser.uid !== userId && !authUser.isAdmin) {
        return NextResponse.json(
          { error: "Não autorizado: o ID de usuário não corresponde ao usuário autenticado." },
          { status: 403 }
        );
      }

      console.log(
        `[TRANSACTIONS] Recebendo comprovante para o usuário ${userId}, plano ${plan}, método ${method}...`
      );

      // 1. Buscar dados do usuário no Firestore para enriquecer a transação e e-mail
      let userEmail = "Não informado";
      let userName = "Não informado";
      try {
        const userSnap = await adminDb.collection("users").doc(userId).get();
        if (userSnap.exists) {
          const userData = userSnap.data();
          userEmail = userData?.email || "Não informado";
          userName = userData?.displayName || userData?.name || "Não informado";
        }
      } catch (userErr) {
        console.warn("[TRANSACTIONS] Erro ao buscar dados do usuário no Firestore:", userErr);
      }

      // 2. Criar a transação no Firestore
      const transactionRef = adminDb.collection("transactions").doc();
      const transactionId = transactionRef.id;
      const price = plan === "mensal" ? 49.9 : 399.9;

      await transactionRef.set({
        id: transactionId,
        userId,
        userName,
        userEmail,
        plan,
        price,
        method,
        receiptUrl,
        status: "pending_verification",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 3. Atualizar status de assinatura temporário do usuário no Firestore
      const userDocRef = adminDb.collection("users").doc(userId);
      await userDocRef.set(
        {
          subscriptionStatus: "pending_verification",
          subscriptionPlan: plan,
        },
        { merge: true }
      );

      // 4. Enviar e-mail de notificação para o administrador PJ
      const transporter = getTransporter();
      const adminEmail = process.env.ADMIN_EMAIL || "admin@numvapt.com.br";

      if (transporter) {
        try {
          const emailSubject = `[NumVapt] Novo Comprovante Enviado - ${userName}`;
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
              <h2 style="color: #ff0055; border-bottom: 2px solid #ff0055; padding-bottom: 10px;">Novo Comprovante de Pagamento Recebido 🚀</h2>
              <p>Olá Administrador,</p>
              <p>O usuário <strong>${userName}</strong> (${userEmail}) acabou de enviar um comprovante de pagamento para validação manual.</p>
              
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">ID do Usuário:</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${userId}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Plano Selecionado:</td>
                  <td style="padding: 10px; border: 1px solid #ddd; text-transform: capitalize;">${plan}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Preço:</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">R$ ${price.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Forma de Pagamento:</td>
                  <td style="padding: 10px; border: 1px solid #ddd; text-transform: uppercase;">${method}</td>
                </tr>
              </table>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${receiptUrl}" target="_blank" style="background-color: #ff0055; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Visualizar Comprovante</a>
              </div>

              <p style="font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 10px; margin-top: 20px;">
                Acesse o painel administrativo do Firebase ou NumVapt para confirmar o recebimento em sua conta PJ e aprovar a transação.
              </p>
            </div>
          `;

          await transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME || "NumVapt Pagamentos"}" <${process.env.SMTP_USER}>`,
            to: adminEmail,
            subject: emailSubject,
            html: emailHtml,
          });

          console.log(
            `[TRANSACTIONS] E-mail de notificação enviado com sucesso para ${adminEmail}.`
          );
        } catch (emailErr) {
          console.error("[TRANSACTIONS] Erro ao enviar e-mail de notificação:", emailErr);
        }
      }

      return NextResponse.json({
        success: true,
        transactionId: transactionId,
        message: "Comprovante enviado com sucesso para validação.",
      });
    }

    // Action: Atualizar Status de Transação (Apenas Administradores)
    if (action === "update-status") {
      const authHeader = request.headers.get("authorization");
      const token =
        authHeader?.replace(/^Bearer /i, "") ||
        request.cookies.get("firebase-id-token")?.value ||
        null;

      const adminUser = await validateAdminToken(token);
      if (!adminUser) {
        return NextResponse.json(
          { error: "Acesso negado: apenas administradores podem atualizar transações." },
          { status: 403 }
        );
      }

      const { transactionId, status } = await request.json();

      if (!transactionId || !status || !["approved", "rejected"].includes(status)) {
        return NextResponse.json(
          { error: "transactionId ou status ('approved' | 'rejected') inválidos." },
          { status: 400 }
        );
      }

      console.log(
        `[TRANSACTIONS_ADMIN] Atualizando transação ${transactionId} para o status ${status}...`
      );

      // 1. Obter a transação para saber qual o userId e plano
      const transactionDocRef = adminDb.collection("transactions").doc(transactionId);
      const transSnap = await transactionDocRef.get();

      if (!transSnap.exists) {
        return NextResponse.json({ error: "Transação não encontrada." }, { status: 404 });
      }

      const transData = transSnap.data();
      const userId = transData?.userId;
      const plan = transData?.plan || "mensal";

      if (!userId) {
        return NextResponse.json({ error: "UserId não encontrado na transação." }, { status: 400 });
      }

      // 2. Atualizar transação no Firestore
      await transactionDocRef.set(
        {
          status,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // 3. Atualizar a Role e Status do Usuário no Firestore
      const userDocRef = adminDb.collection("users").doc(userId);
      if (status === "approved") {
        const now = new Date();
        const durationDays = plan === "anual" ? 365 : 30;
        const expirationDate = new Date();
        expirationDate.setDate(now.getDate() + durationDays);

        await userDocRef.set(
          {
            role: "pro",
            subscriptionStatus: "active",
            subscriptionPlan: plan,
            subscriptionExpiresAt: admin.firestore.Timestamp.fromDate(expirationDate),
          },
          { merge: true }
        );
        console.log(`[TRANSACTIONS_ADMIN] Usuário ${userId} atualizado para Pro com sucesso!`);
      } else {
        await userDocRef.set(
          {
            role: "free",
            subscriptionStatus: "inactive",
            subscriptionPlan: null,
            subscriptionExpiresAt: null,
          },
          { merge: true }
        );
        console.log(`[TRANSACTIONS_ADMIN] Inscrição do usuário ${userId} rejeitada.`);
      }

      return NextResponse.json({
        success: true,
        message: `Status da transação atualizado para ${status} com sucesso.`,
      });
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (error: any) {
    console.error("[TRANSACTIONS_ERROR] Erro no endpoint de transações:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao processar transações.", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    // Action: Obter Configurações PJ de Pagamento (Público)
    if (!action || action === "get-settings") {
      console.log("[TRANSACTIONS] Buscando configurações PJ de pagamento no Firestore...");
      try {
        const settingsSnap = await adminDb.collection("settings").doc("payment").get();
        if (settingsSnap.exists) {
          const settingsData = settingsSnap.data();
          return NextResponse.json({
            success: true,
            settings: {
              pixKey: settingsData?.pixKey || "pix@numvapt.com.br",
              pixQrCodeUrl: settingsData?.pixQrCodeUrl || "",
              creditLinkMonthly: settingsData?.creditLinkMonthly || "",
              creditLinkYearly: settingsData?.creditLinkYearly || "",
            },
          });
        }
      } catch (fsErr) {
        console.warn(
          "[TRANSACTIONS] Erro ao carregar configurações de pagamento no Firestore, usando fallback:",
          fsErr
        );
      }

      // Fallback padrão se não houver documento criado no Firestore
      return NextResponse.json({
        success: true,
        settings: {
          pixKey: "pix@numvapt.com.br",
          pixQrCodeUrl: "",
          creditLinkMonthly: "https://payment.pagar.me/mensal-exemplo",
          creditLinkYearly: "https://payment.pagar.me/anual-exemplo",
        },
      });
    }

    // Action: Listar Transações Pendentes (Apenas Administradores)
    if (action === "list-pending") {
      const authHeader = request.headers.get("authorization");
      const token =
        authHeader?.replace(/^Bearer /i, "") ||
        request.cookies.get("firebase-id-token")?.value ||
        null;

      const adminUser = await validateAdminToken(token);
      if (!adminUser) {
        return NextResponse.json(
          { error: "Acesso negado: apenas administradores podem listar transações pendentes." },
          { status: 403 }
        );
      }

      console.log("[TRANSACTIONS_ADMIN] Listando transações pendentes de validação...");
      const snapshot = await adminDb
        .collection("transactions")
        .where("status", "==", "pending_verification")
        .orderBy("createdAt", "desc")
        .get();

      const transactions: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        transactions.push({
          ...data,
          createdAt: data.createdAt?.toDate()?.toISOString() || null,
          updatedAt: data.updatedAt?.toDate()?.toISOString() || null,
        });
      });

      return NextResponse.json({
        success: true,
        transactions,
      });
    }

    return NextResponse.json({ error: "Ação GET inválida." }, { status: 400 });
  } catch (error: any) {
    console.error("[TRANSACTIONS_GET_ERROR] Erro:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
