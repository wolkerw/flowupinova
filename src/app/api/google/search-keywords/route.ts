
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

interface SearchKeywordsRequestBody {
  accessToken: string;
  locationId: string;
  startDate?: { year: number; month: number; day: number; };
  endDate?: { year: number; month: number; day: number; };
}

interface InsightsValue {
    value?: string;
    threshold?: string;
}

function parseInsightsValue(iv: InsightsValue): { exact: boolean; value: number } {
  if (iv.value) {
    return { exact: true, value: Number(iv.value) };
  }
  if (iv.threshold) {
    return { exact: false, value: Number(iv.threshold) }; // valor mínimo
  }
  return { exact: false, value: 0 };
}


export async function POST(request: NextRequest) {
    try {
        const { accessToken, locationId, startDate, endDate } = await request.json() as SearchKeywordsRequestBody;

        if (!accessToken || !locationId) {
            return NextResponse.json({ success: false, error: "Access Token e Location ID são obrigatórios." }, { status: 400 });
        }
        
        // Define as datas do intervalo. Se não forem fornecidas, usa os últimos 30 dias.
        const end = endDate ? new Date(endDate.year, endDate.month - 1, endDate.day) : new Date();
        const start = startDate ? new Date(startDate.year, startDate.month - 1, startDate.day) : new Date(new Date().setDate(end.getDate() - 30));

        const url = new URL(`https://businessprofileperformance.googleapis.com/v1/locations/${locationId}/searchkeywords/impressions/monthly`);
        
        url.searchParams.append('monthlyRange.start_month.year', start.getFullYear().toString());
        url.searchParams.append('monthlyRange.start_month.month', (start.getMonth() + 1).toString());
        url.searchParams.append('monthlyRange.end_month.year', end.getFullYear().toString());
        url.searchParams.append('monthlyRange.end_month.month', (end.getMonth() + 1).toString());
        url.searchParams.append('pageSize', '20');


        const response = await fetch(url.toString(), {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("[GOOGLE_KEYWORDS_ERROR] API Response:", data);
            throw new Error(data.error?.message || "Falha ao buscar palavras-chave do Google.");
        }
        
        const keywords = data.searchKeywordsCounts?.map((item: any) => {
            const parsedValue = parseInsightsValue(item.insightsValue || {});
            return {
                keyword: item.searchKeyword,
                value: parsedValue.value,
                exact: parsedValue.exact,
            };
        }) || [];

        return NextResponse.json({ success: true, keywords: keywords });

    } catch (error: any) {
        console.error("[GOOGLE_KEYWORDS_ERROR]", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
