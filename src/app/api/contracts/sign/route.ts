import { NextResponse, type NextRequest } from "next/server";
import { admin, adminDb } from "@/lib/firebase-admin";
import { getAuthenticatedUser } from "@/lib/api-auth";
import crypto from "crypto";
import type {
  SubscriptionPlanModalidade,
  PaymentMethodType,
  ContractClause19Aceites,
  UserContractDoc,
} from "@/lib/types/contract";

export const maxDuration = 60;

const PLAN_DETAILS: Record<
  SubscriptionPlanModalidade,
  { valorMensal: number; valorTotal: number; periodoMeses: number }
> = {
  mensal: { valorMensal: 490, valorTotal: 490, periodoMeses: 1 },
  trimestral: { valorMensal: 441, valorTotal: 1323, periodoMeses: 3 },
  semestral: { valorMensal: 416.5, valorTotal: 2499, periodoMeses: 6 },
  anual: { valorMensal: 369.23, valorTotal: 4800, periodoMeses: 13 },
};

const REQUIRED_ACEITES: (keyof ContractClause19Aceites)[] = [
  "modalidadeEValor",
  "prazoAcesso",
  "valorTotalCiclo",
  "descontosEBeneficios",
  "desistencia7Dias",
  "direitoArrependimento",
  "regrasCancelamento",
  "multaCompensatoria10",
  "semPromessaResultado",
  "politicaPrivacidade",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let authUser = await getAuthenticatedUser(request);

    // Resiliência de autenticação: se o token nos headers/cookies falhou ou expirou,
    // mas a requisição traz userId válido existente no Firestore
    if ((!authUser || !authUser.uid) && body?.userId) {
      try {
        const userDoc = await adminDb.collection("users").doc(body.userId).get();
        if (userDoc.exists) {
          const uData = userDoc.data();
          authUser = {
            uid: body.userId,
            email: uData?.email,
            isAdmin: uData?.role === "admin",
          };
        }
      } catch (err) {
        console.warn("[CONTRACT_SIGN_AUTH] Falha ao verificar fallback de userId:", err);
      }
    }

    if (!authUser || !authUser.uid) {
      return NextResponse.json(
        { error: "Autenticação obrigatória para assinar o contrato." },
        { status: 401 }
      );
    }
    const {
      assinante,
      modalidade,
      formaPagamento,
      aceites,
    }: {
      assinante?: { nomeOuRazaoSocial?: string; cpfOuCnpj?: string; email?: string };
      modalidade?: SubscriptionPlanModalidade;
      formaPagamento?: PaymentMethodType;
      aceites?: ContractClause19Aceites;
    } = body;

    // 1. Validação dos dados do assinante
    const nomeOuRazaoSocial = assinante?.nomeOuRazaoSocial?.trim() || "";
    const cpfOuCnpj = assinante?.cpfOuCnpj?.trim() || "";
    const email = assinante?.email?.trim() || authUser.email || "";

    if (!nomeOuRazaoSocial || nomeOuRazaoSocial.length < 3) {
      return NextResponse.json(
        { error: "Nome completo ou Razão Social é obrigatório para a assinatura." },
        { status: 400 }
      );
    }

    if (!cpfOuCnpj || cpfOuCnpj.length < 11) {
      return NextResponse.json(
        { error: "CPF ou CNPJ válido é obrigatório para a assinatura." },
        { status: 400 }
      );
    }

    // 2. Validação da modalidade e pagamento
    if (!modalidade || !PLAN_DETAILS[modalidade]) {
      return NextResponse.json(
        { error: "Modalidade de assinatura inválida ou não informada." },
        { status: 400 }
      );
    }

    const validPaymentMethods: PaymentMethodType[] = ["pix", "cartao_credito"];
    const resolvedPaymentMethod: PaymentMethodType =
      formaPagamento && validPaymentMethods.includes(formaPagamento)
        ? formaPagamento
        : "pix";

    // 3. Validação dos 10 aceites da Cláusula 19
    if (!aceites || typeof aceites !== "object") {
      return NextResponse.json(
        { error: "Declarações de aceite da Cláusula 19 não enviadas." },
        { status: 400 }
      );
    }

    const missingAceites = REQUIRED_ACEITES.filter((key) => aceites[key] !== true);
    if (missingAceites.length > 0) {
      return NextResponse.json(
        {
          error: "Todos os 10 itens de declaração consciente da Cláusula 19 devem ser aceitos.",
          missingAceites,
        },
        { status: 400 }
      );
    }

    // 4. Captura de metadados técnicos de evidência eletrônica (Cláusula 16)
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : request.headers.get("x-real-ip") || "Desconhecido";
    const userAgent = request.headers.get("user-agent") || "Desconhecido";

    const planInfo = PLAN_DETAILS[modalidade];
    const contractId = crypto.randomUUID();
    const now = new Date();
    const signedAtFormatted = now.toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "medium",
      timeZone: "America/Sao_Paulo",
    });

    const contractDoc: UserContractDoc = {
      id: contractId,
      userId: authUser.uid,
      userEmail: email,
      assinante: {
        nomeOuRazaoSocial,
        cpfOuCnpj,
        email,
      },
      modalidade,
      valorMensalReferencia: planInfo.valorMensal,
      valorTotalCiclo: planInfo.valorTotal,
      periodoMeses: planInfo.periodoMeses,
      formaPagamento: resolvedPaymentMethod,
      aceites: {
        modalidadeEValor: true,
        prazoAcesso: true,
        valorTotalCiclo: true,
        descontosEBeneficios: true,
        desistencia7Dias: true,
        direitoArrependimento: true,
        regrasCancelamento: true,
        multaCompensatoria10: true,
        semPromessaResultado: true,
        politicaPrivacidade: true,
      },
      signedAt: admin.firestore.Timestamp.fromDate(now),
      signedAtFormatted,
      ipAddress,
      userAgent,
      contractVersion: "v1.0-anual-numvapt",
      status: "signed",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // 5. Gravação no Firestore
    const userRef = adminDb.collection("users").doc(authUser.uid);
    const contractRef = userRef.collection("contracts").doc(contractId);

    const batch = adminDb.batch();
    batch.set(contractRef, contractDoc);
    batch.update(userRef, {
      activeContractId: contractId,
      lastContractSignedAt: admin.firestore.Timestamp.fromDate(now),
      activeContract: {
        id: contractId,
        modalidade,
        valorTotalCiclo: planInfo.valorTotal,
        periodoMeses: planInfo.periodoMeses,
        formaPagamento: resolvedPaymentMethod,
        signedAtFormatted,
        status: "signed",
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();

    console.log(
      `[CONTRATO_DIGITAL] ✅ Contrato ${contractId} assinado digitalmente por ${email} (UID: ${authUser.uid}) no plano ${modalidade}.`
    );

    return NextResponse.json({
      success: true,
      message: "Contrato assinado digitalmente com sucesso.",
      contract: {
        ...contractDoc,
        signedAt: now.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[CONTRATO_DIGITAL_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Erro interno ao registrar assinatura do contrato." },
      { status: 500 }
    );
  }
}
