# Especificação Completa de Requisitos de Produto e Técnicos (PRD / SRS)
## Laser Ricochet: Blade Deflector (v3.0 — Cinematic Arena & Modular Engine Edition)

- **Código do Experimento:** EXP-005  
- **Versão:** v3.0 (Cinematic Arena, Procedural BGM, Recurring Bosses & Modular Rendering)  
- **Data da Versão:** 18 de Setembro de 2026  
- **Status de Homologação:** Aprovado em 23/23 testes de Playtest, 7/7 testes de Scaffold e 207/207 testes da fábrica  
- **Stack Tecnológico:** Phaser 3.88+, TypeScript 5+, Vite 5, Web Audio API Nativa, HTML5 Canvas 2D/WebGL  
- **Bundle Metrics:** 1.54 MB uncompressed / 356.61 KB gzipped (Orçamento: < 1.6 MB)  
- **Taxa de Quadros:** 60 FPS estáveis contínuos  
- **Rastreabilidade de Aprendizados:** LRN-001 a LRN-028 integrados  

---

## 1. Visão Geral do Produto e Objetivos

### 1.1 Premissa
*Laser Ricochet: Blade Deflector* é um jogo de ação neo-arcade de alta precisão reflexiva. O jogador opera uma lâmina de plasma tangencial em um trilho orbital concêntrico para proteger um Reator Quântico central posicionado no epicentro da Estação Orbital Citadel, interceptando, angulando e refletindo lasers de plasma disparados por frotas inimigas de drones mecânicos.

### 1.2 Pilares de Design
1. **Agência Ofensiva e Expressão de Habilidade:** O jogador não apenas sobrevive bloqueando tiros, mas dita ativamente os alvos a serem destruídos através do ponto de contato na lâmina (*Angular Slicing*) e do tempo de reação (*Perfect Deflect*).
2. **Zero Atrito e Onboarding Orgânico:** Compreensão instantânea das regras em menos de 5 segundos sem interromper a imersão com tutoriais invasivos ou caixas de texto.
3. **Identidade Visual Marcante (Cinematic Arena Citadel):** Estética sci-fi arcade de alto contraste, materiais mecânicos críveis (blindagem, nervuras, núcleos incandescentes, halos difusos e parafusos chanfrados) e profundidade volumétrica procedural sem peso de assets.
4. **Áudio Dinâmico Adaptativo (Zero Asset Bloat):** Trilha sonora synthwave e dark industrial sintetizada em tempo real via Web Audio API, reagindo à intensidade das fases e batalhas de chefes sem carregar arquivos de mídia externos.
5. **Arquitetura Modular e Escalável:** Renderização gráfica desacoplada em pipelines especializados sob `src/rendering/`, mantendo a cena principal dedicada exclusivamente à simulação de regras, física e máquinas de estado.
6. **Performance Leve e Universal (Web/Poki Ready):** 60 FPS contínuos em qualquer dispositivo, empacotamento ultraleve (< 1.6 MB) e conformidade absoluta com padrões de publicação web.

---

## 2. Requisitos Funcionais (RF)

### RF-01: Controle Polar Instantâneo 1:1 da Lâmina (Ergonomia de Entrada)
- **RF-01.1 (Mapeamento Polar):** A lâmina segue a posição do ponteiro (mouse ou touch) convertida em coordenadas polares relativas ao centro da arena `(cx: 480, cy: 270)`.
- **RF-01.2 (Inércia Zero):** Rastreamento instantâneo (1:1), sem suavização, interpolação ou arraste amortecido, garantindo fidelidade direta ao movimento do jogador.
- **RF-01.3 (Alinhamento Tangencial):** A orientação angular da lâmina é perpendicular ao vetor de raio que parte do centro da arena até a lâmina (`angle = atan2(dy, dx) + π/2`).
- **RF-01.4 (Suporte Multi-Entrada):** Suporte nativo e transparente a Mouse (Desktop), Toque Direto (Mobile/Tablet) e Teclado para ações auxiliares (Espaço para Parry, R para reinício).
- **RF-01.5 (Feixe Diegético de Ancoragem):** Raio holográfico ciano translúcido conectando o hub central à lâmina, proporcionando ancoragem visual imediata da posição polar do jogador.

