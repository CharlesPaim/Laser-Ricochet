# Changelog — Laser Ricochet: Blade Deflector

Todas as mudanças notáveis deste projeto são documentadas neste arquivo de acordo com o padrão [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/) e [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [5.4.0] — 2026-09-19
### Adicionado
- **Chefe Shadow Deflector (Nemesis):** Aparição alternada nas Ondas 10, 20, 30... em duelo de espelho 1v1 com lâmina orbital própria, dashes de alta velocidade e contra-ataques precisos.
- **Mecânica de Deadly Rally:** Projéteis rebatidos entre o jogador e a lâmina do Nemesis aceleram continuamente (+16% por clash até 1150 px/s) com escalada cromática de 4 tiers (Ciano $\rightarrow$ Âmbar $\rightarrow$ Carmesim $\rightarrow$ Plasma Branco).
- **Quebra de Guarda (Guard Break):** Disparos letais (Tier 3+) superam o escudo do Nemesis, atordoando-o em estado `recover` por 950ms e drenando HP.
- **Web Audio Procedural:** 6 novos sintetizadores FM inarmônicos (`nemesisSpawn`, `nemesisDash`, `rallyClash`, `rallyBreak`, `rallyLost`, `nemesisDown`).
- **Playtest Rápido:** Suporte ao parâmetro de URL `?wave=X` para saltar direto para chefes ou fases específicas.
- **Badge de Versão e Modal de Patch Notes:** Versão exibida na tela inicial com acesso diegético às notas de atualização.

---

## [5.3.0] — 2026-09-19
### Corrigido
- **Eliminação de Sobreposições no Game Over:** Ancoragem das estatísticas pelo topo (`setOrigin(0.5, 0)`) com respiro vertical garantido de 10 a 45px contra os botões de ação em mobile e desktop.
- **Ocultação de Micro-Quest no Fim de Jogo:** Supressão do texto de quest durante a tela de Game Over para evitar colisões com o cartão.
- **Banner de Recorde Pessoal:** Ajuste de layout dinâmico que sobe harmoniosamente quando não há quebra de recorde.

---

## [5.2.0] — 2026-09-19
### Modificado
- **Calibração de Ganho Web Audio:** Amplificação de volume da BGM de combate regular (0.36) e do chefe (0.50) com ganho de estágio unificado e sem atenuação cumulativa em barramentos filhos.
- **Equilíbrio Sonoro:** Headroom balanceado entre SFX procedurais e sintetizadores de baixo/lead.

---

## [5.1.0] — 2026-09-19
### Adicionado
- **Botões Arcade Táteis:** Botões sólidos de alta visibilidade com bordas luminescentes para Iniciar Missão, Reviver (+2 HP) e Reiniciar Missão.
- **Legibilidade Mobile nos Cards Mini-Rogue:** Dimensões ampliadas para 230x245px com fonte de 15px+ e botões de toque com padding de 16x7px.
- **Resiliência Poki Fora de Domínio:** Detecção inteligente de ambientes de staging/preview (`github.io`, `vercel.app`) para suprimir alertas de site-lock.

---

## [5.0.0] — 2026-09-18
### Adicionado
- **Arquitetura Mobile Dual-Thumb:** Joystick virtual flutuante de 360° no polegar esquerdo e Botão Neon de Parry (`⚡ PARRY`) de alta sensibilidade no polegar direito.
- **Deflexão 2D:** O joystick governa simultaneamente o ângulo (360°) e o raio orbital da lâmina (65px a 160px) com anéis concêntricos diegéticos.
- **Suporte a Multitouch:** Habilitação nativa de até 3 toques simultâneos (`input.activePointers: 3`).
- **Modo Desktop 1:1:** HUD limpo e sem botões de toque na tela quando operado com mouse.
