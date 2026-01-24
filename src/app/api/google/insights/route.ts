
import { NextResponse, type NextRequest } from "next/server";

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

        // --- Insights Fetching Logic ---
        const end = endDate ? new Date(endDate) : new Date();
        const start = startDate ? new Date(startDate) : new Date();
        if (!startDate) {
            start.setDate(end.getDate() - 30);
        }

        const metrics = [
            'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH', 'BUSINESS_IMPRESSIONS_MOBILE_SEARCH',
            'BUSINESS_IMPRESSIONS_DESKTOP_MAPS', 'BUSINESS_IMPRESSIONS_MOBILE_MAPS',
            'WEBSITE_CLICKS', 'CALL_CLICKS', 'BUSINESS_DIRECTION_REQUESTS'
        ];
        const metricsParams = metrics.map(m => `dailyMetrics=${m}`).join('&');
        const insightsUrl = `https://businessprofileperformance.googleapis.com/v1/locations/${locationId}:fetchMultiDailyMetricsTimeSeries?${metricsParams}&dailyRange.start_date.year=${start.getFullYear()}&dailyRange.start_date.month=${start.getMonth() + 1}&dailyRange.start_date.day=${start.getDate()}&dailyRange.end_date.year=${end.getFullYear()}&dailyRange.end_date.month=${end.getMonth() + 1}&dailyRange.end_date.day=${end.getDate()}`;
        
        const insightsPromise = fetch(insightsUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        // --- Profile Fetching Logic (New) ---
        const readMask = "name,title,categories,storefrontAddress,phoneNumbers,websiteUri,metadata,profile,attributes,regularHours";
        const profileUrl = `https://mybusinessbusinessinformation.googleapis.com/v1/locations/${locationId}?readMask=${encodeURIComponent(readMask)}`;
        const profilePromise = fetch(profileUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        // --- Execute in parallel ---
        const [insightsResponse, profileResponse] = await Promise.all([insightsPromise, profilePromise]);

        // --- Process Insights ---
        const insightsData = await insightsResponse.json();
        if (!insightsResponse.ok) {
            console.error("[GOOGLE_INSIGHTS_ERROR] API Response:", insightsData);
            throw new Error(insightsData.error?.message || "Falha ao buscar dados de performance do Google.");
        }
        const aggregatedMetrics: { [key: string]: number } = {};
        insightsData.multiDailyMetricTimeSeries?.forEach((series: any) => {
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

        // --- Process Profile ---
        let formattedProfile = null;
        if (profileResponse.ok) {
            const loc = await profileResponse.json();
            const whatsappAttribute = loc.attributes?.find((attr: any) => attr.attributeId === 'url_whatsapp');
            formattedProfile = {
                name: loc.title || '',
                googleName: loc.name,
                category: loc.categories?.primaryCategory?.displayName || '',
                address: loc.storefrontAddress ? 
                         `${loc.storefrontAddress.addressLines?.join(', ')}, ${loc.storefrontAddress.locality}, ${loc.storefrontAddress.administrativeArea} - ${loc.storefrontAddress.postalCode}` 
                         : '',
                phone: loc.phoneNumbers?.primaryPhone || '',
                website: loc.websiteUri || '',
                description: loc.profile?.description || '',
                isVerified: true,
                whatsappUrl: whatsappAttribute?.values?.[0] || '',
                regularHours: loc.regularHours || null,
            };
        } else {
            console.warn(`[GOOGLE_INSIGHTS_WARN] Falha ao buscar dados de perfil para ${locationId}. Status: ${profileResponse.status}`);
        }

        // --- Return combined data ---
        return NextResponse.json({ success: true, insights: finalInsights, profile: formattedProfile });

    } catch (error: any) {
        console.error("[GOOGLE_INSIGHTS_ERROR]", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