### RF-02: Trilho Orbital Defensivo Estrito
- **RF-02.1 (Limites Radiais):** O movimento da lâmina é contido entre um raio mínimo (`minOrbitRadius = 65px`) e um raio máximo (`maxOrbitRadius = 160px`).
- **RF-02.2 (Proteção do Reator):** O limite inferior de 65px impede que o jogador cole a lâmina na carcaça do reator central (raio 28px).
- **RF-02.3 (Barreira Anti-Spawn-Camping):** A distância de órbita dos drones inimigos é de 235px. A zona de exclusão de 75px entre a lâmina (máx 160px) e os drones impede o bloqueio instantâneo do disparo na boca do canhão.

### RF-03: Deadzone Polar Central do Núcleo
- **RF-03.1 (Raio de Exclusão):** Zona morta polar de raio 28px em torno do centro `(cx, cy)`.
- **RF-03.2 (Estabilidade de Ângulo):** Quando o cursor transita dentro da área central, os eventos de rotação abrupta (flips involuntários de 180°) são suprimidos, congelando o último ângulo válido da lâmina.

### RF-04: Deflexão Balística com Angular Slicing (Agência Direcional Ativa)
- **RF-04.1 (Fórmula de Reflexão):** A deflexão básica aplica reflexão especular em relação à normal da lâmina (`R = V - 2 * (V · N) * N`).
- **RF-04.2 (Angular Slicing):** O ponto de impacto relativo ao comprimento da lâmina (-1 no extremo esquerdo a +1 no extremo direito) introduz um desvio angular intencional de até **±55 graus (0.96 radianos)**:
  - *Impacto Central:* Reflexão alinhada com a normal (tiro reto).
  - *Impacto nas Pontas:* Desvio angular agudo em direção à extremidade atingida, permitindo ao jogador mirar lateralmente.
- **RF-04.3 (Homing Assist Sutil):** Assistência balística limitada a 16% (`homingStrength = 0.16`), servindo apenas como atrator sutil sem sobrepor a mira do jogador.
- **RF-04.4 (Micro-Vetor Transitório):** Raio tátil de 65px indicando a trajetória de saída no ponto de colisão por **160ms**.

### RF-05: Mecânica de Parry Perfeito (Perfect Deflect)
- **RF-05.1 (Janela de Ativação):** Disparado via clique com botão esquerdo do mouse, toque na tela ou barra de espaço, abrindo uma janela de contra-ataque de **160 milissegundos**.
- **RF-05.2 (Multiplicador de Velocidade):** Projéteis interceptados durante a janela de Parry recebem aceleração de **1.45x**.
- **RF-05.3 (Feedback Audiovisual de Parry):**
  - Flash solar dourado (`0xffea00`) na lâmina com ampliação temporária de brilho.
  - Congelamento tátil de quadros (*hitstop*) de **45 milissegundos**.
  - Trepidação de tela (*screen shake*) com intensidade 0.007 por **90 milissegundos**.
  - Síntese de impacto metálico inarmônico com 4 frequências parciais e ruído filtrado em 4200Hz.
  - Flutuador de texto com pontuação de contra-ataque.

### RF-06: Sistema de Combos, Streaks de Maestria e Modo Overload
- **RF-06.1 (Contador de Combos):** Cada laser interceptado e refletido com sucesso contra qualquer inimigo incrementa o combo.
- **RF-06.2 (Reset de Combo):** Qualquer dano sofrido pelo Reator Quântico zera imediatamente o contador de combos.
- **RF-06.3 (Tiers de Streak):**
  - *Tier 1 (3 Acertos):* Banner de telemetria ciano, síntese sonora ascendente.
  - *Tier 2 (5 Acertos):* Banner dourado cintilante, hitstop de 45ms.
  - *Tier 3 (8+ Acertos - Godlike):* Banner magenta luminoso, hitstop de 70ms e tremor de tela de 140ms.
