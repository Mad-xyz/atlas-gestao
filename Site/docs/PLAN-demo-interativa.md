# Plano: Demo Interativa do Sistema Atralas

## Visão Geral

Criar uma seção no site que simula o painel de gestão do Atralas, permitindo que visitantes explorem o sistema antes de criar sua academia. Algumas abas funcionam com dados mock, outras mostram popup "Crie sua academia".

---

## Arquitetura

### Estrutura de Arquivos

```
Site/
├── index.html              ← Adicionar seção #demo
├── css/
│   └── styles.css          ← Estilos da demo
├── js/
│   ├── demo.js             ← Lógica da demo interativa
│   └── main.js             ← Já existe
└── docs/
    ── PLAN-demo-interativa.md
```

### Componentes da Demo

```
┌─────────────────────────────────────────────────────────┐
│  SIDEBAR (265px)           │  ÁREA DE CONTEÚDO          │
│  ┌─────────────────────┐   │  ┌──────────────────────┐  │
│  │ Logo Atralas        │   │  │                      │  │
│  ├─────────────────────┤   │  │  Dashboard (ativo)   │  │
│  │ 📊 Dashboard ✓      │   │  │  - Stats cards       │  │
│  │ 👥 Alunos ✓         │   │  │  - Gráfico MRR       │  │
│  │ 📅 Chamada        │   │  │  - Lista alunos      │  │
│  │  Financeiro 🔒    │   │  │  - Próximos treinos  │  │
│  │ 🏆 Gamificação 🔒   │   │  │                      │  │
│  │ ⚙️ Config 🔒        │   │  └──────────────────────┘  │
│  └─────────────────────┘   │                            │
─────────────────────────────────────────────────────────┘
```

---

## Abas e Comportamento

### Abas Ativas (com dados mock)

| Aba | Ícone | Conteúdo |
|-----|-------|----------|
| **Dashboard** | `Activity` | Stats (MRR, alunos ativos, frequência), gráfico de receita, lista de alunos recentes, próximos treinos |
| **Alunos** | `Contact` | Tabela com 5-6 alunos mock (nome, turma, status, faixa), botão "Ver perfil" |

### Abas Bloqueadas (popup)

| Aba | Ícone | Mensagem Popup |
|-----|-------|----------------|
| **Chamada** | `CheckCircle2` | "Crie sua academia para gerenciar presenças e frequência" |
| **Financeiro** | `PiggyBank` | "Crie sua academia para controlar mensalidades e cobranças" |
| **Gamificação** | `Medal` | "Crie sua academia para engajar alunos com XP e conquistas" |
| **Configurações** | `Settings` | "Crie sua academia para personalizar o sistema" |

---

## Dados Mock

### Dashboard

```javascript
const mockDashboard = {
  stats: {
    mrr: 'R$ 13.396',
    alunosAtivos: 68,
    frequenciaHoje: '87%',
    novosAlunosMes: 12
  },
  receita: [
    { mes: 'Jan', valor: 11200 },
    { mes: 'Fev', valor: 11800 },
    { mes: 'Mar', valor: 12400 },
    { mes: 'Abr', valor: 12900 },
    { mes: 'Mai', valor: 13396 }
  ],
  alunosRecentes: [
    { nome: 'Marina C.', turma: 'Jiu-Jitsu', status: 'Ativo', faixa: 'Azul' },
    { nome: 'Rafael S.', turma: 'Muay Thai', status: 'Ativo', faixa: 'Vermelho' },
    { nome: 'Bruno L.', turma: 'Boxe', status: 'Pendente', faixa: 'Branca' }
  ],
  proximosTreinos: [
    { hora: '18:30', modalidade: 'Jiu-Jitsu', professor: 'Prof. André' },
    { hora: '19:30', modalidade: 'Muay Thai', professor: 'Prof. Leo' },
    { hora: '20:30', modalidade: 'Boxe', professor: 'Prof. Carla' }
  ]
}
```

### Alunos

