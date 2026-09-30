# Uso de agentes de IA en el proyecto

La fuente común es [`AGENTS.md`](../AGENTS.md). Sus reglas cubren alcance, cooperación, seguridad, aprobación previa y pruebas unitarias focalizadas. Los archivos de cada herramienta son entradas breves para evitar instrucciones duplicadas y desactualizadas. Los permisos configurados en cada herramienta siguen siendo necesarios: una instrucción de Markdown por sí sola no bloquea técnicamente una acción.

| Asistente | Archivo que usa en este repositorio | Cómo aplicarlo |
| --- | --- | --- |
| OpenAI Codex | [`AGENTS.md`](../AGENTS.md) | Abrir la tarea desde la raíz del repositorio. |
| Claude Code | [`CLAUDE.md`](../CLAUDE.md) | El archivo remite a la regla común. |
| Gemini CLI | [`GEMINI.md`](../GEMINI.md) | Importa la regla común con `@./AGENTS.md`. |
| GitHub Copilot | [`.github/copilot-instructions.md`](../.github/copilot-instructions.md) | Usar una superficie de Copilot que admita instrucciones de repositorio. |
| Cursor | [`.cursor/rules/project-safety.mdc`](../.cursor/rules/project-safety.mdc) | Regla de proyecto siempre activa que remite a `AGENTS.md`. |
| Windsurf / Cascade | [`AGENTS.md`](../AGENTS.md) | La regla raíz se carga para el espacio de trabajo. |
| Cline | [`AGENTS.md`](../AGENTS.md) | Cline reconoce esta regla compartida. |

Para un chat general de ChatGPT, Claude o Gemini sin acceso a los archivos, adjunta `AGENTS.md` al inicio de la tarea. No supongas que un chat externo ve automáticamente el repositorio.

## Aprobación antes de cambios de riesgo

El agente debe presentar una propuesta concreta y esperar la respuesta del usuario. Modelo breve:

> Quiero modificar `ruta/archivo` para [motivo]. Esto afecta [módulos/datos/personas] y el riesgo es [consecuencia]. La reversión sería [paso]. ¿Apruebas este cambio concreto?

No ejecutar la edición o eliminación mientras se espera la respuesta. Una tarea general ni un modo automático sustituyen esa aprobación. Para cambios pequeños y reversibles dentro de la tarea asignada, el agente puede continuar y reportar el resultado.

## Pruebas actuales

Al redactar esta guía, `Frontend/` y `Mobile/` tienen scripts de Vite para desarrollo y compilación, pero no tienen script `test`; `Backend/` todavía no tiene implementación. Por ello, hoy no se debe informar una compilación como prueba unitaria. Cuando se configure un runner, ejecutar primero la prueba afectada y reservar la suite completa para integración o cambios compartidos.

## Referencias de formatos

- [Codex: uso de `AGENTS.md`](https://developers.openai.com/cookbook/articles/codex_exec_plans)
- [Claude Code: memoria del proyecto](https://code.claude.com/docs/en/memory)
- [Gemini CLI: `GEMINI.md`](https://geminicli.com/docs/cli/gemini-md/)
- [GitHub Copilot: instrucciones de repositorio](https://docs.github.com/en/copilot/reference/custom-instructions-support)
- [Cursor: reglas de proyecto](https://docs.cursor.com/context/rules)
- [Windsurf / Cascade: reglas y `AGENTS.md`](https://docs.windsurf.com/windsurf/cascade/memories)
- [Cline: reglas compatibles](https://docs.cline.bot/customization/cline-rules)
