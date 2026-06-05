import { NextResponse, type NextRequest } from "next/server";
import { getUidFromCookie } from "@/lib/firebase-admin";
import { getMetaConnectionAdmin } from "@/lib/services/meta-service-admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    if (!q || q.length < 3) {
      return NextResponse.json({ success: true, locations: [] });
    }

    const uid = await getUidFromCookie();
    let metaConnection: any = null;
    try {
      metaConnection = await getMetaConnectionAdmin(uid);
    } catch (e) {
      console.warn("[API_LOCATIONS] Falha ao recuperar conexao Meta:", e);
    }

    let locations: any[] = [];

    // Helper para Capitalizar (Title Case) textos
    const toTitleCase = (str: string) => {
      return str
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    };

    // Extrai o candidato a Cidade do query (se o usuário digitou algo como "Bairro, Cidade")
    let cityCandidate = "";
    if (q.includes(",")) {
      const parts = q.split(",");
      if (parts.length > 1 && parts[1].trim().length > 2) {
        cityCandidate = toTitleCase(parts[1].trim());
      }
    }

    // =========================================================================
    // 1. BUSCA NA META ADS API (Cidades, Estados, Países e Bairros - CEPs Omitidos)
    // =========================================================================
    if (metaConnection?.isConnected && metaConnection?.accessToken) {
      try {
        const metaUrl = `https://graph.facebook.com/v24.0/search?type=adgeolocation&q=${encodeURIComponent(q)}&access_token=${metaConnection.accessToken}`;
        const metaRes = await fetch(metaUrl);
        const metaData = await metaRes.json();

        if (metaRes.ok && metaData.data) {
          const typeMapping: Record<string, string> = {
            country: "País",
            region: "Estado",
            city: "Cidade",
            subcity: "Bairro",
            neighborhood: "Bairro",
            subneighborhood: "Bairro",
          };

          const metaResults = metaData.data
            .filter((loc: any) => loc.type !== "postal_code" && loc.type !== "zip")
            .map((loc: any, index: number) => {
              let finalType = typeMapping[loc.type] || "Região";
              let displayRegion = loc.region || "";

              // Correção da UX do Bairro: Se for bairro, e o usuário digitou a cidade no input,
              // enriquecemos o subtext exibindo "Bairro • Cidade - Estado"
              if (finalType === "Bairro" && cityCandidate) {
                displayRegion = `${cityCandidate} - ${displayRegion}`;
              }

              return {
                key: `meta_${index}_${loc.key}`,
                name: loc.name,
                type: finalType,
                latitude: loc.latitude ? parseFloat(loc.latitude) : undefined,
                longitude: loc.longitude ? parseFloat(loc.longitude) : undefined,
                region: displayRegion,
              };
            });

          locations = [...locations, ...metaResults];
        }
      } catch (metaErr) {
        console.warn("[API_LOCATIONS] Falha na busca da Meta API:", metaErr);
      }
    }

    // =========================================================================
    // 2. BUSCA COMPLEMENTAR NO NOMINATIM (Com suporte a números de rua)
    // =========================================================================
    const cleanQuery = q.toLowerCase();
    const hasStreetIndicator =
      cleanQuery.includes("rua") ||
      cleanQuery.includes("avenida") ||
      cleanQuery.includes("av.") ||
      cleanQuery.includes("r.") ||
      /\d/.test(q);

    const hasValidCoords = locations.some((l) => l.latitude !== undefined && l.longitude !== undefined);

    if (!hasValidCoords || hasStreetIndicator) {
      try {
        let query = q;
        if (!query.toLowerCase().includes("brasil") && !query.toLowerCase().includes("brazil")) {
          query += ", Brasil";
        }

        const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=br&addressdetails=1`;
        const nomRes = await fetch(nominatimUrl, {
          headers: {
            "User-Agent": "NumVaptAdsApp/1.0",
            "Accept-Language": "pt-BR,pt;q=0.9",
          },
          signal: AbortSignal.timeout(2500),
        });

        if (nomRes.ok) {
          const nomData = await nomRes.json();
          
          // Extração inteligente de número de rua se o usuário digitou (Ex: "Rua X, 2533")
          let extractedNumber = "";
          const numberMatch = q.match(/,\s*(\d+)/) || q.match(/\s+(\d+)$/);
          if (numberMatch) {
            extractedNumber = numberMatch[1];
          }

          const nomLocations = (nomData || [])
            .filter((item: any) => item.type !== "postcode" && item.class !== "postcode")
            .map((item: any, index: number) => {
              const address = item.address || {};
              let displayName = item.display_name;
              displayName = displayName.replace(", Brasil", "").replace(", Brazil", "");

              let ptType = "Endereço";
              if (address.country && !address.state && !address.city && !address.suburb && !address.road) {
                ptType = "País";
              } else if (address.state && !address.city && !address.suburb && !address.road) {
                ptType = "Estado";
              } else if (address.city || address.town || address.village) {
                if (!address.suburb && !address.road) {
                  ptType = "Cidade";
                } else if (address.suburb && !address.road) {
                  ptType = "Bairro";
                } else {
                  ptType = "Endereço";
                }
              } else if (address.suburb) {
                ptType = "Bairro";
              } else if (address.road) {
                ptType = "Rua/Avenida";
              }

              // Injeção elegante do número de rua na sugestão caso o usuário tenha digitado e a API não retorne
              if (extractedNumber && (ptType === "Rua/Avenida" || ptType === "Endereço")) {
                const firstCommaIndex = displayName.indexOf(",");
                if (firstCommaIndex !== -1) {
                  const streetPart = displayName.substring(0, firstCommaIndex);
                  if (!streetPart.includes(extractedNumber)) {
                    displayName = `${streetPart}, ${extractedNumber}${displayName.substring(firstCommaIndex)}`;
                  }
                }
              }

              return {
                key: `nom_${index}_${item.osm_id}`,
                name: displayName,
                type: ptType,
                latitude: parseFloat(item.lat),
                longitude: parseFloat(item.lon),
                region: address.state || "",
              };
            });

          // Mescla de forma única evitando duplicidade por proximidade de coordenadas
          const existingKeys = new Set(
            locations
              .filter((l) => l.latitude && l.longitude)
              .map((l) => `${Number(l.latitude).toFixed(4)}_${Number(l.longitude).toFixed(4)}`)
          );

          const uniqueNomLocations = nomLocations.filter((l: any) => {
            return !existingKeys.has(`${Number(l.latitude).toFixed(4)}_${Number(l.longitude).toFixed(4)}`);
          });

          locations = [...locations, ...uniqueNomLocations].slice(0, 8);
        }
      } catch (nomErr) {
        console.warn("[API_LOCATIONS] Falha silenciada no fallback Nominatim:", nomErr);
      }
    }

    return NextResponse.json({ success: true, locations: locations });
  } catch (error: any) {
    console.error("[API_LOCATIONS] Erro geral:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
