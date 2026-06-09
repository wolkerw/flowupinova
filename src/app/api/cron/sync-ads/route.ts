import { NextResponse, type NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  console.log("==============================================");
  console.log("[CRON_SYNC_ADS] Iniciando tarefa agendada global...");
  console.log("==============================================");

  try {
    const usersSnapshot = await adminDb.collection("users").get();
    
    if (usersSnapshot.empty) {
      console.log("[CRON_SYNC_ADS] Nenhum usuário encontrado no banco de dados.");
      return NextResponse.json({ success: true, message: "Nenhum usuário no sistema." });
    }

    let totalSyncedCampaigns = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      
      // Buscar dados da conexão do usuário
      const metaConnDoc = await adminDb
        .collection("users")
        .doc(userId)
        .collection("connections")
        .doc("meta")
        .get();

      if (!metaConnDoc.exists) continue;

      const metaConnection = metaConnDoc.data();
      const isConnected = metaConnection?.isConnected;
      const accessToken = metaConnection?.accessToken;
      const adAccountId = metaConnection?.adAccountId;

      if (!isConnected || !accessToken || !adAccountId) continue;

      // Buscar anúncios ativos deste usuário
      const adsSnapshot = await adminDb
        .collection("users")
        .doc(userId)
        .collection("ads")
        .where("status", "==", "active")
        .get();

      if (adsSnapshot.empty) continue;

      console.log(`[CRON_SYNC_ADS] Sincronizando ${adsSnapshot.size} campanhas ativas para o usuário: ${userId}`);

      for (const adDoc of adsSnapshot.docs) {
        const adData = adDoc.data();
        const metaCampaignId = adData.metaCampaignId;

        if (!metaCampaignId) continue;

        try {
          // Consultar insights da Meta Graph API
          const url = `https://graph.facebook.com/v24.0/${metaCampaignId}/insights?fields=impressions,clicks,spend,actions&access_token=${accessToken}`;
          const res = await fetch(url);
          const resData = await res.json();

          if (res.ok && resData.data && resData.data.length > 0) {
            const insight = resData.data[0];
            const impressions = parseInt(insight.impressions || "0");
            const clicks = parseInt(insight.clicks || "0");
            const amountSpent = parseFloat(insight.spend || "0");

            let actions = clicks;
            if (insight.actions) {
              const linkClicksAction = insight.actions.find((act: any) => act.action_type === "link_click");
              if (linkClicksAction) {
                actions = parseInt(linkClicksAction.value || "0");
              }
            }

            const metrics = {
              impressions,
              clicks,
              actions,
              amountSpent,
              lastSyncedAt: Timestamp.now(),
            };

            let status = adData.status;
            if (adData.endDate) {
              const endDateMillis = adData.endDate.toMillis();
              if (Date.now() > endDateMillis) {
                status = "completed";
                console.log(`[CRON_SYNC_ADS] Campanha ${metaCampaignId} terminada para ${userId}.`);
              }
            }

            await adDoc.ref.update({
              metrics,
              status,
              updatedAt: Timestamp.now(),
            });

            totalSyncedCampaigns++;
          }
        } catch (adErr: any) {
          console.error(`[CRON_SYNC_ADS] Erro ao sincronizar campanha ${metaCampaignId} de ${userId}:`, adErr.message);
        }
      }
    }

    const summaryMsg = `[CRON_SYNC_ADS] Sincronização global concluída. Total de campanhas atualizadas: ${totalSyncedCampaigns}`;
    console.log(summaryMsg);
    
    return NextResponse.json({ success: true, message: summaryMsg });

  } catch (error: any) {
    console.error("[CRON_SYNC_ADS] Erro crítico no cron de sincronização:", error.message);
    return NextResponse.json(
      { success: false, error: "Falha geral ao sincronizar anúncios via cron." },
      { status: 500 }
    );
  }
}
