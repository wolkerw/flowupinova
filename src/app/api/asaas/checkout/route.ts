import { NextResponse, type NextRequest } from "next/server";
import { admin, adminDb } from "@/lib/firebase-admin";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { AsaasService } from "@/lib/services/asaas-service";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: "Autenticação obrigatória para iniciar o checkout." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { plan, coupon } = body as {
      plan?: "mensal" | "trimestral" | "semestral" | "anual" | "anual_recorrente";
      coupon?: string;
    };

    if (!plan || !["mensal", "trimestral", "semestral", "anual", "anual_recorrente"].includes(plan)) {
      return NextResponse.json(
        { error: "Plano inválido. Selecione mensal, trimestral, semestral, anual ou anual_recorrente." },
        { status: 400 }
      );
    }

    // 1. Obter dados cadastrais do usuário no Firestore
    const userSnap = await adminDb.collection("users").doc(authUser.uid).get();
    const userData = userSnap.exists ? userSnap.data() : {};

    const userName = userData?.displayName || userData?.name || authUser.email?.split("@")[0] || "Cliente NumVapt";
    const userEmail = authUser.email || userData?.email || "";
    const userCpfCnpj = userData?.cnpj || userData?.cpf || userData?.businessProfile?.cnpj;
    const userPhone = userData?.phone || userData?.businessProfile?.phone || userData?.whatsapp;

    // 2. Configuração do Plano
    const planConfig = AsaasService.getPlanConfig(plan);
    let finalValue = planConfig.totalValue;
    let appliedDiscount = 0;
    let validCouponCode: string | null = null;

    // 3. Validar Cupom de Desconto se fornecido
    if (coupon && typeof coupon === "string") {
      const cleanCode = coupon.toUpperCase().trim();
      const couponDoc = await adminDb.collection("coupons").doc(cleanCode).get();

      if (couponDoc.exists) {
        const cData = couponDoc.data();
        const isNotExpired = !cData?.expiresAt || new Date() <= new Date(cData.expiresAt);
        if (cData?.active && isNotExpired && typeof cData.discountPercentage === "number") {
          appliedDiscount = cData.discountPercentage;
          validCouponCode = cleanCode;
          finalValue = Math.round((finalValue * (1 - appliedDiscount / 100)) * 100) / 100;
        }
      }
    }

    // 4. Cadastrar / Localizar Cliente no Asaas
    let asaasCustomer;
    try {
      asaasCustomer = await AsaasService.findOrCreateCustomer({
        name: userName,
        email: userEmail,
        cpfCnpj: userCpfCnpj,
        phone: userPhone,
        externalReference: authUser.uid,
      });
    } catch (custErr: any) {
      console.warn("[ASAAS_CHECKOUT] Aviso ao buscar/criar cliente:", custErr.message);
    }

    // 5. Criar Link de Pagamento no Asaas
    const externalReference = `${authUser.uid}:${plan}:${Date.now()}`;

    const paymentLink = await AsaasService.createPaymentLink({
      name: `${planConfig.name}${validCouponCode ? ` (Cupom: ${validCouponCode})` : ""}`,
      description: `${planConfig.description}${appliedDiscount > 0 ? ` Desconto de ${appliedDiscount}% aplicado.` : ""}`,
      value: finalValue,
      billingType: "CREDIT_CARD",
      chargeType: planConfig.chargeType,
      subscriptionCycle: (planConfig as any).subscriptionCycle,
      maxInstallmentCount: planConfig.installmentCount,
      dueDateLimitDays: 3,
      externalReference: externalReference,
      notificationEnabled: true,
    });

    // 6. Registrar a transação preliminar no Firestore
    const transactionRef = adminDb.collection("transactions").doc();
    await transactionRef.set({
      id: transactionRef.id,
      userId: authUser.uid,
      userName,
      userEmail,
      plan,
      price: finalValue,
      method: "credit_card",
      gateway: "asaas",
      asaasPaymentLinkId: paymentLink.id,
      asaasCustomerId: asaasCustomer?.id || null,
      externalReference,
      appliedCoupon: validCouponCode,
      discountPercentage: appliedDiscount,
      status: "pending_payment",
      checkoutUrl: paymentLink.url,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: paymentLink.url,
      paymentLinkId: paymentLink.id,
      transactionId: transactionRef.id,
      totalValue: finalValue,
      installments: planConfig.installmentCount,
    });
  } catch (error: any) {
    console.error("[ASAAS_CHECKOUT_ERROR] Falha ao processar checkout:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno ao gerar checkout no Asaas." },
      { status: 500 }
    );
  }
}
