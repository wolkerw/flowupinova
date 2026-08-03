import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Termos de Serviço | NumVapt",
  description: "Termos de Uso e Condições do site NumVapt",
};

export default function TermsOfServicePage() {
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
            Termos de Serviço
          </h1>

          <div className="prose prose-slate max-w-none space-y-6">
            <h2 className="mt-8 font-poppins text-2xl font-semibold text-slate-900">
              1. Termos
            </h2>
            <p>
              Ao acessar ao site numvapt, concorda em cumprir estes termos de serviço, todas as leis
              e regulamentos aplicáveis e concorda que é responsável pelo cumprimento de todas as
              leis locais aplicáveis. Se você não concordar com algum desses termos, está proibido
              de usar ou acessar este site. Os materiais contidos neste site são protegidos pelas
              leis de direitos autorais e marcas comerciais aplicáveis.
            </p>

            <h2 className="mt-10 font-poppins text-2xl font-semibold text-slate-900">
              2. Uso de Licença
            </h2>
            <p>
              É concedida permissão para baixar temporariamente uma cópia dos materiais (informações
              ou software) no site numvapt , apenas para visualização transitória pessoal e não
              comercial. Esta é a concessão de uma licença, não uma transferência de título e, sob
              esta licença, você não pode:
            </p>
            <ul className="list-inside list-disc space-y-2 pl-4">
              <li>modificar ou copiar os materiais;</li>
              <li>
                usar os materiais para qualquer finalidade comercial ou para exibição pública
                (comercial ou não comercial);
              </li>
              <li>
                tentar descompilar ou fazer engenharia reversa de qualquer software contido no site
                numvapt;
              </li>
              <li>remover quaisquer direitos autorais ou outras notações de propriedade dos materiais; ou</li>
              <li>
                transferir os materiais para outra pessoa ou 'espelhe' os materiais em qualquer outro
                servidor.
              </li>
            </ul>
            <p>
              Esta licença será automaticamente rescindida se você violar alguma dessas restrições e
              poderá ser rescindida por numvapt a qualquer momento. Ao encerrar a visualização desses
              materiais ou após o término desta licença, você deve apagar todos os materiais
              baixados em sua posse, seja em formato eletrónico ou impresso.
            </p>

            <h2 className="mt-10 font-poppins text-2xl font-semibold text-slate-900">
              3. Isenção de responsabilidade
            </h2>
            <p>
              Os materiais no site da numvapt são fornecidos 'como estão'. numvapt não oferece
              garantias, expressas ou implícitas, e, por este meio, isenta e nega todas as outras
              garantias, incluindo, sem limitação, garantias implícitas ou condições de
              comercialização, adequação a um fim específico ou não violação de propriedade
              intelectual ou outra violação de direitos.
            </p>
            <p>
              Além disso, o numvapt não garante ou faz qualquer representação relativa à precisão, aos
              resultados prováveis ou à confiabilidade do uso dos materiais em seu site ou de outra
              forma relacionado a esses materiais ou em sites vinculados a este site.
            </p>

            <h2 className="mt-10 font-poppins text-2xl font-semibold text-slate-900">
              4. Limitações
            </h2>
            <p>
              Em nenhum caso o numvapt ou seus fornecedores serão responsáveis por quaisquer danos
              (incluindo, sem limitação, danos por perda de dados ou lucro ou devido a interrupção
              dos negócios) decorrentes do uso ou da incapacidade de usar os materiais em numvapt,
              mesmo que numvapt ou um representante autorizado da numvapt tenha sido notificado
              oralmente ou por escrito da possibilidade de tais danos. Como algumas jurisdições não
              permitem limitações em garantias implícitas, ou limitações de responsabilidade por
              danos conseqüentes ou incidentais, essas limitações podem não se aplicar a você.
            </p>

            <h2 className="mt-10 font-poppins text-2xl font-semibold text-slate-900">
              5. Precisão dos materiais
            </h2>
            <p>
              Os materiais exibidos no site da numvapt podem incluir erros técnicos, tipográficos ou
              fotográficos. numvapt não garante que qualquer material em seu site seja preciso,
              completo ou atual. numvapt pode fazer alterações nos materiais contidos em seu site a
              qualquer momento, sem aviso prévio. No entanto, numvapt não se compromete a atualizar os
              materiais.
            </p>

            <h2 className="mt-10 font-poppins text-2xl font-semibold text-slate-900">
              6. Links
            </h2>
            <p>
              O numvapt não analisou todos os sites vinculados ao seu site e não é responsável pelo
              conteúdo de nenhum site vinculado. A inclusão de qualquer link não implica endosso por
              numvapt do site. O uso de qualquer site vinculado é por conta e risco do usuário.
            </p>

            <h2 className="mt-10 font-poppins text-2xl font-semibold text-slate-900">
              Modificações
            </h2>
            <p>
              O numvapt pode revisar estes termos de serviço do site a qualquer momento, sem aviso
              prévio. Ao usar este site, você concorda em ficar vinculado à versão atual desses
              termos de serviço.
            </p>

            <h2 className="mt-10 font-poppins text-2xl font-semibold text-slate-900">
              Lei aplicável
            </h2>
            <p>
              Estes termos e condições são regidos e interpretados de acordo com as leis do numvapt e
              você se submete irrevogavelmente à jurisdição exclusiva dos tribunais naquele estado
              ou localidade.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