```javascript
const mockAlunos = [
  { id: 1, nome: 'Marina Costa', turma: 'Jiu-Jitsu Avançado', status: 'Ativo', faixa: 'Azul', frequencia: '92%' },
  { id: 2, nome: 'Rafael Santos', turma: 'Muay Thai Intermediário', status: 'Ativo', faixa: 'Vermelho', frequencia: '88%' },
  { id: 3, nome: 'Bruno Lima', turma: 'Boxe Iniciante', status: 'Pendente', faixa: 'Branca', frequencia: '65%' },
  { id: 4, nome: 'Ana Oliveira', turma: 'Jiu-Jitsu Iniciante', status: 'Ativo', faixa: 'Branca', frequencia: '95%' },
  { id: 5, nome: 'Carlos Mendes', turma: 'MMA Avançado', status: 'Ativo', faixa: 'Roxa', frequencia: '78%' }
]
```

---

## Implementação

### 1. HTML (index.html)

Adicionar seção após `#funcionalidades`:

```html
<section class="section section-demo-system" id="demo-sistema">
  <div class="container">
    <header class="section-head reveal">
      <p class="eyebrow"><span>02</span>Experimente o sistema</p>
      <h2>Veja o Atralas em ação.</h2>
      <p>Explore o painel de gestão com dados de exemplo. Algumas funcionalidades estão disponíveis para demonstração.</p>
    </header>
    
    <div class="demo-container reveal-late">
      <aside class="demo-sidebar">
        <div class="demo-sidebar-header">
          <img src="img/Atlas os.webp" alt="Atralas" class="demo-logo" />
          <span class="demo-brand">atralas</span>
        </div>
        <nav class="demo-nav">
          <button class="demo-nav-item active" data-tab="dashboard">
            <svg>...</svg> Dashboard
          </button>
          <button class="demo-nav-item" data-tab="alunos">
            <svg>...</svg> Alunos
          </button>
          <button class="demo-nav-item locked" data-tab="chamada">
            <svg>...</svg> Chamada <span class="lock-icon"></span>
          </button>
          <button class="demo-nav-item locked" data-tab="financeiro">
            <svg>...</svg> Financeiro <span class="lock-icon">🔒</span>
          </button>
          <button class="demo-nav-item locked" data-tab="gamificacao">
            <svg>...</svg> Gamificação <span class="lock-icon">🔒</span>
          </button>
          <button class="demo-nav-item locked" data-tab="config">
            <svg>...</svg> Configurações <span class="lock-icon">🔒</span>
          </button>
        </nav>
      </aside>
      
      <div class="demo-content">
        <!-- Conteúdo dinâmico via JS -->
      </div>
    </div>
  </div>
</section>

<!-- Popup para abas bloqueadas -->
<div class="demo-popup" id="demoPopup" hidden>
  <div class="demo-popup-content">
    <button class="demo-popup-close" id="demoPopupClose">×</button>
    <div class="demo-popup-icon">🔒</div>
    <h3>Funcionalidade premium</h3>
    <p id="demoPopupMessage">Crie sua academia para acessar esta funcionalidade.</p>
    <a href="#cadastro" class="btn btn-primary">Criar minha academia</a>
  </div>
</div>
```

### 2. CSS (styles.css)

