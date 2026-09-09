// Demo Interativa do Sistema Atralas — réplica visual exata do ManagerDashboard.jsx + StudentsPage.jsx
(function() {
  'use strict';

  // Dados mock baseados no System real
  const mockData = {
    dashboard: {
      kpis: [
        { title: 'Alunos Ativos', value: '68', desc: 'Total de matriculados', iconColor: 'text-white', valueColor: 'white', badge: null },
        { title: 'Novos Alunos', value: '12', desc: 'Últimos 15 dias', iconColor: 'text-emerald-400', valueColor: 'green', badge: { label: 'Novo', class: 'new' } },
        { title: 'Presença Hoje', value: '59', desc: 'Check-ins registrados', iconColor: 'text-blue-400', valueColor: 'blue', badge: null },
        { title: 'Ausentes +10D', value: '5', desc: 'Clique p/ ver lista', iconColor: 'text-rose-400', valueColor: 'red', badge: { label: '2 críticos', class: 'critical' } },
        { title: 'Receita do Mês', value: 'R$ 13.396', desc: 'Faturamento consolidado', iconColor: 'text-emerald-400', valueColor: 'green', badge: null },
        { title: 'Taxa de Retenção', value: '87%', desc: '2 evasões críticas', iconColor: 'text-emerald-400', valueColor: 'green', badge: null },
        { title: 'Pgtos Atrasados', value: '8', desc: 'Total de boletos vencidos', iconColor: 'text-rose-400', valueColor: 'red', badge: null },
        { title: 'Pendentes', value: 'R$ 6.840', desc: 'Total em pendentes', iconColor: 'text-rose-400', valueColor: 'red', badge: null },
        { title: 'Professores', value: '4', desc: 'Equipe técnica ativa', iconColor: 'text-emerald-400', valueColor: 'green', badge: null },
        { title: 'Visitantes', value: '7', desc: 'Últimos 30 dias', iconColor: 'text-blue-400', valueColor: 'blue', badge: null }
      ],
      modalities: [
        { name: 'Jiu Jitsu', count: 32, color: '#DC143C' },
        { name: 'Muay Thai', count: 18, color: '#22c55e' },
        { name: 'Boxe', count: 12, color: '#f59e0b' },
        { name: 'MMA', count: 6, color: '#3b82f6' }
      ],
      todaySessions: [
        { id: 1, classTitle: 'Jiu Jitsu Avançado', time: '18:30', modality: 'jiu-jitsu', presentes: 18, total: 22, professor: 'Prof. André' },
        { id: 2, classTitle: 'Muay Thai Intermediário', time: '19:30', modality: 'muay-thai', presentes: 14, total: 16, professor: 'Prof. Leo' },
        { id: 3, classTitle: 'Boxe Iniciante', time: '20:30', modality: 'boxe', presentes: 8, total: 12, professor: 'Prof. Carla' },
        { id: 4, classTitle: 'MMA Fundamentos', time: '21:00', modality: 'mma', presentes: 5, total: 8, professor: 'Prof. Diego' }
      ],
      cashFlow: [
        { label: 'Jan/26', rev: 11200, exp: 4800 },
        { label: 'Fev/26', rev: 11800, exp: 5100 },
        { label: 'Mar/26', rev: 12400, exp: 5300 },
        { label: 'Abr/26', rev: 12900, exp: 5500 },
        { label: 'Mai/26', rev: 13396, exp: 5800 },
        { label: 'Jun/26', rev: 13800, exp: 6000 }
      ]
    },
    students: {
      kpis: [
        { title: 'Ativos', value: '68', desc: 'Alunos matriculados', valueColor: 'green' },
        { title: 'Inativos', value: '3', desc: 'Cancelamentos', valueColor: 'gray' },
        { title: 'Graduados', value: '24', desc: 'Total com faixa', valueColor: 'blue' },
        { title: 'Arquivados', value: '8', desc: 'Inativos + suspensos', valueColor: 'gold' }
      ],
      toolbar: {
        searchPlaceholder: 'Buscar por nome, email, telefone...',
        statusOptions: ['Todos', 'Ativo', 'Inativo', 'Pendente', 'Suspenso'],
        modalityOptions: ['Todas', 'Jiu Jitsu', 'Muay Thai', 'Boxe', 'MMA'],
        sortOptions: ['Mais Recente', 'A → Z', 'Z → A']
      },
      rows: [
        { id: 1, nome: 'Marina Costa', phone: '(11) 99999-0001', pin: '7421', modalities: ['Jiu Jitsu'], belt: 'blue', stripes: 2, status: 'ativo', paymentStatus: 'Pago', paymentColor: 'green' },
        { id: 2, nome: 'Rafael Santos', phone: '(11) 99999-0002', pin: '8351', modalities: ['Muay Thai'], belt: 'red', stripes: 1, status: 'ativo', paymentStatus: 'Pendente', paymentColor: 'red' },
        { id: 3, nome: 'Bruno Lima', phone: '(11) 99999-0003', pin: '9162', modalities: ['Boxe'], belt: 'white', stripes: 0, status: 'pendente', paymentStatus: 'Vencido', paymentColor: 'red' },
        { id: 4, nome: 'Ana Oliveira', phone: '(11) 99999-0004', pin: '6283', modalities: ['Jiu Jitsu'], belt: 'white', stripes: 0, status: 'ativo', paymentStatus: 'Pago', paymentColor: 'green' },
        { id: 5, nome: 'Carlos Mendes', phone: '(11) 99999-0005', pin: '4732', modalities: ['MMA'], belt: 'purple', stripes: 3, status: 'ativo', paymentStatus: 'Pago', paymentColor: 'green' },
        { id: 6, nome: 'Juliana Alves', phone: '(11) 99999-0006', pin: '5814', modalities: ['Jiu Jitsu', 'MMA'], belt: 'purple', stripes: 1, status: 'ativo', paymentStatus: 'Pago', paymentColor: 'green' },
        { id: 7, nome: 'Pedro Henrique', phone: '(11) 99999-0007', pin: '3921', modalities: ['Muay Thai'], belt: 'blue', stripes: 0, status: 'inativo', paymentStatus: 'Pendente', paymentColor: 'red' },
        { id: 8, nome: 'Lucas Ribeiro', phone: '(11) 99999-0008', pin: '1047', modalities: ['Boxe'], belt: 'white', stripes: 0, status: 'ativo', paymentStatus: 'Pago', paymentColor: 'green' }
      ]
    }
  };

  const beltConfig = {
    white: { label: 'Branca', color: '#e8e8ec', textColor: '#000' },
    blue: { label: 'Azul', color: '#3b82f6', textColor: '#fff' },
    purple: { label: 'Roxa', color: '#8b5cf6', textColor: '#fff' },
    brown: { label: 'Marrom', color: '#7c4a1e', textColor: '#fff' },
    black: { label: 'Preta', color: '#17171d', textColor: '#fff' },
    red: { label: 'Vermelha', color: '#dc2626', textColor: '#fff' },
    none: { label: 'Sem faixa', color: '#333', textColor: '#fff' }
  };

  const modalityColors = {
    'jiu-jitsu': '#DC143C',
    'muay-thai': '#22c55e',
    'boxe': '#f59e0b',
    'mma': '#3b82f6'
  };

  // SVG Icons inline
  const icons = {
    activity: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
    calendar: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    chevronRight: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
    bell: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
    users: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    shield: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 12 15 15 9"/></svg>`,
    barChart: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
    zap: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    smartphone: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
    eye: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
    moreVertical: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>`,
    refresh: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64"/><path d="M3.51 15a9 9 0 0 1 14.86 14.86"/></svg>`,
    search: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`
  };

  // Helpers
  function fmtMoney(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
  }

  function getBeltConfig(belt) {
    return beltConfig[belt] || beltConfig.none;
  }

  function getModalityColor(mod) {
    return modalityColors[mod] || '#fff';
  }

  // Elementos
  const kpiGrid = document.getElementById('demoKpiGrid');
  const quickActions = document.getElementById('demoQuickActions');
  const bottomSection = document.getElementById('demoBottomSection');
  const demoMain = document.getElementById('demoMain');
  const demoStudentsPage = document.getElementById('demoStudentsPage');
  const navItems = document.querySelectorAll('.demo-nav-item');

  // Render KPI Grid (Dashboard)
  function renderDashboardKPIs() {
    if (!kpiGrid) return;
    
    const kpis = mockData.dashboard.kpis.map((k, i) => `
      <div class="demo-kpi-card" style="animation-delay: ${i * 35}ms">
        <div class="demo-kpi-header">
          <div class="demo-kpi-icon-box">
            ${icons.activity}
          </div>
          <span class="demo-kpi-title">${k.title}</span>
          ${k.badge ? `<span class="demo-kpi-badge ${k.badge.class}">${k.badge.label}</span>` : ''}
        </div>
        <div class="demo-kpi-value ${k.valueColor}">${k.value}</div>
        <p class="demo-kpi-desc">${k.desc}</p>
      </div>
    `).join('');

    const modalityKPIs = mockData.dashboard.modalities.map((m, i) => `
      <div class="demo-kpi-card" style="animation-delay: ${(mockData.dashboard.kpis.length + i) * 35}ms; --value-color: ${m.color};">
        <div class="demo-kpi-header">
          <div class="demo-kpi-icon-box">
            ${icons.activity}
          </div>
          <span class="demo-kpi-title">${m.name}</span>
        </div>
        <div class="demo-kpi-value" style="color: ${m.color};">${m.count}</div>
        <p class="demo-kpi-desc">Alunos matriculados</p>
      </div>
    `).join('');

    kpiGrid.innerHTML = kpis + modalityKPIs;
  }

  // Render Quick Actions (Mobile)
  function renderQuickActions() {
    if (!quickActions) return;
    
    quickActions.innerHTML = `
      <div class="demo-quick-actions-card">
        <div class="demo-quick-actions-header">
          ${icons.zap}
          <span>Ações Rápidas</span>
        </div>
        <div class="demo-quick-actions-list">
          <button class="demo-quick-action-btn" title="Alunos">
            <div class="demo-quick-action-icon green">${icons.users}</div>
            <span>Alunos</span>
          </button>
          <button class="demo-quick-action-btn" title="Professores">
            <div class="demo-quick-action-icon purple">${icons.shield}</div>
            <span>Professores</span>
          </button>
          <button class="demo-quick-action-btn" title="Relatórios">
            <div class="demo-quick-action-icon blue">${icons.barChart}</div>
            <span>Relatórios</span>
          </button>
        </div>
      </div>
    `;
  }

  // Render Bottom Section (Aulas de Hoje + Fluxo de Caixa)
  function renderBottomSection() {
    if (!bottomSection) return;

    const todaySessions = mockData.dashboard.todaySessions.map(s => {
      const pct = s.total > 0 ? Math.round((s.presentes / s.total) * 100) : 0;
      return `
        <div class="demo-session-item ${s.modality}" style="--accent: ${getModalityColor(s.modality)};">
          <div class="demo-session-left">
            <h4>${s.classTitle}</h4>
            <span class="demo-session-time">${s.time} · ${s.professor}</span>
          </div>
          <div class="demo-session-center">
            <div class="demo-attendance-bar">
              <div class="demo-attendance-fill" style="width: ${pct}%; background: ${getModalityColor(s.modality)};"></div>
            </div>
            <span class="demo-attendance-pct">${pct}% presença</span>
          </div>
          <div class="demo-session-right">
            <span class="demo-session-count" style="color: ${getModalityColor(s.modality)};">${s.presentes}</span>
            <span class="demo-session-total">/${s.total}</span>
          </div>
          <button class="demo-session-action" aria-label="Revisar lista">${icons.eye}</button>
        </div>
      `;
    }).join('');

    const maxRev = Math.max(...mockData.dashboard.cashFlow.map(m => m.rev), 1);
    const maxExp = Math.max(...mockData.dashboard.cashFlow.map(m => m.exp), 1);
    const max = Math.max(maxRev, maxExp);

    const cashFlow = mockData.dashboard.cashFlow.map(m => {
      const balance = m.rev - m.exp;
      return `
        <div class="demo-cashflow-row">
          <span class="demo-cashflow-month">${m.label}</span>
          <div class="demo-cashflow-bars">
            <div class="demo-cashflow-bar-row">
              <span class="demo-cashflow-label green">Entrada</span>
              <div class="demo-cashflow-bar-bg">
                <div class="demo-cashflow-bar-fill green" style="width: ${(m.rev / max) * 100}%;"></div>
              </div>
              <span class="demo-cashflow-value green">${fmtMoney(m.rev)}</span>
            </div>
            <div class="demo-cashflow-bar-row">
              <span class="demo-cashflow-label red">Saída</span>
              <div class="demo-cashflow-bar-bg">
                <div class="demo-cashflow-bar-fill red" style="width: ${(m.exp / max) * 100}%;"></div>
              </div>
              <span class="demo-cashflow-value red">${fmtMoney(m.exp)}</span>
            </div>
          </div>
          <span class="demo-cashflow-balance ${balance >= 0 ? 'positive' : 'negative'}">${fmtMoney(balance)}</span>
        </div>
      `;
    }).join('');

    bottomSection.innerHTML = `
      <!-- Aulas de Hoje -->
      <div class="demo-card">
        <div class="demo-card-header">
          <h3 class="demo-card-title">${icons.calendar} Aulas de Hoje</h3>
          <a href="#chamada" class="demo-card-link">Ver tudo ${icons.chevronRight}</a>
        </div>
        <div class="demo-card-body">
          ${todaySessions}
        </div>
      </div>

      <!-- Fluxo de Caixa -->
      <div class="demo-card">
        <div class="demo-card-header">
          <h3 class="demo-card-title">Fluxo de Caixa (Últimos 6 Meses)</h3>
        </div>
        <div class="demo-card-body demo-cashflow-list">
          ${cashFlow}
        </div>
      </div>
    `;
  }

  // Render Students Page
  function renderStudentsPage() {
    // Hide dashboard elements
    if (demoMain) demoMain.style.display = 'none';
    if (demoStudentsPage) demoStudentsPage.style.display = 'block';
    
    // Show students table
    if (demoStudentsPage) {
      demoStudentsPage.innerHTML = renderStudentsTable();
    }
  }

  function renderStudentsTable() {
    const rows = mockData.students.rows.map(s => {
      const belt = getBeltConfig(s.belt);
      const modalityTags = s.modalities.map(m => `<span>${m}</span>`).join('');
      return `
        <tr class="demo-student-row">
          <td class="demo-student-cell">
            <div class="demo-student-info">
              <div class="demo-avatar" style="background: ${belt.color}; color: ${belt.textColor};">
                ${s.nome.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <div class="demo-student-details">
                <span class="demo-student-name">${s.nome}</span>
                <span class="demo-student-meta">
                  ${s.belt !== 'white' || s.stripes > 0 ? `${belt.label}${s.stripes > 0 ? ` · ${s.stripes} graus` : ''}` : 'Sem faixa'}
                </span>
              </div>
            </div>
          </td>
          <td class="demo-student-cell demo-student-phone">
            <a href="https://wa.me/55${s.phone.replace(/\D/g, '')}" target="_blank" rel="noreferrer" class="demo-whatsapp-btn">
              ${icons.smartphone} ${s.phone}
            </a>
          </td>
          <td class="demo-student-cell demo-student-pin">
            <span class="demo-pin">${s.pin}</span>
          </td>
          <td class="demo-student-cell demo-student-modality">
            <span class="demo-modality-tags">${modalityTags}</span>
          </td>
          <td class="demo-student-cell demo-student-payment">
            <span class="demo-payment-badge" style="color: var(--${s.paymentColor});">${s.paymentStatus}</span>
          </td>
          <td class="demo-student-cell demo-student-status">
            <span class="demo-status-badge ${s.status}">${s.status.charAt(0).toUpperCase() + s.status.slice(1)}</span>
          </td>
          <td class="demo-student-cell demo-student-actions">
            <button class="demo-action-btn" title="Ver detalhes">${icons.eye}</button>
            <button class="demo-action-btn" title="Mais ações">${icons.moreVertical}</button>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <!-- KPIs Students -->
      <div class="demo-kpi-grid demo-kpi-grid-sm">
        ${mockData.students.kpis.map(k => `
          <div class="demo-kpi-card">
            <div class="demo-kpi-header">
              <div class="demo-kpi-icon-box">
                ${icons.users}
              </div>
              <span class="demo-kpi-title">${k.title}</span>
            </div>
            <div class="demo-kpi-value ${k.valueColor}">${k.value}</div>
            <p class="demo-kpi-desc">${k.desc}</p>
          </div>
        `).join('')}
      </div>

      <!-- Toolbar -->
      <div class="demo-toolbar">
        <div class="demo-search">
          ${icons.search}
          <input type="text" placeholder="${mockData.students.toolbar.searchPlaceholder}" class="demo-search-input">
        </div>
        <div class="demo-filters">
          <select class="demo-select">${mockData.students.toolbar.statusOptions.map(o => `<option>${o}</option>`).join('')}</select>
          <select class="demo-select">${mockData.students.toolbar.modalityOptions.map(o => `<option>${o}</option>`).join('')}</select>
          <select class="demo-select">${mockData.students.toolbar.sortOptions.map(o => `<option>${o}</option>`).join('')}</select>
        </div>
      </div>

      <!-- Table -->
      <div class="demo-table-wrapper">
        <table class="demo-table">
          <thead>
            <tr>
              <th>Aluno</th>
              <th class="demo-col-center">Telefone</th>
              <th class="demo-col-center">PIN</th>
              <th class="demo-col-center">Modalidade</th>
              <th class="demo-col-center">Pagamento</th>
              <th class="demo-col-center">Status</th>
              <th class="demo-col-center" style="width: 80px;">Ações</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="demo-pagination">
        <button class="demo-page-btn" disabled>${icons.chevronRight}</button>
        <span class="demo-page-info">Página 1 de 1</span>
        <button class="demo-page-btn" disabled>${icons.chevronRight}</button>
      </div>
    `;
  }

  // Navigation
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.dataset.tab;
      const isLocked = item.classList.contains('locked');

      if (isLocked) return;

      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      if (tab === 'dashboard') {
        // Show dashboard, hide students table
        if (kpiGrid) kpiGrid.style.display = 'grid';
        if (quickActions) quickActions.style.display = 'block';
        if (bottomSection) bottomSection.style.display = 'flex';
        if (demoContent) demoContent.style.display = 'none';
        
        renderDashboardKPIs();
        renderQuickActions();
        renderBottomSection();
      } else if (tab === 'alunos') {
        renderStudentsPage();
      }
    });
  });

  // Initialize
  renderDashboardKPIs();
  renderQuickActions();
  renderBottomSection();
})();