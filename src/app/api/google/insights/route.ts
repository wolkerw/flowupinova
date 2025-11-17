
import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedGoogleClient, getGoogleBusinessProfile } from "@/lib/services/google-service-admin";
import { getUidFromCookie } from "@/lib/firebase-admin";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const uid = await getUidFromCookie();
        const profile = await getGoogleBusinessProfile(uid);

        if (!profile.isVerified || !profile.googleName) {
            return NextResponse.json({ success: false, error: "Perfil do Google Meu Negócio não está conectado ou é inválido." }, { status: 400 });
        }

        const oauth2Client = await getAuthenticatedGoogleClient(uid);
        const accessToken = (await oauth2Client.getAccessToken())?.token;

        if (!accessToken) {
            throw new Error("Não foi possível obter um token de acesso válido do Google.");
        }

        const locationName = profile.googleName; // Formato: locations/{locationId}
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        const metrics = [
            'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH',
            'BUSINESS_IMPRESSIONS_MOBILE_SEARCH',
            'BUSINESS_IMPRESSIONS_DESKTOP_MAPS',
            'BUSINESS_IMPRESSIONS_MOBILE_MAPS',
            'WEBSITE_CLICKS',
            'CALL_CLICKS',
            'BUSINESS_DIRECTION_REQUESTS'
        ];

        const metricsParams = metrics.map(m => `dailyMetrics=${m}`).join('&');
        
        const url = `https://businessprofileperformance.googleapis.com/v1/${locationName}:fetchMultiDailyMetricsTimeSeries?${metricsParams}&dailyRange.start_date.year=${thirtyDaysAgo.getFullYear()}&dailyRange.start_date.month=${thirtyDaysAgo.getMonth() + 1}&dailyRange.start_date.day=${thirtyDaysAgo.getDate()}&dailyRange.end_date.year=${today.getFullYear()}&dailyRange.end_date.month=${today.getMonth() + 1}&dailyRange.end_date.day=${today.getDate()}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("[GOOGLE_INSIGHTS_ERROR] API Response:", data);
            throw new Error(data.error?.message || "Falha ao buscar dados de performance do Google.");
        }

        // Processar os dados para somar os totais
        const aggregatedMetrics: { [key: string]: number } = {};
        data.multiDailyMetricTimeSeries?.forEach((series: any) => {
            series.dailyMetricTimeSeries?.forEach((metricSeries: any) => {
                const metricName = metricSeries.dailyMetric;
                const totalValue = metricSeries.timeSeries?.datedValues?.reduce((acc: number, curr: any) => acc + parseInt(curr.value || '0', 10), 0) || 0;
                aggregatedMetrics[metricName] = totalValue;
            });
        });

        const finalInsights = {
            viewsSearch: (aggregatedMetrics['BUSINESS_IMPRESSIONS_DESKTOP_SEARCH'] || 0) + (aggregatedMetrics['BUSINESS_IMPRESSIONS_MOBILE_SEARCH'] || 0),
            viewsMaps: (aggregatedMetrics['BUSINESS_IMPRESSIONS_DESKTOP_MAPS'] || 0) + (aggregatedMetrics['BUSINESS_IMPRESSIONS_MOBILE_MAPS'] || 0),
            websiteClicks: aggregatedMetrics['WEBSITE_CLICKS'] || 0,
            phoneCalls: aggregatedMetrics['CALL_CLICKS'] || 0,
            directionsRequests: aggregatedMetrics['BUSINESS_DIRECTION_REQUESTS'] || 0,
        };

        finalInsights.totalViews = finalInsights.viewsSearch + finalInsights.viewsMaps;

        return NextResponse.json({ success: true, insights: finalInsights });

    } catch (error: any) {
        console.error("[GOOGLE_INSIGHTS_ERROR]", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
