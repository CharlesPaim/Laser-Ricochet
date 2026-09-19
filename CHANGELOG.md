# Changelog — Laser Ricochet: Blade Deflector

Todas as mudanças notáveis deste projeto são documentadas neste arquivo de acordo com o padrão [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/) e [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [5.4.3] — 2026-09-19
### Balanceamento & Correção (Chefe Dreadnought)
- **Calibração de HP da Fortaleza Dreadnought:** HP base na Onda 5 reduzido de 6 para 4 (`baseHp: 4`), permitindo um ritmo de combate justo e gratificante.
- **Deflexão Normal do Mega-Beam com Dano:** Contato normal com a lâmina agora reflete o feixe colossal de volta à fortaleza causando 1 de dano (`megaBeamNormalDamage: 1`), enquanto o Parry Perfeito premia o jogador com 2 de dano crítico (`megaBeamParryDamage: 2`), eliminando o bloqueio de dano 0 caso o parry não fosse acionado com timing perfeito.
- **Escudo de Emergência Pós-Ciclo Reduzido:** Reativação do escudo da fortaleza ao término da fase de vulnerabilidade agora regenera apenas 1 ponto de escudo (`shieldRestoreOnCycle: 1`) em vez dos 3 pontos máximos, premiando o esforço de quebra de escudo anterior e encurtando ciclos subsequentes.
- **Janela de Vulnerabilidade Estendida:** Duração do estado desprotegido aumentada de 5000ms para 6000ms (`vulnerableDurationMs: 6000`), garantindo tempo suficiente para manobrar e contra-atacar com sucesso.

---

## [5.4.2] — 2026-09-19
### Corrigido
- **Dissipação na Blindagem do Nemesis:** Disparos não-letais que atingem a carcaça/chassi do Nemesis agora são absorvidos e dissipados no impacto (`GUARDED`) com faíscas metálicas, eliminando o loop de desaceleração infinita ("efeito Zeno") e a presença de tiros residuais parados na arena.
- **Safeguard Anti-Congelamento de Projéteis:** Adicionada rotina de descarte automático para projéteis com velocidade anômala abaixo de 45 px/s, garantindo zero projéteis congelados ou órfãos no canvas.
- **Cadência de Tiro Confiável do Chefe:** Remoção de trava estática em `rallyInFlight()` e garantia de avanço para novo disparo em 1.4s a 2.2s sempre que não houver rali em curso, impedindo que o chefe fique vagando em órbita sem atacar.

---

## [5.4.1] — 2026-09-19
### Corrigido
- **Clash Break na Lâmina do Nemesis:** Ao rebater projéteis em Tier letal (Tier 3+ / 3º round de rally), o impacto direto contra a foice/lâmina do Nemesis agora quebra sua guarda (Guard Break) instantaneamente em vez de ricochetear infinitamente, causando 1 de dano e forçando estado de atordoamento (`recover`).
- **Balanceamento de HP do Chefe (Onda 10):** HP calibrado para 3 pontos na Onda 10 (em vez de 5), exigindo 3 trocas letais completas e limpas para a vitória.
- **Janela de Punição Ampliada:** Duração do atordoamento (`recoverMs`) aumentada de 950ms para 1500ms, permitindo que lasers refletidos durante a recuperação causem dano direto adicional à carcaça desprotegida.
- **Calibração de Velocidade de Rally:** Teto máximo de velocidade de Deadly Rally reduzido de 1150 px/s para 750 px/s (com rampa de 1.15x por batida), garantindo tempo de reação ágil e jogabilidade justa em telas mobile e desktop.

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
