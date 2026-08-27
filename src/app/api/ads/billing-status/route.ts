import { NextResponse, type NextRequest } from "next/server";
import { getUidFromCookie } from "@/lib/firebase-admin";
import {
  getMetaConnectionAdmin,
  updateMetaConnectionAdmin,
} from "@/lib/services/meta-service-admin";

export async function GET(request: NextRequest) {
  try {
    const uid = await getUidFromCookie();
    const metaConnection = await getMetaConnectionAdmin(uid);

    if (!metaConnection.isConnected && !metaConnection.pending) {
      return NextResponse.json(
        { success: false, error: "Meta account not connected." },
        { status: 403 }
      );
    }

    const adAccountId = metaConnection.adAccountId;
    if (!adAccountId) {
      return NextResponse.json({
        success: true,
        billing: {
          adAccountId: "",
          adAccountName: "",
          currency: "BRL",
          accountStatus: 0,
          disableReason: 0,
          hasPaymentMethod: false,
          balance: 0,
          fundingSourceDetails: null,
          error: "Nenhuma conta de anúncios selecionada nas configurações.",
        },
      });
    }

    const token = metaConnection.userAccessToken || metaConnection.accessToken;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Meta access token not found." },
        { status: 401 }
      );
    }

    const cleanAdAccountId = adAccountId.replace("act_", "");
    const url = `https://graph.facebook.com/v24.0/act_${cleanAdAccountId}?fields=funding_source,funding_source_details,balance,currency,account_status,disable_reason,business,amount_spent,is_prepay_account&access_token=${token}`;

    const res = await fetch(url);
    const resData: any = await res.json();

    if (!res.ok) {
      console.error("[API_ADS_BILLING_STATUS] Meta API Error:", resData.error);
      return NextResponse.json({
        success: true,
        billing: {
          adAccountId,
          adAccountName: metaConnection.adAccountName || "",
          currency: "BRL",
          accountStatus: 0,
          disableReason: 0,
          hasPaymentMethod: false,
          balance: 0,
          fundingSourceDetails: null,
          businessId: "",
          error: resData.error?.message || "Erro de autenticação com a API da Meta.",
        },
      });
    }

    // Process balance (Meta returns it as a string representing cents/units)
    let parsedBalance = 0;
    if (resData.balance) {
      const balVal = parseInt(resData.balance, 10);
      if (!isNaN(balVal)) {
        parsedBalance = balVal / 100; // convert cents to currency unit
      }
    }

    // Process amount spent (Meta returns it as cents/units)
    let parsedAmountSpent = 0;
    if (resData.amount_spent) {
      const spentVal = parseInt(resData.amount_spent, 10);
      if (!isNaN(spentVal)) {
        parsedAmountSpent = spentVal / 100;
      }
    }

    // Na API da Meta:
    // account_status: 1 = ACTIVE, 201 = ANY_ACTIVE, 3 = UNSETTLED, 8 = PENDING_SETTLEMENT
    // disable_reason: 0 = NONE, 3 = RISK_PAYMENT
    const isAccountHealthy =
      resData.account_status === 1 || resData.account_status === 201 || resData.account_status === undefined;

    const hasPaymentIssue =
      resData.account_status === 3 ||
      resData.account_status === 8 ||
      resData.disable_reason === 3;

    // A conta possui forma de pagamento válida se:
    // 1. Tem funding_source ou funding_source_details explícito informado pela Meta, OU
    // 2. Tem saldo pré-pago ativo (balance > 0), OU
    // 3. Já gastou no passado (amount_spent > 0) e a conta está ativa e saudável.
    // Se for uma conta nova (amount_spent == 0, balance == 0, sem funding_source), ela AINDA NÃO possui forma de pagamento cadastrada.
    const hasExplicitPaymentMethod = !!(
      resData.funding_source ||
      resData.funding_source_details ||
      parsedBalance > 0 ||
      (parsedAmountSpent > 0 && isAccountHealthy)
    );

    const hasPaymentMethod = !hasPaymentIssue && hasExplicitPaymentMethod;

    const businessId = resData.business?.id || "";

    if (businessId && metaConnection.businessId !== businessId) {
      await updateMetaConnectionAdmin(uid, { businessId }).catch((e) =>
        console.error("[API_ADS_BILLING_STATUS] Error caching businessId in Firestore:", e)
      );
    }

    const fundingType = resData.funding_source_details?.type;
    const isPostpaid = !!(
      fundingType === 1 ||
      fundingType === 2 ||
      fundingType === 3 ||
      fundingType === 20 ||
      (hasExplicitPaymentMethod && parsedBalance === 0)
    );
    const isPrepaid = !isPostpaid;

    const billing = {
      adAccountId,
      adAccountName: metaConnection.adAccountName || "",
      currency: resData.currency || "BRL",
      accountStatus: resData.account_status || 1,
      disableReason: resData.disable_reason || 0,
      hasPaymentMethod,
      balance: parsedBalance,
      fundingSourceDetails: resData.funding_source_details || null,
      businessId,
      isPrepaid,
    };

    return NextResponse.json({ success: true, billing });
  } catch (error: any) {
    console.error("[API_ADS_BILLING_STATUS] Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
