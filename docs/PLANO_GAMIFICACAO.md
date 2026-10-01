# Plano de Gamificação: Jornada de Sucesso NumVapt

O objetivo deste sistema de gamificação é **incentivar ações que geram engajamento real nas redes sociais**, mostrando aos usuários que o uso consistente e estratégico da plataforma traz resultados concretos (mais visualizações, cliques e vendas).

Abaixo está o plano estruturado com os 4 objetivos principais transformados em missões claras.

---

## 🏆 Estrutura de Pontuação e Missões

### 1. Missão de Boas-Vindas (Onboarding)
**Objetivo:** Ajustar e otimizar o perfil do Google Meu Negócio (GMN).
- **Ações Necessárias:** Conectar conta GMN, garantir presença de foto de perfil/capa, e ter uma descrição de negócio preenchida.
- **Recompensa:** `+500 Pontos` e a Medalha **"Vitrine Impecável"** 🏅.
- **Por que importa?** *Mostrar ao usuário:* "Um perfil otimizado no Google aumenta em até 70% as chances de atrair visitas físicas e 50% de gerar intenção de compra. Sua vitrine digital é o seu principal cartão de visitas!"

### 2. Missão Explorador (Testando as Possibilidades)
**Objetivo:** Criar 1 post em cada fluxo disponível no NumVapt.
- **Ações Necessárias:** Utilizar as diferentes opções de fluxo de geração de conteúdo (ex: Produto, Conceito, Link, etc.) até realizar pelo menos uma publicação usando cada opção.
- **Recompensa:** `+100 Pontos` por fluxo testado + Medalha **"Mestre dos Formatos"** 🎨 ao completar todos os fluxos.
- **Por que importa?** *Mostrar ao usuário:* "Diversificar seu conteúdo mantém a audiência engajada e evita a fadiga visual. Descubra qual formato o seu público mais ama!"

### 3. Missão Consistência (Frequência Semanal e Mensal)
**Objetivo:** Manter um ritmo saudável e constante de postagens.
- **Ações Necessárias:** Realizar um mínimo definido de postagens por semana (meta sugerida: 3 posts/semana).
- **Recompensa:** 
  - `+150 Pontos` a cada semana que a meta for batida.
  - Medalha **"Relógio Suíço"** ⏱️ ao manter a sequência (streak) por 4 semanas seguidas (1 mês perfeito), com um bônus de `+500 Pontos`.
- **Por que importa?** *Mostrar ao usuário:* "O algoritmo das redes sociais prioriza contas ativas. Postar regularmente é a estratégia número 1 para garantir que sua marca seja lembrada todos os dias."

### 4. Missão Oportunidade (Datas Comemorativas)
**Objetivo:** Aproveitar a sazonalidade e feriados.
- **Ações Necessárias:** Fazer pelo menos 1 postagem no mês vinculada a uma data comemorativa ou feriado relevante daquele período.
- **Recompensa:** `+200 Pontos` e a Medalha **"Surfista de Tendências"** 🏄‍♂️.
- **Por que importa?** *Mostrar ao usuário:* "Posts temáticos geram forte conexão emocional e demonstram que sua marca está atualizada. Eles tendem a ter taxas de compartilhamento muito maiores."

---

## 🚀 Níveis de Progressão

Os pontos acumulados fazem o usuário subir de nível, indicando seu grau de maturidade digital:

1. **Iniciante Digital** (0 a 1.000 pontos) - *Dando os primeiros passos.*
2. **Criador Engajado** (1.001 a 3.000 pontos) - *Começando a chamar a atenção.*
3. **Estrategista NumVapt** (3.001 a 6.000 pontos) - *Dominando as redes e atraindo clientes.*
4. **Autoridade Local** (6.001+ pontos) - *Referência no seu nicho de atuação.*

---

## 🛠️ Especificação Técnica Inicial

1. **Tipos Firestore (`src/lib/types/gamification.ts`)**:
   - `UserGamificationDoc`: Armazena `totalPoints`, `currentLevelId`, `missions`, `badges`, `weeklyPostCount`, `lastPostDate`.
   - `MissionProgress`: Status e progresso por missão.
   - `EarnedBadge`: Registro e timestamp de medalhas conquistadas.
2. **Serviço de Dados (`src/lib/services/gamification-service.ts`)**:
   - `getUserGamification(uid)`: Busca ou inicializa o progresso do usuário.
   - `addPoints(uid, points)`: Atualiza pontuação e recalcula nível via Firestore transaction.
   - `awardBadge(uid, badgeId)`: Concede novas insígnias sem duplicidade.
