
import { NextResponse, type NextRequest } from "next/server";
import { config } from "@/lib/config";

// This webhook URL is a placeholder. It should be replaced with the actual email service webhook.
const WEBHOOK_URL = "https://webhook.flowupinova.com.br/webhook/send-email";

export async function POST(request: NextRequest) {
    try {
        const { name, email } = await request.json();

        if (!name || !email) {
            return NextResponse.json({ success: false, error: "Nome e e-mail são obrigatórios." }, { status: 400 });
        }
        
        const dashboardUrl = `${config.aplicationURL}/dashboard`;

        const emailPayload = {
            to: email,
            subject: "Bem-vindo à FlowUp! ✨",
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h1 style="color: #1E40AF;">Olá ${name},</h1>
                <p>Seja muito bem-vindo(a) à FlowUp! Estamos empolgados em ter você a bordo.</p>
                <p>A FlowUp é sua nova plataforma de marketing com inteligência artificial, projetada para simplificar e automatizar suas tarefas. Aqui está um resumo do que você pode começar a fazer agora mesmo:</p>
                <ul style="padding-left: 20px;">
                  <li><strong>Gerar Conteúdo com IA:</strong> Crie legendas, ideias para posts e textos para anúncios em segundos.</li>
                  <li><strong>Agendar Publicações:</strong> Conecte suas redes sociais (Instagram e Facebook) e agende seus posts para serem publicados nos melhores horários.</li>
                  <li><strong>Gerenciar seu Negócio:</strong> Conecte seu Perfil da Empresa no Google para analisar métricas e interagir com clientes.</li>
                </ul>
                <p style="text-align: center; margin: 30px 0;">
                    <a href="${dashboardUrl}" style="background-color: #3B82F6; color: white; padding: 12px 25px; text-align: center; text-decoration: none; display: inline-block; border-radius: 8px; font-size: 16px;">Acessar a Plataforma</a>
                </p>
                <p style="margin-top: 20px;">Atenciosamente,<br>Equipe FlowUp</p>
              </div>
            `
        };

        // Fire-and-forget call to the webhook, no need to await
        fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(emailPayload),
        }).catch(error => {
            // Log error but don't block the main flow
            console.error("[WELCOME_EMAIL_WEBHOOK_ERROR]", error);
        });

        // Immediately return success to not block the client-side registration flow
        return NextResponse.json({ success: true, message: "Requisição de e-mail de boas-vindas enviada." });

    } catch (error: any) {
        console.error("[WELCOME_EMAIL_API_ERROR]", error);
        // Even if the API route itself fails, don't block the user.
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