- **RF-06.4 (Modo Overload):**
  - Ao atingir 3 deflexões consecutivas sem sofrer dano, a lâmina entra em **Overload**.
  - A lâmina adquire filamentos de plasma magenta (`0xff0099`) com arcos elétricos crepitantes.
  - O próximo projétil refletido é convertido em um **Disparo de Fragmentação Tripla** (3 estilhaços dourados em leque divergente de alta velocidade).

### RF-07: Arquétipos de Inimigos com Silhuetas Mecânicas Exclusivas (LRN-028)
Construídos sob o paradigma de 5 camadas de materialidade (*Base + Estrutura + Emissivo + Luz + Detalhe*):
1. **Standard Drone (Caça Delta de Vanguarda):**
   - *Silhueta:* Fuselagem delta esguia, blindagem escura, propulsores gêmeos traseiros, sensor óptico central e cano frontal.
   - *Status:* 1 HP, projétil rosa choque (`#ff2a6d`), cadência 2.2s - 3.6s, velocidade 190 px/s (+8 px/s por onda).
2. **Heavy Drone (Bunker Diamante Blindado):**
   - *Silhueta:* Chassi reforçado em forma de diamante octogonal, costuras de blindagem de titânio, núcleo reator âmbar e cano reforçado duplo.
   - *Status:* 2 HP, projétil esférico de fusão denso, cadência 3.0s - 4.2s, velocidade 98 px/s.
   - *Mecânica Especial (Shockwave Burst):* Parry perfeito no tiro pesado gera uma **Onda de Choque de 95px** que detona todos os projéteis inimigos adjacentes.
3. **Sniper Drone (Fragata Gauss Agulha):**
   - *Silhueta:* Casco em agulha longa com trilhos aceleradores paralelos ciano e bobinas magnéticas duplas.
   - *Status:* 1 HP, projétil supersônico a **370 px/s**, cadência 2.6s - 3.8s.
   - *Telegraph Tático:* Linha de mira laser contínua apontando ao núcleo por **1200ms** antes do disparo.
4. **Scatter Drone (Catamarã Duplo de Supressão):**
   - *Silhueta:* Casco duplo articulado estilo catamarã com canhões independentes nos pods esquerdo e direito e capacitor central roxo.
   - *Status:* 1 HP, 2 projéteis paralelos a 190 px/s com divergência de **32 graus (±0.28 rad)**, cadência 2.5s - 3.6s.
5. **Dreadnought Boss (Nau Capitânia Multi-Deck — Chefão Periódico a Cada 5 Fases):**
   - *Silhueta:* Superestrutura pesada multi-deck com baterias triplas de canhões pesados, proa angular, reator quântico e anel de propulsão.
   - *Status:* Vida base 6 HP (+2 HP/tier), escudo frontal base 3 pips (+1 pip a cada 2 tiers), cadência 2.0s - 2.8s.
   - *Pips de Escudo Flutuantes:* Nós holográficos dourados flutuando sobre o casco indicando a integridade restante da barreira.
   - *Fase 1 (Barrage Shield):* Escudo frontal ciano ativo absorve impactos de laser refletidos.
   - *Fase 2 (Reator Exposto / Mega-Beam):* Escudo colapsa; reator emite pulso de alerta vermelho/âmbar; carrega e dispara um **Mega-Raio de Plasma** (380 px/s, raio 18px).
   - *Contra-Golpe Crítico:* Parry Perfeito no Mega-Raio causa **dano crítico massivo de -3 HP**.

### RF-08: Ciclos de Chefes Recorrentes com Progressão Dinâmica (LRN-025)
- **RF-08.1 (Periodicidade Fixa):** Aparição garantida a cada 5 fases (Wave 5, 10, 15, 20...).
- **RF-08.2 (Escalonamento Paramétrico):**
  - Vida: `HP = 6 + (tier - 1) * 2`.
  - Escudos: `Pips = 3 + floor((tier - 1) * 0.5)`.
