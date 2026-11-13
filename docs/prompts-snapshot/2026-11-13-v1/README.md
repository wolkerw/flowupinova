# Snapshot dos prompts de imagem — v1 (13/11/2026)

Estado dos prompts de geração de imagem **antes** do motor de prompt v2.
Use este snapshot para comparar resultados ou voltar ao estado anterior.

## O que está salvo

| Item | Onde |
|---|---|
| Código dos prompts (versão commitada em `6ed3842a`) | `code/*.ts.txt` |
| Prompts editáveis do admin (`system_settings/prompts`) | `firestore-prompts.json` |
| Modelos de IA em produção (`settings/aiModels`) | `firestore-prompts.json` |
| Webhooks (`settings/global`) | `firestore-prompts.json` |
| Comandos de estilo (`ai_style_commands`, 77 docs) | `firestore-prompts.json` |

Git tag do código: **`prompts-v1-2026-11-13`**.

Modelos em produção no momento do snapshot: planejador `gpt-6.1-sol`, imagem `gpt-image-2.6-sunburst`
(reserva `gpt-image-2.6-flare`), qualidade `medium`.

## Como voltar ao estado anterior

1. **Mais rápido (sem deploy):** o motor v1 continua no código. Basta manter
   `settings/aiModels.promptEngineVersion = "v1"` no Firestore (é o padrão quando o campo não existe).
2. **Código:** `git checkout prompts-v1-2026-11-13 -- <arquivo>` restaura qualquer arquivo de prompt.
3. **Prompts do admin (Firestore):** os valores originais estão em `firestore-prompts.json`;
   cole-os de volta em Configurações → Prompts ou regrave o documento `system_settings/prompts`.
