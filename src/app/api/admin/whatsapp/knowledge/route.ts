import { NextResponse, type NextRequest } from "next/server";
import { validateAdminToken } from "@/lib/admin-auth";
import { adminDb } from "@/lib/firebase-admin";
import type { WhatsAppKnowledgeTopic } from "@/lib/types/whatsapp-knowledge";

export const DEFAULT_KNOWLEDGE_TOPICS: WhatsAppKnowledgeTopic[] = [
  {
    id: "topic_planos",
    category: "planos",
    title: "Planos e Preços Oficiais NumVapt",
    content: "• Plano Mensal: R$ 490,00/mês (sem fidelidade, cancele quando quiser).\n• Plano Trimestral: Cobrado 3x de R$ 441,00/mês (10% de desconto | total de R$ 1.323,00 por trimestre no cartão recorrente ou Pix).\n• Plano Semestral: Cobrado 6x de R$ 416,50/mês (15% de desconto | total de R$ 2.499,00 por semestre no cartão recorrente ou Pix).\n• Plano Anual: Cobrado 12x de R$ 399,00/mês (+ 1 mês bônus grátis, saindo por R$ 368,30/mês considerando 13 meses).\n• IMPORTANTE: Todos os valores são cobrados na modalidade 'Assinatura Mensal Recorrente', de modo que NÃO incide no valor total do limite do cartão de crédito (o limite não fica travado)!\n• Link oficial de cadastro para teste grátis: https://numvapt.com.br/acesso/cadastro",
    isActive: true,
    order: 1,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "topic_contrato",
    category: "contrato",
    title: "Garantia e Segurança Contratual",
    content: "• Contrato digital formal de 19 cláusulas com aceite consciente.\n• 7 dias de garantia incondicional Risco Zero (direito de arrependimento) com devolução de 100% do valor pago.\n• Pagamento via Cartão de Crédito na modalidade mensal recorrente (sem travar o limite total) ou Pix com liberação imediata.",
    isActive: true,
    order: 2,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "topic_empresa",
    category: "empresa",
    title: "Sobre a NumVapt e Funcionalidades",
    content: "A NumVapt é a plataforma inteligente que automatiza o marketing digital de empresas e empreendedores:\n- Cria posts profissionais com texto persuasivo, legendas e hashtags em segundos.\n- Gera fotos profissionais de produtos contextualizados com Inteligência Artificial.\n- Vitrine Digital automatizada para vendas.\n- Agendamento e publicação automática de posts no Instagram e LinkedIn.",
    isActive: true,
    order: 3,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "topic_atendimento",
    category: "duvidas",
    title: "Regra de Atendimento Humano",
    content: "Se o cliente solicitar expressamente falar com um atendente humano, suporte ou pessoa física, a Maia deve confirmar cordialmente que um consultor da equipe humana da NumVapt foi notificado e responderá por este mesmo número de WhatsApp em breve.",
    isActive: true,
    order: 4,
    updatedAt: new Date().toISOString(),
  }
];

export async function GET(request: NextRequest) {
  const token = request.cookies.get("firebase-id-token")?.value ?? null;
  const admin = await validateAdminToken(token);

  if (!admin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  try {
    const snap = await adminDb.collection("whatsapp_knowledge_base").orderBy("order", "asc").get();

    if (snap.empty) {
      const batch = adminDb.batch();
      for (const item of DEFAULT_KNOWLEDGE_TOPICS) {
        const ref = adminDb.collection("whatsapp_knowledge_base").doc(item.id);
        batch.set(ref, item);
      }
      await batch.commit();
      return NextResponse.json({ topics: DEFAULT_KNOWLEDGE_TOPICS }, { status: 200 });
    }

    const topics: WhatsAppKnowledgeTopic[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    }));

    return NextResponse.json({ topics }, { status: 200 });
  } catch (error) {
    console.error("Erro ao carregar central de conhecimento:", error);
    return NextResponse.json({ topics: DEFAULT_KNOWLEDGE_TOPICS }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get("firebase-id-token")?.value ?? null;
  const admin = await validateAdminToken(token);

  if (!admin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, category, title, content, isActive, order } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Título e Conteúdo são obrigatórios." }, { status: 400 });
    }

    const topicId = id || `topic_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const docRef = adminDb.collection("whatsapp_knowledge_base").doc(topicId);

    const topicData: WhatsAppKnowledgeTopic = {
      id: topicId,
      category: category || "outros",
      title: title.trim(),
      content: content.trim(),
      isActive: isActive !== false,
      order: typeof order === "number" ? order : 99,
      updatedAt: new Date().toISOString(),
      updatedBy: admin.email || "Admin",
    };

    await docRef.set(topicData, { merge: true });

    return NextResponse.json({ success: true, topic: topicData }, { status: 200 });
  } catch (error) {
    console.error("Erro ao salvar tópico na central de conhecimento:", error);
    return NextResponse.json({ error: "Falha ao salvar informações." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const token = request.cookies.get("firebase-id-token")?.value ?? null;
  const admin = await validateAdminToken(token);

  if (!admin) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID não fornecido." }, { status: 400 });
  }

  try {
    await adminDb.collection("whatsapp_knowledge_base").doc(id).delete();
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Erro ao excluir tópico:", error);
    return NextResponse.json({ error: "Falha ao excluir." }, { status: 500 });
  }
}