- **RF-08.3 (Frotas de Escolta):**
  - Wave 5 (Tier 1): Dreadnought Boss + 1 Sniper + 1 Scatter.
  - Wave 10 (Tier 2): Dreadnought Boss + 1 Sniper + 1 Heavy blindado.
  - Wave 15+ (Tier 3+): Dreadnought Boss + frota completa de suporte em contra-rotação.
- **RF-08.4 (Dramatização de Confronto):** Ativação imediata da **Boss BGM (138 BPM)** e banner de alerta geral na tela.

### RF-09: Mecânica Anti-Camping / Duelo Final (Lone Cannon Enrage)
- **RF-09.1 (Gatilho):** Acionado quando resta exatamente 1 único drone na arena (a partir da Wave 2).
- **RF-09.2 (Modificadores):** Velocidade orbital multiplicada em **1.85x**, cadência de disparo comprimida para **0.95s a 1.35s**, telegrafia encurtada para **400ms** e alarme sonoro de sobrecarga.

### RF-10: Onboarding Orgânico da Wave 1 e Progressão de Ondas
- **RF-10.1 (Wave 1 Onboarding):** Exatamente 1 drone Standard estático posicionado no topo (`-Math.PI / 2`), com primeiro tiro atrasado em 2.8s e cadência relaxada (3.4s - 4.0s).
- **RF-10.2 (Recompensa de Fase):** Regeneração de **+1 HP** ao Reator Quântico e conversão de power-ups restantes em **+100 pontos bônus** ao vencer a onda.

### RF-11: Sistema de Cápsulas de Power-up Orbitais
- **RF-11.1 (Drop):** 35% de chance ao destruir drones (máximo de 1 cápsula ativa na arena).
- **RF-11.2 (Deriva Centrípeta):** Deslocamento contínuo em direção ao centro a 28 px/s com anel de decaimento temporal regressivo de 7 segundos.
- **RF-11.3 (Variantes):** *Blade Boost* (lâmina estendida), *Core Shield* (escudo hexagonal com satélites), *Slow-Mo* (câmera lenta de 50%) e *Multi-Beam* (lasers triplos).

### RF-12: Estados Reativos do Reator e Pips Radiais de Integridade (LRN-026)
- **RF-12.1 (Pips Radiais Concêntricos):** 5 orbes de integridade posicionados na órbita concêntrica a 22px do núcleo, permitindo leitura imediata da vida por visão periférica sem desviar o foco da lâmina.
- **RF-12.2 (Estado Estável - HP ≥ 4):** Emissão em ciano elétrico brilhante (`#00f3ff`), garras de titânio estáveis e pulsação suave.
- **RF-12.3 (Estado Alerta - HP 2-3):** Núcleo comuta para tom âmbar incandescente (`#ffaa00`), rotação acelerada dos anéis eletromagnéticos.
- **RF-12.4 (Estado Crítico - HP = 1):** Sobrecarga estroboscópica carmesim (`#ff1744`), garras avermelhadas e emissão contínua de centelhas de fusão em fuga.

### RF-13: Destruição Audiovisual Reforçada em 300ms (LRN-023)
- **RF-13.1 (Visual):** Flash estroboscópico de impacto, anel de choque expansivo duplo e 12 a 24 estilhaços poligonais incandescentes com rotação física radial.
- **RF-13.2 (Áudio Dedicado por Arquétipo):**
  - Standard: Estalo percussivo agudo + rumble curto.
  - Heavy: Impacto duplo sub-grave profundo (80Hz -> 30Hz).
  - Sniper: Fragmentação cristalina em 3600Hz.
  - Boss: Detonação em cascata com 3 impactos consecutivos e tremor sísmico.

