# 🥋 Sistema de Gestão para Academias

## 📖 Sobre o Projeto

Este é um sistema desenvolvido para facilitar a administração de academias e centros de treinamento. A plataforma centraliza alunos, professores, turmas, eventos, graduações, finanças e presenças em um único ambiente.

O objetivo é simplificar a rotina da equipe administrativa e oferecer um acompanhamento mais organizado para professores e alunos.

## 📸 Visão Geral

### Tela Principal

![Tela Principal do Sistema](https://cdn.discordapp.com/attachments/1145397670018568214/1524881855692931182/19a83d72-a192-42f8-975a-97bd4f4d46e6.png?ex=6a515c65&is=6a500ae5&hm=805c2722ffca77b7150b86fbdf8dc4486f287cf0bb65dc0cb5ba69c661b3fb69)

---

## 👥 Níveis de Acesso

O sistema trabalha com diferentes níveis de usuários, garantindo que cada pessoa tenha acesso apenas às funcionalidades necessárias.

### 👑 Administrador

O primeiro acesso ao sistema é realizado por uma conta de administrador.

O administrador possui controle total da plataforma e pode:

- Cadastrar gestores.
- Cadastrar professores.
- Cadastrar alunos.
- Definir permissões individuais.
- Gerenciar modalidades e graduações.
- Acessar relatórios financeiros.
- Configurar regras do sistema.
- Visualizar e gerenciar todos os dados.
- Controlar o sistema todo.

### 🧑‍💼 Gestor

Os gestores são criados pelo administrador.

Dependendo das permissões concedidas, podem:

- Gerenciar professores.
- Cadastrar alunos.
- Controlar eventos.
- Gerar relatórios.
- Fazer chamada.
- Acompanhar métricas da academia.
- Gerenciar modalidades e graduações.
- Personalizar faixas.
- Acessar relatórios financeiros.
- Configurar regras do sistema.
- Visualizar e gerenciar todos os dados.

### 🥋 Professor

Os professores são cadastrados por administradores ou gestores autorizados.

Seu acesso pode variar conforme as permissões recebidas:

- Gerenciar alunos.
- Acompanhar sua modalidade registrada.
- Adicionar alunos.
- E mais funcionalidades conforme as permissões.

### 🎓 Aluno

Os alunos possuem acesso restrito às suas informações.

Podem:

- Visualizar perfil.
- Consultar frequência.
- Ver graduações.
- Acompanhar eventos.
- Acessar avisos da academia.

---

## 🔐 Sistema de Cadastro

O sistema não possui registro público.

Novas contas somente podem ser criadas por usuários autorizados.

Fluxo de criação:

```text
Administrador
    ↓
Cria Gestores
    ↓
Gestores autorizados
    ↓
Criam Professores
    ↓
Alunos
```

Cada usuário recebe um PIN de acesso individual para autenticação dentro da plataforma.

---

## 🛡️ Sistema de Permissões

Cada colaborador pode receber permissões específicas.

Isso permite que a academia personalize exatamente o que cada usuário poderá acessar.

### Operacional e Alunos

- **Visualizar Alunos**: ver lista de alunos, visualizar perfis.
- **Cadastrar e Editar Alunos**: criar novos alunos, atualizar informações.
- **Gerenciar Chamadas**: iniciar aulas, registrar presenças, consultar histórico.
- **Gerenciar Eventos**: criar eventos, editar eventos, organizar graduações.
- **Excluir Registros**: remover alunos e registros do sistema.

### Financeiro

- **Ver Relatórios Financeiros**: acompanhar métricas, visualizar indicadores.
- **Processar Mensalidades**: gerar cobranças, registrar pagamentos.
- **Despesas**: visualizar, adicionar e editar despesas.
- **Cobranças**: visualizar, criar e editar cobranças.
- **Relatórios de Pagamento**: gerar e exportar relatórios financeiros.

### Gestão e Sistema

- **Gerenciar Equipe**: criar e editar colaboradores, definir permissões.
- **Configurar Regras**: modalidades, faixas, graduações, configurações gerais.

### Segurança e Privacidade

- **Ver PIN da Equipe**: visualizar PINs de colaboradores autorizados.
- **Ver PIN dos Alunos**: visualizar PINs dos alunos.
- **Acesso Total (Super Admin)**: ignora todas as restrições do sistema, acesso completo a todas as funcionalidades.

---

## ✨ Principais Recursos

- Dashboard com indicadores em tempo real.
- Gestão completa de alunos.
- Controle de presença e frequência.
- Cadastro de modalidades e turmas.
- Sistema de graduações e faixas.
- Controle financeiro.
- Gestão de cobranças e despesas.
- Relatórios detalhados.
- Sistema de eventos e comunicados.
- Controle de equipe.
- Permissões personalizadas.
- Login por PIN.
- Temas personalizáveis.
- Suporte para dispositivos móveis.
- Instalação como aplicativo (PWA).
- Notificações em tempo real.

---

## 🛠️ Tecnologias Utilizadas

- React 19
- Vite
- Tailwind CSS
- Framer Motion
- Lucide React
- Recharts
- Firebase Authentication
- Firebase Firestore
- Firebase Hosting

---

## 📁 Estrutura do Projeto

```text
src/
├── modules/
│   ├── auth/
│   ├── attendance/
│   ├── modalities/
│   ├── financial/
│   ├── events/
│   └── users/
│
├── components/
│   └── shared/
│
├── theme/
├── hooks/
├── services/
└── assets/
```

---

## 🚀 Instalação e Uso

Para configurar o Firebase e rodar o projeto, siga os passos abaixo.

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar o Firebase

Crie um projeto no [Firebase Console](https://console.firebase.google.com).

Habilite:

- **Authentication** (método Email/Senha)
- **Firestore Database**

Em seguida, copie as credenciais do seu projeto para o arquivo `src/firebase/config.js`.

Configure também o arquivo `.firebaserc` com o ID do seu projeto:

```json
{
  "projects": {
    "default": "seu-projeto-id"
  }
}
```

### 3. Executar em desenvolvimento

```bash
npm run dev
```

Acesse em: **http://localhost:5173**

### 4. Build de produção

```bash
npm run build
```

### 5. Deploy no Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
npm run deploy
```

---

## 🎯 Objetivo

Fornecer uma plataforma simples e organizada para a administração de academias, permitindo controlar alunos, professores, finanças, eventos e graduações em um único sistema.

---

Desenvolvido por **Mad-xyz**.