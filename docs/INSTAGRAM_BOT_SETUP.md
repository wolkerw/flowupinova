# Guia de Configuração do Chatbot do Instagram Direct (NumVapt)

Este guia orienta a conexão da conta do Instagram (`@numvapt`) ao sistema de atendimento inteligente da NumVapt (via Webhook Next.js ou via n8n).

---

## 1. Pré-requisitos na Meta
1. Conta do Instagram `@numvapt` configurada como **Conta Profissional (Comercial ou Criador)**.
2. Conta vinculada a uma **Página do Facebook** gerenciada por você.
3. No aplicativo do Instagram em seu celular:
   - Vá em `Configurações > Mensagens e respostas a stories > Ferramentas de mensagens`.
   - Certifique-se de que a opção **"Permitir acesso às mensagens"** esteja **ativada**.

---

## 2. Configuração no Meta for Developers (developers.facebook.com)

1. Acesse seu painel no [Meta for Developers](https://developers.facebook.com/apps/).
2. Abra o App existente da NumVapt (ou crie um novo do tipo **Empresa / Outro**).
3. Adicione o produto **Instagram Graph API** / **Messenger**.
4. Em **Funções do App (Roles)**:
   - Durante a fase de desenvolvimento com *Standard Access*, adicione o seu perfil do Instagram e de quem for testar como **Testador** ou **Desenvolvedor**.
5. Em **Webhooks**:
   - Selecione o objeto **Instagram**.
   - Em **Callback URL**, insira:
     ```text
     https://numvapt.com/api/webhooks/instagram
     ```
     *(ou a URL do Webhook do seu n8n: `https://webhook.flowupinova.com.br/webhook/instagram-direct`)*
   - Em **Verify Token**, insira:
     ```text
     numvapt_instagram_verify_token
     ```
   - Clique em **Verificar e Salvar**.
   - Na lista de eventos, assine o campo: **`messages`**.

---

## 3. Variáveis de Ambiente no Servidor (`.env`)

No seu arquivo `.env.local` ou nas variáveis de produção do Firebase / App Hosting, adicione:

```bash
# Token definido por você para validação do Webhook na Meta
INSTAGRAM_VERIFY_TOKEN="numvapt_instagram_verify_token"

# Page Access Token de longa duração gerado no Graph API Explorer com permissão instagram_manage_messages
INSTAGRAM_PAGE_ACCESS_TOKEN="SEU_TOKEN_DA_META_AQUI"
```

---

## 4. Como Usar no Painel Administrativo

1. Acesse o painel admin em `/admin/instagram`.
2. Todas as mensagens recebidas de seguidores aparecerão na lista lateral.
3. Para cada seguidor, você tem:
   - Histórico em tempo real de mensagens trocadas.
   - Botão **"Assumir Atendimento (Pausar IA)"**: para quando você ou seu suporte quiser conversar pessoalmente com o seguidor.
   - Botão **"Ativar IA Maia"**: para devolver a conversa ao controle automático da inteligência artificial.
   - Caixa de texto para digitação e envio imediato de resposta pelo Direct.