### RF-14: Sistema de Trilha Sonora Procedural Adaptativa (BGM Engine - LRN-024)
- **RF-14.1 (BGM Regular - 120 BPM):** Linha de baixo synthwave pulsante em Lá menor (`A2 -> C3 -> D3 -> E3`), arpejos de 16 avos e pratos filtrados simulando drum machine vintage.
- **RF-14.2 (Boss BGM - 138 BPM):** Andamento acelerado, pulso contundente de bumbo sintético a cada tempo, caixa industrial pesada e linha de baixo sincopada em Ré menor.
- **RF-14.3 (Transições Suaves):** Rampa de ganho suave de 350ms na transição entre ondas comuns e chefões.
- **RF-14.4 (Zero Asset Bloat):** 100% sintetizado em tempo real via Web Audio API, sem nenhum arquivo de áudio carregado da rede.

### RF-15: Auto-Pause com Compensação Temporal de Timers (LRN-017)
- **RF-15.1 (Detecção):** Acionamento imediato em eventos `blur` ou `visibilitychange`.
- **RF-15.2 (Compensação):** Todos os timers agendados (`nextFireTime`) dos drones são deslocados para frente pelo delta exato do tempo pausado, prevenindo rajadas simultâneas injustas no retorno.
- **RF-15.3 (Suspensão de Áudio):** Silenciamento e retomada contínua do BGM e do hum ambiente.

### RF-16: Interface do Usuário (HUD Neon e Cyber-Cards em Vidro Fosco - LRN-019)
- **RF-16.1 (Cantoneiras Táticas):** Molduras de arcade nos 4 cantos da viewport e retículo central de mira.
- **RF-16.2 (Cyber-Cards Chanfrados):** Modais de Start, Pause e Game Over desenhados com polígonos chanfrados de 8 vértices em vidro fosco cibernético e scanlines decorativas.
- **RF-16.3 (Telemetria):** Exibição em tempo real de Placar, Maior Combo, Recorde Histórico, Total de Parries Perfeitos e Chefes Derrotados.

### RF-17: Persistência e Métricas
- **RF-17.1 (Storage):** Persistência resiliente no `localStorage` sob a chave `laser_ricochet_stats` com fallback para memória volátil.
- **RF-17.2 (Telemetria):** Emissão de eventos estruturados em `window.__GAME_METRICS__`.

---

## 3. Requisitos Não Funcionais (RNF)

### RNF-01: Desempenho e Taxa de Quadros (Performance & 60 FPS)
- **RNF-01.1 (Taxa Contínua):** 60 quadros por segundo estáveis em 100% do tempo de gameplay.
- **RNF-01.2 (Orçamento de Frame):** Tempo de processamento por quadro inferior a **16.6 milissegundos**.
- **RNF-01.3 (Zero Garbage Collection Spikes):** Reutilização de arrays e vetores de colisão para prevenir engasgos por coleta de lixo.

### RNF-02: Zero Asset Bloat e Tamanho do Pacote
- **RNF-02.1 (Tamanho Máximo do Bundle):** Pacote compilado e minificado inferior a **1.6 MB** (resultado atual: **1.54 MB** uncompressed / **356 KB** gzipped).
- **RNF-02.2 (Zero Imagens Externas):** Proibido carregar arquivos PNG/JPG/WebP. Todo o grafismo é sintetizado via HTML5 Canvas 2D e WebGL nativo.
- **RNF-02.3 (Zero Arquivos de Áudio Externos):** Proibido carregar arquivos MP3/WAV/OGG. Efeitos sonoros e trilhas são sintetizados em tempo real via Web Audio API.

### RNF-03: Renderização Otimizada Off-Screen (Texture Baking - LRN-021)
- **RNF-03.1 (Pre-Bake da Arena Citadel):** O cenário multicamadas (nebulosas procedurais, megaestruturas em parallax, starfield em 3 planos com espículas, deck de titânio e trincheira mecânica) é pré-renderizado uma única vez durante o `create()` em um canvas off-screen e registrado no Phaser Texture Manager como `arena_citadel`.
- **RNF-03.2 (Custo de Draw Zero):** Renderizado no loop de jogo como um sprite estático com custo de **0.00ms** por frame.

