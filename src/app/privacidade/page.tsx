import React from "react";
import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Política de privacidade e proteção de dados pessoais dos usuários da plataforma NumVapt.",
};

export default function PrivacidadePage() {
  const privacidadeHtml = `
    <h2><span style="color: rgb(68, 68, 68);">Política de Privacidade</span></h2>
    <p><span style="color: rgb(68, 68, 68);">A sua privacidade é importante para nós. É política do numvapt.com.br respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar no site <a href="https://numvapt.com.br">numvapt.com.br</a>, e outros sites que possuímos e operamos.</span></p>
    
    <p><span style="color: rgb(68, 68, 68);">Solicitamos informações pessoais apenas quando realmente precisamos delas para lhe fornecer um serviço. Fazemo-lo por meios justos e legais, com o seu conhecimento e consentimento. Também informamos por que estamos coletando e como será usado.</span></p>
    
    <p><span style="color: rgb(68, 68, 68);">Apenas retemos as informações coletadas pelo tempo necessário para fornecer o serviço solicitado. Quando armazenamos dados, protegemos dentro de meios comercialmente aceitáveis ​​para evitar perdas e roubos, bem como acesso, divulgação, cópia, uso ou modificação não autorizados.</span></p>
    
    <p><span style="color: rgb(68, 68, 68);">Não compartilhamos informações de identificação pessoal publicamente ou com terceiros, exceto quando exigido por lei.</span></p>
    
    <p><span style="color: rgb(68, 68, 68);">O nosso site pode ter links para sites externos que não são operados por nós. Esteja ciente de que não temos controle sobre o conteúdo e práticas desses sites e não podemos aceitar responsabilidade por suas respectivas&nbsp;</span><a href="https://politicaprivacidade.com/" rel="noopener noreferrer" target="_blank" style="background-color: transparent; color: rgb(68, 68, 68);">políticas de privacidade</a><span style="color: rgb(68, 68, 68);">.</span></p>
    
    <p><span style="color: rgb(68, 68, 68);">Você é livre para recusar a nossa solicitação de informações pessoais, entendendo que talvez não possamos fornecer alguns dos serviços desejados.</span></p>
    
    <p><span style="color: rgb(68, 68, 68);">O uso continuado de nosso site será considerado como aceitação de nossas práticas em torno de privacidade e informações pessoais. Se você tiver alguma dúvida sobre como lidamos com dados do usuário e informações pessoais, entre em contato conosco.</span></p>

    <h3><span style="color: rgb(68, 68, 68);">Integração com Google APIs (Google Ads)</span></h3>
    <p><span style="color: rgb(68, 68, 68);">Nossa plataforma se integra com os serviços de API do Google para permitir que você gerencie e acompanhe suas campanhas de publicidade do Google Ads diretamente pelo painel do NumVapt.</span></p>

    <h4><span style="color: rgb(68, 68, 68);">1. Quais dados coletamos e acessamos?</span></h4>
    <p><span style="color: rgb(68, 68, 68);">Ao conectar sua conta do Google Ads via OAuth 2.0, solicitamos acesso ao seguinte escopo:</span></p>
    <ul>
      <li><span style="color: rgb(68, 68, 68);"><strong>https://www.googleapis.com/auth/adwords:</strong> Permite ver, editar, criar e excluir seus dados e contas do Google Ads.</span></li>
    </ul>
    <p><span style="color: rgb(68, 68, 68);">Através deste acesso, nossa plataforma lê informações básicas sobre suas contas de anúncios (como ID da conta, nome), campanhas ativas, orçamentos, criativos e métricas de desempenho (impressões, cliques, conversões e custos).</span></p>

    <h4><span style="color: rgb(68, 68, 68);">2. Como usamos esses dados?</span></h4>
    <p><span style="color: rgb(68, 68, 68);">Os dados obtidos do Google Ads são utilizados exclusivamente para:</span></p>
    <ul>
      <li><span style="color: rgb(68, 68, 68);">Permitir que você crie, configure e publique novas campanhas e anúncios no Google Ads diretamente da interface do NumVapt.</span></li>
      <li><span style="color: rgb(68, 68, 68);">Acompanhar e gerar relatórios visuais consolidados do desempenho dos seus anúncios no seu painel.</span></li>
      <li><span style="color: rgb(68, 68, 68);">Sincronizar o status de cobrança e atividade das suas campanhas publicitárias.</span></li>
    </ul>

    <h4><span style="color: rgb(68, 68, 68);">3. Como armazenamos e protegemos seus dados?</span></h4>
    <ul>
      <li><span style="color: rgb(68, 68, 68);">Os tokens de acesso e de atualização (refresh tokens) obtidos durante a autenticação Google OAuth são armazenados com segurança em nosso banco de dados no Google Firestore.</span></li>
      <li><span style="color: rgb(68, 68, 68);">Essas credenciais são usadas estritamente pelo nosso sistema para realizar chamadas de API autenticadas em seu nome às APIs do Google Ads, mantendo total privacidade.</span></li>
    </ul>

    <h4><span style="color: rgb(68, 68, 68);">4. Compartilhamento e Uso Limitado (Limited Use)</span></h4>
    <p><span style="color: rgb(68, 68, 68);">O NumVapt <strong>não compartilha</strong>, não vende e não transfere seus dados de usuário obtidos através das APIs do Google para terceiros, exceto se estritamente necessário para cumprir obrigações legais ou de segurança.</span></p>
    <p><span style="color: rgb(68, 68, 68);">O uso e a transferência de informações recebidas das APIs do Google pelo NumVapt estarão em total conformidade com a <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">Política de Dados do Usuário dos Serviços de API do Google</a>, incluindo seus requisitos de <strong>Uso Limitado (Limited Use)</strong>.</span></p>

    <h4><span style="color: rgb(68, 68, 68);">5. Exclusão de Dados e Revogação</span></h4>
    <p><span style="color: rgb(68, 68, 68);">Você pode desconectar sua conta do Google Ads a qualquer momento na seção de configurações do NumVapt. Ao fazer isso, todos os tokens de acesso e dados temporários associados ao Google serão imediatamente e permanentemente removidos dos nossos servidores.</span></p>
    <p><span style="color: rgb(68, 68, 68);">Adicionalmente, você pode revogar as permissões concedidas ao NumVapt acessando a página de configurações de segurança da sua própria Conta do Google.</span></p>

    <h3><span style="color: rgb(68, 68, 68);">Compromisso do Usuário</span></h3>
    <p><span style="color: rgb(68, 68, 68);">O usuário se compromete a fazer uso adequado dos conteúdos e da informação que o numvapt.com.br oferece no site e com caráter enunciativo, mas não limitativo:</span></p>
    <ul>
      <li><span style="color: rgb(68, 68, 68);">A) Não se envolver em atividades que sejam ilegais ou contrárias à boa fé e à ordem pública;</span></li>
      <li><span style="color: rgb(68, 68, 68);">B) Não difundir propaganda ou conteúdo de natureza racista, xenofóbica, jogos de sorte ou azar, qualquer tipo de pornografia ilegal, de apologia ao terrorismo ou contra os direitos humanos;</span></li>
      <li><span style="color: rgb(68, 68, 68);">C) Não causar danos aos sistemas físicos (hardwares) e lógicos (softwares) do numvapt.com.br, de seus fornecedores ou terceiros, para introduzir ou disseminar vírus informáticos ou quaisquer outros sistemas de hardware ou software que sejam capazes de causar danos anteriormente mencionados.</span></li>
    </ul>

    <h3><span style="color: rgb(68, 68, 68);">Mais informações</span></h3>
    <p><span style="color: rgb(68, 68, 68);">Esperamos que esteja esclarecido e, como mencionado anteriormente, se houver algo que você não tem certeza se precisa ou não, geralmente é mais seguro deixar os cookies ativados, caso interaja com um dos recursos que você usa em nosso site.</span></p>
    <p><span style="color: rgb(68, 68, 68);">Esta política é efetiva a partir de&nbsp;08 July 2026 17:15</span></p>
  `;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <style>{`
        .terms-content h2 {
            font-size: 1.5rem;
            font-weight: 700;
            margin-top: 2rem;
            margin-bottom: 1rem;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 0.5rem;
        }
        .terms-content h3 {
            font-size: 1.25rem;
            font-weight: 600;
            margin-top: 1.5rem;
            margin-bottom: 0.5rem;
        }
        .terms-content p, .terms-content li {
            line-height: 1.75;
            color: #4b5563;
        }
         .terms-content ol, .terms-content ul {
            list-style-type: decimal;
            padding-left: 1.5rem;
            margin-top: 1rem;
            margin-bottom: 1rem;
        }
        .terms-content ul {
            list-style-type: disc;
        }
        .terms-content a {
            color: #2563eb;
            text-decoration: underline;
        }
      `}</style>
      <div className="mx-auto max-w-4xl">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para a Home
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Política de Privacidade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="terms-content" dangerouslySetInnerHTML={{ __html: privacidadeHtml }} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
