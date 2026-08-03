import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Política de Privacidade | NumVapt",
  description: "Política de Privacidade do site NumVapt",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-orange-500/30">
      <div className="container mx-auto max-w-4xl px-4 py-16">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" className="gap-2 text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              Voltar para o site
            </Button>
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm md:p-12">
          <h1 className="mb-8 font-poppins text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Política de Privacidade
          </h1>

          <div className="prose prose-slate max-w-none space-y-6">
            <p>
              A sua privacidade é importante para nós. É política do numvapt respeitar a sua
              privacidade em relação a qualquer informação sua que possamos coletar no site numvapt, e
              outros sites que possuímos e operamos.
            </p>

            <p>
              Solicitamos informações pessoais apenas quando realmente precisamos delas para lhe
              fornecer um serviço. Fazemo-lo por meios justos e legais, com o seu conhecimento e
              consentimento. Também informamos por que estamos coletando e como será usado.
            </p>

            <p>
              Apenas retemos as informações coletadas pelo tempo necessário para fornecer o serviço
              solicitado. Quando armazenamos dados, protegemos dentro de meios comercialmente
              aceitáveis para evitar perdas e roubos, bem como acesso, divulgação, cópia, uso ou
              modificação não autorizados.
            </p>

            <p>
              Não compartilhamos informações de identificação pessoal publicamente ou com terceiros,
              exceto quando exigido por lei.
            </p>

            <p>
              O nosso site pode ter links para sites externos que não são operados por nós. Esteja
              ciente de que não temos controle sobre o conteúdo e práticas desses sites e não
              podemos aceitar responsabilidade por suas respectivas políticas de privacidade.
            </p>

            <p>
              Você é livre para recusar a nossa solicitação de informações pessoais, entendendo que
              talvez não possamos fornecer alguns dos serviços desejados.
            </p>

            <p>
              O uso continuado de nosso site será considerado como aceitação de nossas práticas em
              torno de privacidade e informações pessoais. Se você tiver alguma dúvida sobre como
              lidamos com dados do usuário e informações pessoais, entre em contacto connosco.
            </p>

            <p>
              O serviço Google AdSense que usamos para veicular publicidade usa um cookie
              DoubleClick para veicular anúncios mais relevantes em toda a Web e limitar o número de
              vezes que um determinado anúncio é exibido para você. Para mais informações sobre o
              Google AdSense, consulte as FAQs oficiais sobre privacidade do Google AdSense.
            </p>

            <p>
              Utilizamos anúncios para compensar os custos de funcionamento deste site e fornecer
              financiamento para futuros desenvolvimentos. Os cookies de publicidade comportamental
              usados por este site foram projetados para garantir que você forneça os anúncios mais
              relevantes sempre que possível, rastreando anonimamente seus interesses e apresentando
              coisas semelhantes que possam ser do seu interesse.
            </p>

            <p>
              Vários parceiros anunciam em nosso nome e os cookies de rastreamento de afiliados
              simplesmente nos permitem ver se nossos clientes acessaram o site através de um dos
              sites de nossos parceiros, para que possamos creditá-los adequadamente e, quando
              aplicável, permitir que nossos parceiros afiliados ofereçam qualquer promoção que pode
              fornecê-lo para fazer uma compra.
            </p>

            <h2 className="mt-10 font-poppins text-2xl font-semibold text-slate-900">
              Compromisso do Usuário
            </h2>
            
            <p>
              O usuário se compromete a fazer uso adequado dos conteúdos e da informação que o
              numvapt oferece no site e com caráter enunciativo, mas não limitativo:
            </p>
            <ul className="list-inside list-disc space-y-2 pl-4">
              <li>
                <strong>A)</strong> Não se envolver em atividades que sejam ilegais ou contrárias à
                boa fé a à ordem pública;
              </li>
              <li>
                <strong>B)</strong> Não difundir propaganda ou conteúdo de natureza racista,
                xenofóbica, jogos de sorte ou azar, qualquer tipo de pornografia ilegal, de apologia
                ao terrorismo ou contra os direitos humanos;
              </li>
              <li>
                <strong>C)</strong> Não causar danos aos sistemas físicos (hardwares) e lógicos
                (softwares) do numvapt, de seus fornecedores ou terceiros, para introduzir ou
                disseminar vírus informáticos ou quaisquer outros sistemas de hardware ou software
                que sejam capazes de causar danos anteriormente mencionados.
              </li>
            </ul>

            <h2 className="mt-10 font-poppins text-2xl font-semibold text-slate-900">
              Mais informações
            </h2>

            <p>
              Esperemos que esteja esclarecido e, como mencionado anteriormente, se houver algo que
              você não tem certeza se precisa ou não, geralmente é mais seguro deixar os cookies
              ativados, caso interaja com um dos recursos que você usa em nosso site.
            </p>

            <p className="mt-8 text-sm text-slate-500">
              Esta política é efetiva a partir de <strong>30 July 2026 17:00</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
