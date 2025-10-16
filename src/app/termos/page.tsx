"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TermosDeUsoPage() {
    const termosHtml = `
    <h2><span style="color: rgb(68, 68, 68);">1. Termos</span></h2><p><span style="color: rgb(68, 68, 68);">Ao acessar ao site <a href="flowupinova.com.br">FlowUp</a>, concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis ​​e concorda que é responsável pelo cumprimento de todas as leis locais aplicáveis. Se você não concordar com algum desses termos, está proibido de usar ou acessar este site. Os materiais contidos neste site são protegidos pelas leis de direitos autorais e marcas comerciais aplicáveis.</span></p><h2><span style="color: rgb(68, 68, 68);">2. Uso de Licença</span></h2><p><span style="color: rgb(68, 68, 68);">É concedida permissão para baixar temporariamente uma cópia dos materiais (informações ou software) no site FlowUp , apenas para visualização transitória pessoal e não comercial. Esta é a concessão de uma licença, não uma transferência de título e, sob esta licença, você não pode:&nbsp;</span></p><ol><li><span style="color: rgb(68, 68, 68);">modificar ou copiar os materiais;&nbsp;</span></li><li><span style="color: rgb(68, 68, 68);">usar os materiais para qualquer finalidade comercial ou para exibição pública (comercial ou não comercial);&nbsp;</span></li><li><span style="color: rgb(68, 68, 68);">tentar descompilar ou fazer engenharia reversa de qualquer software contido no site FlowUp;&nbsp;</span></li><li><span style="color: rgb(68, 68, 68);">remover quaisquer direitos autorais ou outras notações de propriedade dos materiais; ou&nbsp;</span></li><li><span style="color: rgb(68, 68, 68);">transferir os materiais para outra pessoa ou 'espelhe' os materiais em qualquer outro servidor.</span></li></ol><p><span style="color: rgb(68, 68, 68);">Esta licença será automaticamente rescindida se você violar alguma dessas restrições e poderá ser rescindida por FlowUp a qualquer momento. Ao encerrar a visualização desses materiais ou após o término desta licença, você deve apagar todos os materiais baixados em sua posse, seja em formato eletrónico ou impresso.</span></p><h2><span style="color: rgb(68, 68, 68);">3. Isenção de responsabilidade</span></h2><ol><li><span style="color: rgb(68, 68, 68);">Os materiais no site da FlowUp são fornecidos 'como estão'. FlowUp não oferece garantias, expressas ou implícitas, e, por este meio, isenta e nega todas as outras garantias, incluindo, sem limitação, garantias implícitas ou condições de comercialização, adequação a um fim específico ou não violação de propriedade intelectual ou outra violação de direitos.</span></li><li><span style="color: rgb(68, 68, 68);">Além disso, o FlowUp não garante ou faz qualquer representação relativa à precisão, aos resultados prováveis ​​ou à confiabilidade do uso dos materiais em seu site ou de outra forma relacionado a esses materiais ou em sites vinculados a este site.</span></li></ol><h2><span style="color: rgb(68, 68, 68);">4. Limitações</span></h2><p><span style="color: rgb(68, 68, 68);">Em nenhum caso o FlowUp ou seus fornecedores serão responsáveis ​​por quaisquer danos (incluindo, sem limitação, danos por perda de dados ou lucro ou devido a interrupção dos negócios) decorrentes do uso ou da incapacidade de usar os materiais em FlowUp, mesmo que FlowUp ou um representante autorizado da FlowUp tenha sido notificado oralmente ou por escrito da possibilidade de tais danos. Como algumas jurisdições não permitem limitações em garantias implícitas, ou limitações de responsabilidade por danos conseqüentes ou incidentais, essas limitações podem não se aplicar a você.</span></p><h2><span style="color: rgb(68, 68, 68);">5. Precisão dos materiais</span></h2><p><span style="color: rgb(68, 68, 68);">Os materiais exibidos no site da FlowUp podem incluir erros técnicos, tipográficos ou fotográficos. FlowUp não garante que qualquer material em seu site seja preciso, completo ou atual. FlowUp pode fazer alterações nos materiais contidos em seu site a qualquer momento, sem aviso prévio. No entanto, FlowUp não se compromete a atualizar os materiais.</span></p><h2><span style="color: rgb(68, 68, 68);">6. Links</span></h2><p><span style="color: rgb(68, 68, 68);">O FlowUp não analisou todos os sites vinculados ao seu site e não é responsável pelo conteúdo de nenhum site vinculado. A inclusão de qualquer link não implica endosso por FlowUp do site. O uso de qualquer site vinculado é por conta e risco do usuário.</span></p><p><br></p><h3><span style="color: rgb(68, 68, 68);">Modificações</span></h3><p><span style="color: rgb(68, 68, 68);">O FlowUp pode revisar estes termos de serviço do site a qualquer momento, sem aviso prévio. Ao usar este site, você concorda em ficar vinculado à versão atual desses termos de serviço.</span></p><h3><span style="color: rgb(68, 68, 68);">Lei aplicável</span></h3><p><span style="color: rgb(68, 68, 68);">Estes termos e condições são regidos e interpretados de acordo com as leis do FlowUp e você se submete irrevogavelmente à jurisdição exclusiva dos tribunais naquele estado ou localidade.</span></p>
    `;

    return (
        <div className="bg-gray-50 min-h-screen py-12 px-4">
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
                 .terms-content ol {
                    list-style-type: decimal;
                    padding-left: 1.5rem;
                    margin-top: 1rem;
                    margin-bottom: 1rem;
                }
                .terms-content a {
                    color: #2563eb;
                    text-decoration: underline;
                }
            `}</style>
            <div className="max-w-4xl mx-auto">
                <Button variant="ghost" asChild className='mb-4'>
                    <Link href="/">
                        <ArrowLeft className="w-4 h-4 mr-2"/>
                        Voltar para a Home
                    </Link>
                </Button>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold">Termos de Uso</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div 
                            className="terms-content"
                            dangerouslySetInnerHTML={{ __html: termosHtml }} 
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
