import { NextResponse, type NextRequest } from "next/server";
import { getUidFromCookie } from "@/lib/firebase-admin";
import { getMetaConnectionAdmin } from "@/lib/services/meta-service-admin";
import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

export async function GET(request: NextRequest) {
  try {
    const uid = await getUidFromCookie();
    const metaConnection = await getMetaConnectionAdmin(uid);

    if (!metaConnection.isConnected || !metaConnection.accessToken) {
      return NextResponse.json(
        { success: false, error: "Conexão Meta não encontrada." },
        { status: 403 }
      );
    }

    const accessToken = metaConnection.accessToken;
    const adAccountId = metaConnection.adAccountId;

    if (!adAccountId) {
      return NextResponse.json(
        { success: false, error: "Nenhuma conta de anúncios selecionada." },
        { status: 400 }
      );
    }

    // Buscar campanhas ativas no Firestore
    const adsRef = adminDb.collection("users").doc(uid).collection("ads");
    const snapshot = await adsRef.where("status", "==", "active").get();

    if (snapshot.empty) {
      return NextResponse.json({ success: true, message: "Nenhuma campanha ativa encontrada para sincronizar." });
    }

    console.log(`[SYNC] Iniciando sincronização para ${snapshot.size} campanhas...`);
    let syncedCount = 0;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const metaCampaignId = data.metaCampaignId;

      if (!metaCampaignId) continue;

      try {
        // Obter métricas da API da Meta (Insights)
        // Pedimos impressões, cliques, gasto (spend) e ações
        const url = `https://graph.facebook.com/v24.0/${metaCampaignId}/insights?fields=impressions,clicks,spend,actions&access_token=${accessToken}`;
        const res = await fetch(url);
        const resData = await res.json();

        if (res.ok && resData.data && resData.data.length > 0) {
          const insight = resData.data[0];
          const impressions = parseInt(insight.impressions || "0");
          const clicks = parseInt(insight.clicks || "0");
          const amountSpent = parseFloat(insight.spend || "0");

          // Encontrar cliques de ação específicos (ex: cliques no link/botão)
          let actions = clicks;
          if (insight.actions) {
            const linkClicksAction = insight.actions.find((act: any) => act.action_type === "link_click");
            if (linkClicksAction) {
              actions = parseInt(linkClicksAction.value || "0");
            }
          }

          // Atualizar o documento no Firestore
          const metrics = {
            impressions,
            clicks,
            actions,
            amountSpent,
            lastSyncedAt: Timestamp.now(),
          };

          // Verificar se a campanha já chegou ao fim da duração
          let status = data.status;
          if (data.endDate) {
            const endDateMillis = data.endDate.toMillis();
            if (Date.now() > endDateMillis) {
              status = "completed";
              console.log(`[SYNC] Campanha ${metaCampaignId} atingiu a data de término. Marcando como concluída.`);
            }
          }

          await docSnap.ref.update({
            metrics,
            status,
            updatedAt: Timestamp.now(),
          });

          syncedCount++;
        } else {
          console.warn(`[SYNC] Sem insights disponíveis para a campanha ${metaCampaignId} na Meta.`);
        }
      } catch (err: any) {
        console.error(`[SYNC] Falha ao sincronizar campanha ${metaCampaignId}:`, err.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Métricas sincronizadas com sucesso. Sincronizadas: ${syncedCount} campanhas.`,
    });

  } catch (error: any) {
    console.error("[SYNC] Erro geral na sincronização:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
