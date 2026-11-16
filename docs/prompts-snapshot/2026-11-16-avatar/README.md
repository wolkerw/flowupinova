# Snapshot do prompt da Foto Profissional (avatar) — 16/11/2026

Estado do fluxo `src/app/api/avatar/generate/route.ts` **antes** do prompt v2 de fidelidade facial.

| Arquivo | O que é |
|---|---|
| `route.HEAD-producao.ts.txt` | Versão commitada (produção): só Gemini Nano Banana Pro, sem formato vertical |
| `route.working-copy-antes-do-prompt-v2.ts.txt` | Cópia de trabalho com GPT-image-2.6 Sunburst como principal (alterações de outro agente, ainda não commitadas) e o prompt original em português |

## Como voltar ao prompt anterior

- **Sem deploy:** grave `settings/aiModels.avatarPromptVersion = "v1"` no Firestore. O prompt original continua no código e volta a ser usado.
- **Código:** restaure a partir dos arquivos acima.
