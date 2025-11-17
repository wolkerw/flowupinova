
import { NextResponse, type NextRequest } from "next/server";
import { getGoogleBusinessProfile } from "@/lib/services/google-service-admin";
import { getUidFromCookie } from "@/lib/firebase-admin";

export const dynamic = 'force-dynamic';

interface InsightsRequestBody {
  accessToken: string;
  locationId: string;
  startDate?: string; // Formato YYYY-MM-DD
  endDate?: string;   // Formato YYYY-MM-DD
}

export async function POST(request: NextRequest) {
    try {
        const { accessToken, locationId, startDate, endDate } = await request.json() as InsightsRequestBody;

        if (!accessToken || !locationId) {
            return NextResponse.json({ success: false, error: "Access Token e Location ID são obrigatórios." }, { status: 400 });
        }

        // Define as datas do intervalo. Se não forem fornecidas, usa os últimos 30 dias.
        const end = endDate ? new Date(endDate) : new Date();
        const start = startDate ? new Date(startDate) : new Date();
        if (!startDate) {
            start.setDate(end.getDate() - 30);
        }

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
        
        const url = `https://businessprofileperformance.googleapis.com/v1/locations/${locationId}:fetchMultiDailyMetricsTimeSeries?${metricsParams}&dailyRange.start_date.year=${start.getFullYear()}&dailyRange.start_date.month=${start.getMonth() + 1}&dailyRange.start_date.day=${start.getDate()}&dailyRange.end_date.year=${end.getFullYear()}&dailyRange.end_date.month=${end.getMonth() + 1}&dailyRange.end_date.day=${end.getDate()}`;
        
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

        return NextResponse.json({ success: true, insights: finalInsights });

    } catch (error: any) {
        console.error("[GOOGLE_INSIGHTS_ERROR]", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