### RNF-04: Preservação de Física com Apresentação Visual Curva (LRN-022)
- **RNF-04.1 (Fidelidade Geométrica):** A apresentação curva da lâmina em foice crescente preserva integralmente a fórmula linear de colisão por segmento de reta (`distPointToSegment`), assegurando zero bugs de túnel balístico e consistência física total.

### RNF-05: Arquitetura Modular de Pipelines de Renderização (LRN-027)
- **RNF-05.1 (Desacoplamento de Responsabilidades):** A renderização gráfica deve ser isolada em pipelines especializados desacoplados sob `src/rendering/`:
  - `ArenaRenderer.ts` (Pré-bake da plataforma orbital Citadel);
  - `CoreRenderer.ts` (Reator de fusão volumétrico e pips radiais);
  - `BladeRenderer.ts` (Lâmina energética, espinha de carbono e feixe guia);
  - `LaserRenderer.ts` (Projéteis de plasma e caudas de cometa);
  - `CannonRenderer.ts` (Fuselagens militares e telegrafia);
  - `EffectsRenderer.ts` (Destruição, estilhaços, centelhas e power-ups);
  - `HudRenderer.ts` (Cantoneiras táticas, grades e cyber-cards modais).
- **RNF-05.2 (Pureza da Cena):** A classe `GameScene.ts` deve concentrar exclusivamente o ciclo de vida, input, física de colisão e máquinas de estado.

### RNF-06: Princípio de Materialidade Sci-Fi (LRN-028)
- **RNF-06.1 (Padrão de 5 Camadas):** Construção de todos os elementos mecânicos e naves militares respeitando a cadeia:
  1. *Chapa de Base:* Carcaça e blindagem em tons escuros foscos;
  2. *Estrutura:* Nervuras e costuras de reforço mecânico;
  3. *Núcleo Emissivo:* Sensor óptico ou reator interno saturado;
  4. *Halo de Luz:* Glow difuso translúcido na cor temática;
  5. *Detalhes de Superfície:* Parafusos hexagonais, bisel metálico e LEDs de telemetria.

### RNF-07: Conformidade com Padrões Poki SDK e Web Fit
- **RNF-07.1 (Viewport e Escala):** 960 x 540 pixels (proporção 16:9 widescreen), escalonada via `Phaser.Scale.FIT` com centralização automática.
- **RNF-07.2 (Isolamento de Controles):** Bloqueio de menus de contexto, gestos móveis e toques duplos acidentais (`touch-action: none; user-select: none`).
- **RNF-07.3 (Autoplay Seguro):** Ativação do áudio exclusivamente após a primeira interação do usuário (`pointerdown`).

### RNF-08: Acessibilidade e Segurança Fotossensível
- **RNF-08.1 (Diferenciação por Silhueta):** Reconhecimento imediato de todos os inimigos por formato geométrico exclusivo, garantindo acessibilidade a jogadores daltônicos.
- **RNF-08.2 (Mitigação de Fotossensibilidade):** Clarões em tela cheia e flashes estroboscópicos limitados a durações máximas de **60 a 110 milissegundos**, evitando frequências nocivas à saúde visual.

---

## 4. Matriz de Rastreabilidade com a Camada de Aprendizado (Learning Store)