```css
/* Demo System Section */
.demo-container {
  display: grid;
  grid-template-columns: 265px 1fr;
  gap: 0;
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: var(--clr-bg, #0a0a0a);
  min-height: 600px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.demo-sidebar {
  background: var(--clr-sidebar, #0f0f0f);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
}

.demo-sidebar-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.demo-logo {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.demo-brand {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 20px;
  font-weight: 800;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.demo-nav {
  padding: 16px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.demo-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  width: 100%;
}

.demo-nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: white;
}

.demo-nav-item.active {
  background: rgba(255, 107, 53, 0.12);
  color: var(--clr-primary, #ff6b35);
}

.demo-nav-item.locked {
  position: relative;
}

.demo-nav-item.locked .lock-icon {
  margin-left: auto;
  font-size: 12px;
  opacity: 0.5;
}

.demo-content {
  padding: 32px;
  overflow-y: auto;
  max-height: 600px;
}

/* Stats Cards */
.demo-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.demo-stat-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px;
}

.demo-stat-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 8px;
}

.demo-stat-value {
  font-size: 28px;
  font-weight: 700;
  color: white;
  font-family: 'Barlow Condensed', sans-serif;
}

.demo-stat-sub {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 4px;
}

/* Tabela de Alunos */
.demo-table {
  width: 100%;
  border-collapse: collapse;
}

.demo-table th {
  text-align: left;
  padding: 12px 16px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.5);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.demo-table td {
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: white;
  font-size: 14px;
}

.demo-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

.demo-badge.ok {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.demo-badge.warn {
  background: rgba(234, 179, 8, 0.15);
  color: #eab308;
}

/* Popup */
.demo-popup {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s;
}

.demo-popup-content {
  background: var(--clr-bg, #0a0a0a);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 40px;
  max-width: 420px;
  text-align: center;
  position: relative;
  animation: scaleIn 0.3s;
}

.demo-popup-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 24px;
  cursor: pointer;
}

.demo-popup-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.demo-popup h3 {
  font-size: 24px;
  font-weight: 700;
  color: white;
  margin-bottom: 12px;
}

.demo-popup p {
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 24px;
  line-height: 1.6;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* Responsivo */
@media (max-width: 768px) {
  .demo-container {
    grid-template-columns: 1fr;
  }
  
  .demo-sidebar {
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .demo-nav {
    flex-direction: row;
    overflow-x: auto;
    padding: 12px;
  }
  
  .demo-nav-item {
    white-space: nowrap;
    padding: 10px 14px;
  }
}
```

### 3. JavaScript (demo.js)