| ID Aprendizado | Categoria | Descrição do Aprendizado Consolidado | Requisitos Atendidos |
| :--- | :--- | :--- | :--- |
| **LRN-001** | `PROCESS` | Autonomia e execução técnica sem mock | Governança |
| **LRN-002** | `CORE_LOOP` | Validação de física e colisão de projéteis em Phaser | RF-04, RNF-01 |
| **LRN-003** | `TECHNICAL` | Configuração de escala Phaser `FIT` e proporção 16:9 | RNF-07.1 |
| **LRN-004** | `GAME_DESIGN` | Balanceamento de velocidade de projéteis e cadência | RF-07, RF-10 |
| **LRN-005** | `PLATFORM` | Suporte a touch e eventos de ponteiro unificados | RF-01.4, RNF-07.2 |
| **LRN-006** | `TECHNICAL` | Persistência resiliente com fallback para modo privado | RF-17 |
| **LRN-007** | `CORE_LOOP` | Ergonomia polar 1:1 sem inércia e deadzone central | RF-01, RF-02, RF-03 |
| **LRN-008** | `CORE_LOOP` | Angular Slicing (desvio ativo por ponto de impacto) | RF-04.2 |
| **LRN-009** | `CORE_LOOP` | Janela de Parry de 160ms e boost balístico de 1.45x | RF-05 |
| **LRN-010** | `GAME_DESIGN` | Onboarding da Wave 1 com drone estático a 90° | RF-10.1 |
| **LRN-011** | `TECHNICAL` | Síntese de áudio procedural via Web Audio API | RNF-02.3, RF-13.2 |
| **LRN-012** | `GAME_DESIGN` | Tensão anti-camping: Lone Cannon Enrage | RF-09 |
| **LRN-013** | `TECHNICAL` | Micro-vetor transitório de direção de 160ms | RF-04.4 |
| **LRN-014** | `GAME_DESIGN` | Dreadnought Boss com escudo holográfico e Mega-Raio | RF-07.5, RF-08 |
| **LRN-015** | `GAME_DESIGN` | Sistema de cápsulas de power-up com drift centrípeto | RF-11 |
| **LRN-016** | `CORE_LOOP` | Modo Overload: disparo de fragmentação tripla | RF-06.4 |
| **LRN-017** | `PLATFORM` | Auto-pause com compensação temporal de timers | RF-15 |
| **LRN-018** | `TECHNICAL` | Telemetria estruturada em `window.__GAME_METRICS__` | RF-17.2 |
| **LRN-019** | `TECHNICAL` | Cyber-cards em vidro fosco chanfrado para UI/Modais | RF-16.2 |
| **LRN-020** | `PROCESS` | Protocolo de diagnóstico e proposta estruturada | Governança |
| **LRN-021** | `TECHNICAL` | Texturas procedurais off-screen (`arena_citadel`) | RNF-02, RNF-03 |
| **LRN-022** | `TECHNICAL` | Lâmina em foice crescente com preservação física | RF-01, RNF-04 |
| **LRN-023** | `GAME_DESIGN` | Silhuetas mecânicas únicas e destruição em 300ms | RF-07, RF-13 |
| **LRN-024** | `TECHNICAL` | Trilha sonora procedural adaptativa Regular/Boss (BGM) | RF-14, RNF-02.3 |
| **LRN-025** | `GAME_DESIGN` | Ciclo de chefes recorrentes a cada 5 fases com escalonamento | RF-08 |
| **LRN-026** | `CORE_LOOP` | Pips radiais de integridade no reator para visão periférica | RF-12.1 |
| **LRN-027** | `TECHNICAL` | Desacoplamento modular de renderização (`src/rendering/`) | RNF-05 |
| **LRN-028** | `GAME_DESIGN` | Princípio de Materialidade Sci-Fi (Padrão de 5 camadas) | RNF-06, RF-07 |

---

## 5. Critérios de Homologação e Verificação Automatizada

1. **Suite de Scaffold da Fábrica (`pytest tests/test_real_game_scaffold.py`):**
   - 7/7 testes aprovados com 100% de sucesso.
2. **Suite de Regressão Histórica da Fábrica (`pytest`):**
   - 207/207 testes aprovados sem falhas.
3. **Verificação de Compilação e Bundle (`npm run build`):**
   - TypeScript sem erros (`tsc` exit 0).
   - Bundle de produção compilado via Vite menor que 1.6 MB (1.54 MB uncompressed / 356 KB gzipped).
4. **Inspeção Visual Automatizada (Playwright Headless):**
   - 8 telas de alta resolução capturadas e validadas: Start Screen, Wave 1 Onboarding, Wave 3 Multi-Enemy, Destruição de Drone, Dreadnought Boss Wave 5, Reator Crítico (1 HP), Auto-Pause e Game Over.