```javascript
// Demo Interativa do Sistema Atralas
(function() {
  'use strict';

  // Dados mock
  const mockData = {
    dashboard: {
      stats: [
        { label: 'MRR Atual', value: 'R$ 13.396', sub: '68 assinaturas' },
        { label: 'Alunos Ativos', value: '68', sub: '+12 este mês' },
        { label: 'Frequência Hoje', value: '87%', sub: '59 presentes' },
        { label: 'Novos Alunos', value: '12', sub: 'Últimos 30 dias' }
      ],
      alunosRecentes: [
        { nome: 'Marina C.', turma: 'Jiu-Jitsu', status: 'Ativo' },
        { nome: 'Rafael S.', turma: 'Muay Thai', status: 'Ativo' },
        { nome: 'Bruno L.', turma: 'Boxe', status: 'Pendente' }
      ],
      treinos: [
        { hora: '18:30', modalidade: 'Jiu-Jitsu', professor: 'Prof. André' },
        { hora: '19:30', modalidade: 'Muay Thai', professor: 'Prof. Leo' },
        { hora: '20:30', modalidade: 'Boxe', professor: 'Prof. Carla' }
      ]
    },
    alunos: [
      { nome: 'Marina Costa', turma: 'Jiu-Jitsu Avançado', status: 'Ativo', faixa: 'Azul', frequencia: '92%' },
      { nome: 'Rafael Santos', turma: 'Muay Thai Intermediário', status: 'Ativo', faixa: 'Vermelho', frequencia: '88%' },
      { nome: 'Bruno Lima', turma: 'Boxe Iniciante', status: 'Pendente', faixa: 'Branca', frequencia: '65%' },
      { nome: 'Ana Oliveira', turma: 'Jiu-Jitsu Iniciante', status: 'Ativo', faixa: 'Branca', frequencia: '95%' },
      { nome: 'Carlos Mendes', turma: 'MMA Avançado', status: 'Ativo', faixa: 'Roxa', frequencia: '78%' }
    ]
  };

  const mensagensBloqueio = {
    chamada: 'Gerencie presenças, registre frequência e acompanhe a evolução dos alunos em cada treino.',
    financeiro: 'Controle mensalidades, gere cobranças automáticas e acompanhe o fluxo de caixa da academia.',
    gamificacao: 'Engaje alunos com sistema de XP, rankings, conquistas e sequências de treinos.',
    config: 'Personalize modalidades, faixas, permissões e configurações do sistema.'
  };

  // Elementos
  const navItems = document.querySelectorAll('.demo-nav-item');
  const demoContent = document.querySelector('.demo-content');
  const popup = document.getElementById('demoPopup');
  const popupClose = document.getElementById('demoPopupClose');
  const popupMessage = document.getElementById('demoPopupMessage');

  // Renderizar Dashboard
  function renderDashboard() {
    const stats = mockData.dashboard.stats.map(s => `
      <div class="demo-stat-card">
        <div class="demo-stat-label">${s.label}</div>
        <div class="demo-stat-value">${s.value}</div>
        <div class="demo-stat-sub">${s.sub}</div>
      </div>
    `).join('');

    const alunos = mockData.dashboard.alunosRecentes.map(a => `
      <tr>
        <td><strong>${a.nome}</strong></td>
        <td>${a.turma}</td>
        <td><span class="demo-badge ${a.status === 'Ativo' ? 'ok' : 'warn'}">${a.status}</span></td>
      </tr>
    `).join('');

    const treinos = mockData.dashboard.treinos.map(t => `
      <div class="demo-treino-item">
        <span class="demo-treino-hora">${t.hora}</span>
        <div>
          <strong>${t.modalidade}</strong>
          <span>${t.professor}</span>
        </div>
      </div>
    `).join('');

    return `
      <h2 style="color: white; font-size: 24px; margin-bottom: 24px; font-family: 'Barlow Condensed', sans-serif;">Dashboard</h2>
      <div class="demo-stats-grid">${stats}</div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
        <div>
          <h3 style="color: rgba(255,255,255,0.7); font-size: 14px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.1em;">Alunos Recentes</h3>
          <table class="demo-table">
            <thead><tr><th>Aluno</th><th>Turma</th><th>Status</th></tr></thead>
            <tbody>${alunos}</tbody>
          </table>
        </div>
        <div>
          <h3 style="color: rgba(255,255,255,0.7); font-size: 14px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.1em;">Próximos Treinos</h3>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${treinos}
          </div>
        </div>
      </div>
    `;
  }

  // Renderizar Alunos
  function renderAlunos() {
    const rows = mockData.alunos.map(a => `
      <tr>
        <td><strong>${a.nome}</strong></td>
        <td>${a.turma}</td>
        <td><span class="demo-badge ${a.status === 'Ativo' ? 'ok' : 'warn'}">${a.status}</span></td>
        <td>${a.faixa}</td>
        <td>${a.frequencia}</td>
      </tr>
    `).join('');

    return `
      <h2 style="color: white; font-size: 24px; margin-bottom: 24px; font-family: 'Barlow Condensed', sans-serif;">Alunos</h2>
      <table class="demo-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Turma</th>
            <th>Status</th>
            <th>Faixa</th>
            <th>Frequência</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  // Mostrar popup de bloqueio
  function showPopup(tab) {
    popupMessage.textContent = mensagensBloqueio[tab] || 'Crie sua academia para acessar esta funcionalidade.';
    popup.hidden = false;
  }

  // Fechar popup
  function closePopup() {
    popup.hidden = true;
  }

  // Navegação
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.dataset.tab;
      const isLocked = item.classList.contains('locked');

      if (isLocked) {
        showPopup(tab);
        return;
      }

      // Atualizar active
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      // Renderizar conteúdo
      if (tab === 'dashboard') {
        demoContent.innerHTML = renderDashboard();
      } else if (tab === 'alunos') {
        demoContent.innerHTML = renderAlunos();
      }
    });
  });

  // Fechar popup
  popupClose.addEventListener('click', closePopup);
  popup.addEventListener('click', (e) => {
    if (e.target === popup) closePopup();
  });

  // Inicializar com Dashboard
  demoContent.innerHTML = renderDashboard();
})();
```

---

## Critérios de Sucesso

- [ ] Seção demo visível no site
- [ ] Sidebar com 6 abas (2 ativas, 4 bloqueadas)
- [ ] Dashboard mostra stats, alunos recentes e treinos
- [ ] Aba Alunos mostra tabela com 5 alunos
- [ ] Abas bloqueadas abrem popup com mensagem contextual
- [ ] Popup tem botão "Criar minha academia" que leva ao cadastro
- [ ] Visual consistente com o System (cores escuras, ícones Lucide)
- [ ] Responsivo em mobile (sidebar vira tabs horizontais)
- [ ] Animações suaves nas transições

---

## Próximos Passos

1. Criar `js/demo.js` com lógica da demo
2. Adicionar seção HTML no `index.html`
3. Adicionar estilos no `css/styles.css`
4. Testar em localhost
5. Ajustar responsividade
6. Deploy
