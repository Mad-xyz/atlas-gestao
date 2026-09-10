/* ============================================================
   QUESTIONÁRIO DE MATURIDADE + CADASTRO
   Dois modos de uso:
   1) OVERLAY (index.html): as 12 perguntas aparecem numa caixinha
      por cima do site. Ao terminar, o cadastro abre em OUTRA ABA.
   2) PÁGINA (cadastro.html): somente o formulário de cadastro.
   Regras:
   - Só avança depois de selecionar uma resposta.
   - "Voltar" fica desativado na primeira pergunta.
   - Na última pergunta o botão vira "Ver resultado".
   ============================================================ */
(function () {
  "use strict";

  /* ===== Perguntas =====
     Cada pergunta tem categoria, texto, descrição e 5 opções
     (maturação de 1 = improvisado até 5 = profissional). */
  var perguntas = [
    {
      categoria: "Cadastro",
      pergunta: "Como você controla os alunos da sua academia hoje?",
      descricao: "Cadastro, dados e situação de cada aluno.",
      opcoes: [
        { titulo: "Não controlo de forma estruturada", detalhe: "Confio na memória ou no relacionamento" },
        { titulo: "Caderno, WhatsApp ou anotações soltas", detalhe: "Improvisado, sem padrão" },
        { titulo: "Planilha com lista parcial dos alunos", detalhe: "Faço, mas nem sempre está atualizado" },
        { titulo: "Planilha ou sistema atualizados com regularidade", detalhe: "Controle razoável da base de alunos" },
        { titulo: "Sistema dedicado com cadastro completo e atualizado", detalhe: "Controle profissional, base sempre em dia" }
      ]
    },
    {
      categoria: "Mensalidades",
      pergunta: "Como você acompanha as mensalidades dos alunos?",
      descricao: "Quem pagou, quem deve, quem vence quando.",
      opcoes: [
        { titulo: "Não acompanho de forma organizada", detalhe: "Vou descobrindo na conversa" },
        { titulo: "Olho extrato bancário e tento lembrar", detalhe: "Acompanhamento improvisado" },
        { titulo: "Tenho planilha, mas nem sempre atualizada", detalhe: "Acompanhamento parcial" },
        { titulo: "Planilha ou sistema com vencimentos claros", detalhe: "Sei quem pagou e quem está aberto" },
        { titulo: "Sistema com status em tempo real e relatórios", detalhe: "Visão profissional do financeiro" }
      ]
    },
    {
      categoria: "Inadimplência",
      pergunta: "Você sabe exatamente quem está inadimplente?",
      descricao: "Lista atualizada de alunos em atraso e por quanto tempo.",
      opcoes: [
        { titulo: "Não sei, descubro quando o aluno some", detalhe: "Sem visibilidade da inadimplência" },
        { titulo: "Tenho ideia, mas não a lista exata", detalhe: "Conhecimento improvisado" },
        { titulo: "Sei parcialmente, preciso checar para confirmar", detalhe: "Controle parcial" },
        { titulo: "Tenho a lista atualizada quase sempre", detalhe: "Controle razoável" },
        { titulo: "Lista em tempo real com dias de atraso e valor", detalhe: "Controle profissional da inadimplência" }
      ]
    },
    {
      categoria: "Cobrança em atraso",
      pergunta: "Como você faz a cobrança dos alunos em atraso?",
      descricao: "O processo entre o atraso e o recebimento.",
      opcoes: [
        { titulo: "Não cobro de forma estruturada", detalhe: "Cobrança não é uma rotina" },
        { titulo: "Lembro um por um, manualmente, quando dá", detalhe: "Cobrança improvisada e demorada" },
        { titulo: "Cobro só os casos mais críticos", detalhe: "Cobrança parcial" },
        { titulo: "Tenho rotina de cobrança manual organizada", detalhe: "Régua razoável, mas manual" },
        { titulo: "Régua automática por WhatsApp/e-mail com PIX", detalhe: "Cobrança profissional e automatizada" }
      ]
    },
    {
      categoria: "Frequência",
      pergunta: "Você sabe quais alunos faltaram nos últimos 7 dias?",
      descricao: "Visibilidade da frequência recente da turma.",
      opcoes: [
        { titulo: "Não tenho como saber", detalhe: "Frequência não é registrada" },
        { titulo: "Confio na memória de quem vi no tatame", detalhe: "Improvisado, sem registro" },
        { titulo: "Anoto em lista, mas não consulto sempre", detalhe: "Registro parcial" },
        { titulo: "Acompanho em planilha ou app com regularidade", detalhe: "Controle razoável da frequência" },
        { titulo: "Relatório automático de faltas em tempo real", detalhe: "Visão profissional da presença" }
      ]
    },
    {
      categoria: "Risco de churn",
      pergunta: "Você consegue identificar alunos em risco de cancelar?",
      descricao: "Sinais de afastamento antes do aluno sumir.",
      opcoes: [
        { titulo: "Não consigo, só percebo quando o aluno sai", detalhe: "Sem leitura de risco de churn" },
        { titulo: "Percebo no feeling, sem critério claro", detalhe: "Leitura improvisada" },
        { titulo: "Olho a frequência de vez em quando", detalhe: "Identificação parcial" },
        { titulo: "Acompanho frequência e converso com quem sumiu", detalhe: "Acompanhamento razoável de risco" },
        { titulo: "Sistema sinaliza alunos em risco automaticamente", detalhe: "Retenção profissional, alerta proativo" }
      ]
    },
    {
      categoria: "Graduações",
      pergunta: "Como controla faixas, graus e evolução dos alunos?",
      descricao: "Histórico de graduações, tempo de treino e progressão.",
      opcoes: [
        { titulo: "Não controlo, vou pelo olho na hora do exame", detalhe: "Sem histórico estruturado" },
        { titulo: "Anoto em caderno ou ficha física", detalhe: "Registro improvisado" },
        { titulo: "Planilha com algumas informações", detalhe: "Histórico parcial" },
        { titulo: "Planilha completa com histórico de graduações", detalhe: "Controle razoável da evolução" },
        { titulo: "Sistema com histórico, alertas e relatórios", detalhe: "Gestão profissional da progressão" }
      ]
    },
    {
      categoria: "Turmas e horários",
      pergunta: "Como organiza turmas e horários?",
      descricao: "Grade de aulas, professores e capacidade.",
      opcoes: [
        { titulo: "Não tenho grade definida", detalhe: "Organização inexistente" },
        { titulo: "Tenho na cabeça e aviso por WhatsApp", detalhe: "Organização improvisada" },
        { titulo: "Cartaz ou planilha que nem sempre atualizo", detalhe: "Grade parcial" },
        { titulo: "Grade fixa publicada e mantida atualizada", detalhe: "Organização razoável" },
        { titulo: "Grade no sistema com check-in e capacidade por aula", detalhe: "Operação profissional das turmas" }
      ]
    },
    {
      categoria: "Comunicação com alunos",
      pergunta: "Seus alunos conseguem acessar informações da academia com facilidade?",
      descricao: "Horários, mensalidade, avisos, graduação.",
      opcoes: [
        { titulo: "Não, precisam me perguntar tudo", detalhe: "Sem canal estruturado" },
        { titulo: "Aviso solto no WhatsApp quando lembro", detalhe: "Comunicação improvisada" },
        { titulo: "Grupo de WhatsApp ou mural físico", detalhe: "Acesso parcial à informação" },
        { titulo: "Lista de transmissão ou e-mail recorrente", detalhe: "Comunicação razoável" },
        { titulo: "App próprio com informações sempre disponíveis", detalhe: "Comunicação profissional, self-service" }
      ]
    },
    {
      categoria: "Indicadores",
      pergunta: "Você acompanha indicadores da sua academia?",
      descricao: "Faturamento, inadimplência, novos alunos, churn.",
      opcoes: [
        { titulo: "Não acompanho indicadores", detalhe: "Sem visão dos números" },
        { titulo: "Olho o saldo do banco e tiro conclusões", detalhe: "Indicadores improvisados" },
        { titulo: "Faço algumas contas no fim do mês", detalhe: "Indicadores parciais" },
        { titulo: "Tenho planilha mensal com os principais números", detalhe: "Acompanhamento razoável" },
        { titulo: "Dashboard em tempo real com indicadores-chave", detalhe: "Gestão profissional por números" }
      ]
    },
    {
      categoria: "Automações",
      pergunta: "Sua academia usa automações para reduzir tarefas repetitivas?",
      descricao: "Cobranças, lembretes, mensagens, relatórios.",
      opcoes: [
        { titulo: "Não uso automação nenhuma", detalhe: "Tudo no manual" },
        { titulo: "Algum modelo pronto que copio e colo", detalhe: "Automação improvisada" },
        { titulo: "Lembretes automáticos pontuais", detalhe: "Automação parcial" },
        { titulo: "Régua de cobrança e avisos automáticos", detalhe: "Automação razoável" },
        { titulo: "Cobrança, comunicação e relatórios automatizados", detalhe: "Operação profissional automatizada" }
      ]
    },
    {
      categoria: "Seu tempo",
      pergunta: "Quanto da sua energia é consumida por tarefas administrativas?",
      descricao: "Cobranças, listas, relatórios, mensagens — fora do tatame.",
      opcoes: [
        { titulo: "Quase toda — sobra pouco para o tatame", detalhe: "Administração consome a operação" },
        { titulo: "Muita, vivo apagando incêndio", detalhe: "Energia drenada no improviso" },
        { titulo: "Bastante, mas consigo dar conta", detalhe: "Carga administrativa parcial" },
        { titulo: "Pouca, tenho rotina sob controle", detalhe: "Energia administrativa razoável" },
        { titulo: "Mínima — quase tudo automatizado", detalhe: "Foco profissional no que importa" }
      ]
    }
  ];

  var totalPerguntas = perguntas.length;

  /* ===== Referências do DOM ===== */
  var overlay = document.getElementById("quizOverlay");
  var fechar = document.getElementById("quizFechar");
  var viewPerguntas = document.getElementById("quizView");
  var viewRegistro = document.getElementById("registroView");

  var contador = document.getElementById("quizContador");
  var barra = document.getElementById("quizBarra");
  var passo = document.getElementById("quizPasso");
  var categoria = document.getElementById("quizCategoria");
  var perguntaEl = document.getElementById("quizPergunta");
  var descricaoEl = document.getElementById("quizDescricao");
  var opcoesEl = document.getElementById("quizOpcoes");

  var botaoVoltar = document.getElementById("quizVoltar");
  var botaoProximo = document.getElementById("quizProximo");

  var registroForm = document.getElementById("registroForm");
  var registroSucesso = document.getElementById("registroSucesso");
  var registroPlano = document.getElementById("registroPlano");

  // Quando não existe o overlay, o quiz roda como página própria (cadastro.html).
  var modoPagina = !overlay;

  /* ===== Estado ===== */
  var indiceAtual = 0;       // pergunta em exibição (0..11)
  var respostas = [];        // opção escolhida por pergunta (índice) ou null
  var planoEscondido = null; // plano escolhido (?plan=xxx)

  // Endereço do painel de login do Atralas.
  // Prioridade: 1) query ?destino= ; 2) window.ENDERECO_LOGIN (js/firebase-config.js).
  // Se vazio, o cadastro confirma e mostra os dados sem redirecionar.
  var ENDERECO_LOGIN =
    new URLSearchParams(window.location.search).get("destino") ||
    window.ENDERECO_LOGIN ||
    "";

  var submetendo = false; // evita envio duplicado

  respostas = perguntas.map(function () {
    return null;
  });

  /* ===== Marca o plano na página de cadastro ===== */
  function exibirPlano() {
    if (!registroPlano) return;
    if (planoEscondido) {
      var nomesPlanos = {
        start: "Plano Start",
        growth: "Plano Growth",
        pro: "Plano Pro",
        elite: "Plano Elite"
      };
      registroPlano.textContent = nomesPlanos[planoEscondido] || "Plano " + planoEscondido;
      registroPlano.hidden = false;
    }
  }

  /* ===== Seleção de opções ===== */
  function selecionarOpcao(indicePergunta, indiceOpcao) {
    respostas[indicePergunta] = indiceOpcao;
    renderizarOpcoes();
    atualizarNavegacao();
  }

  /* ===== Renderiza as opções da pergunta atual ===== */
  function renderizarOpcoes() {
    if (!opcoesEl) return;
    var selecionada = respostas[indiceAtual];
    opcoesEl.innerHTML = "";

    perguntas[indiceAtual].opcoes.forEach(function (opcao, indice) {
      var botao = document.createElement("button");
      botao.type = "button";
      botao.className = "quiz-opcao" + (selecionada === indice ? " selecionada" : "");
      botao.setAttribute("aria-pressed", selecionada === indice ? "true" : "false");

      var indiceEl = document.createElement("span");
      indiceEl.className = "quiz-opcao-indice";
      indiceEl.textContent = String(indice + 1);

      var textos = document.createElement("span");
      textos.className = "quiz-opcao-textos";

      var tituloEl = document.createElement("span");
      tituloEl.className = "quiz-opcao-titulo";
      tituloEl.textContent = opcao.titulo;

      var detalheEl = document.createElement("span");
      detalheEl.className = "quiz-opcao-det";
      detalheEl.textContent = opcao.detalhe;

      textos.appendChild(tituloEl);
      textos.appendChild(detalheEl);
      botao.appendChild(indiceEl);
      botao.appendChild(textos);

      // O "toque" na opção grava a resposta e libera o botão Próximo.
      botao.addEventListener("click", function () {
        selecionarOpcao(indiceAtual, indice);
      });

      opcoesEl.appendChild(botao);
    });
  }

  /* ===== Renderiza a pergunta atual ===== */
  function renderizarPergunta() {
    if (!viewPerguntas) return;
    var dado = perguntas[indiceAtual];

    contador.textContent = "Pergunta " + (indiceAtual + 1) + " de " + totalPerguntas;
    passo.textContent = (indiceAtual + 1) + "/" + totalPerguntas;
    barra.style.width = ((indiceAtual + 1) / totalPerguntas * 100) + "%";
    categoria.textContent = dado.categoria;
    perguntaEl.textContent = dado.pergunta;
    descricaoEl.textContent = dado.descricao;

    renderizarOpcoes();
    atualizarNavegacao();
  }

  /* ===== Ativa/desativa os botões conforme a regra ===== */
  function atualizarNavegacao() {
    if (!botaoVoltar || !botaoProximo) return;
    var ehPrimeira = indiceAtual === 0;
    var ehUltima = indiceAtual === totalPerguntas - 1;
    var temResposta = respostas[indiceAtual] !== null;

    botaoVoltar.disabled = ehPrimeira;

    // Na última pergunta o botão vira "Ver resultado".
    botaoProximo.textContent = ehUltima ? "Ver resultado" : "Próximo";
    botaoProximo.disabled = !temResposta;
  }

  /* ===== Avança para a próxima etapa ===== */
  function irProxima() {
    if (respostas[indiceAtual] === null) {
      return; // não pode avançar sem resposta
    }

    if (indiceAtual < totalPerguntas - 1) {
      indiceAtual += 1;
      renderizarPergunta();
    } else {
      // Chegou na última pergunta -> abre o cadastro em OUTRA ABA.
      finalizarQuiz();
    }
  }

  /* ===== Volta para a pergunta anterior ===== */
  function irVoltar() {
    if (indiceAtual === 0) {
      return;
    }
    indiceAtual -= 1;
    renderizarPergunta();
  }

  /* ===== Termina o quiz e leva ao cadastro em nova aba ===== */
  function finalizarQuiz() {
    // Guarda as respostas para a página de cadastro usar mais tarde.
    try {
      sessionStorage.setItem("atralas_respostas", JSON.stringify(respostas));
    } catch (erro) {}

    var urlDestino = "cadastro.html" + (planoEscondido ? "?plan=" + planoEscondido : "");
    window.open(urlDestino, "_blank", "noopener");

    // Fecha a caixinha e reinicia o quiz para a próxima abertura.
    fecharQuestionario();
  }

  /* ===== Mostra somente o painel de cadastro (página própria) ===== */
  function mostrarRegistro() {
    if (!viewRegistro) return;
    if (viewPerguntas) {
      viewPerguntas.hidden = true;
    }
    viewRegistro.hidden = false;
    exibirPlano();

    var primeiroCampo = registroForm && registroForm.querySelector("input");
    if (primeiroCampo) {
      primeiroCampo.focus();
    }
  }

  /* ===== Validação e envio do cadastro ===== */
  function validarEmail(valor) {
    return /^\S+@\S+\.\S+$/.test(valor);
  }

  // Marca visualmente o campo (add/remove classe .invalid) e retorna
  // SE O CAMPO É VÁLIDO (true = válido, false = inválido).
  function marcarInvalido(campo, invalido) {
    campo.classList.toggle("invalid", invalido);
    return !invalido;
  }

  // Impede que o usuário digite letras ou mais de 6 dígitos no PIN.
  function restringirAPinNumerico() {
    ["rSenha", "rSenhaConfirma"].forEach(function (id) {
      var campo = document.getElementById(id);
      if (!campo) return;
      campo.addEventListener("input", function () {
        // Mantém apenas dígitos e limita a 6 caracteres.
        var apenasDigitos = campo.value.replace(/\D/g, "").slice(0, 6);
        if (campo.value !== apenasDigitos) {
          campo.value = apenasDigitos;
        }
        campo.classList.remove("invalid");
      });
    });
  }

  function comDddBrasil(digitos) {
    if (!digitos || digitos.length < 10) return null;
    var ddd = digitos.slice(0, 2);
    var numeroLimpo = digitos.slice(2);
    var numeroFormatado = numeroLimpo.length === 9
      ? numeroLimpo.slice(0, 5) + "-" + numeroLimpo.slice(5)
      : numeroLimpo.slice(0, 4) + "-" + numeroLimpo.slice(4);
    return {
      ddd: ddd,
      telefone_limpo: numeroLimpo,
      telefone_completo: "55" + digitos,
      display: "(" + ddd + ") " + numeroFormatado
    };
  }

  function mostrarErro(mensagem) {
    var erro = document.getElementById("registroErro");
    if (erro) {
      erro.textContent = mensagem;
      erro.hidden = false;
    }
  }

  function esconderErro() {
    var erro = document.getElementById("registroErro");
    if (erro) erro.hidden = true;
  }

  function removerRespostasSalvas() {
    try {
      sessionStorage.removeItem("atralas_respostas");
    } catch (e) {}
  }

  function irParaLogin(email) {
    if (!ENDERECO_LOGIN) return false;
    var separador = ENDERECO_LOGIN.indexOf("?") !== -1 ? "&" : "?";
    var url = ENDERECO_LOGIN + separador + "email=" + encodeURIComponent(email);
    window.location.href = url;
    return true;
  }

  async function enviarCadastro(evento) {
    if (submetendo) return; // já está enviando
    if (evento && evento.preventDefault) evento.preventDefault();
    esconderErro();

    var academia = document.getElementById("rAcademia");
    var nome = document.getElementById("rNome");
    var email = document.getElementById("rEmail");
    var telefone = document.getElementById("rTelefone");
    var pin = document.getElementById("rSenha");
    var pinConfirma = document.getElementById("rSenhaConfirma");
    var termos = document.getElementById("rTermos");

    var valido = true;

    valido = marcarInvalido(academia, !academia.value.trim()) && valido;
    valido = marcarInvalido(nome, !nome.value.trim()) && valido;
    valido = marcarInvalido(email, !validarEmail(email.value.trim())) && valido;
    valido = marcarInvalido(telefone, telefone.value.replace(/\D/g, "").length < 10) && valido;

    // O PIN precisa ter exatamente 6 dígitos numéricos.
    var pinLimpo = pin.value.replace(/\D/g, "");
    valido = marcarInvalido(pin, pinLimpo.length !== 6) && valido;

    // Os dois PINs precisam ser iguais.
    var pinsDiferem = pin.value !== pinConfirma.value;
    marcarInvalido(pinConfirma, pinsDiferem);
    valido = valido && !pinsDiferem;

    // O usuário precisa aceitar os termos.
    var avisoTermos = termos.closest(".quiz-tos");
    if (avisoTermos) {
      avisoTermos.style.borderColor = termos.checked ? "" : "var(--red)";
      if (!termos.checked) {
        valido = false;
      }
    }

    if (!valido) {
      var primeiroInvalido = registroForm.querySelector(".invalid");
      if (primeiroInvalido) primeiroInvalido.focus();
      return;
    }

    var emailLimpo = email.value.trim().toLowerCase();
    var digitosTelefone = telefone.value.replace(/\D/g, "");
    var telefoneDados = comDddBrasil(digitosTelefone);

    // Coleta as respostas do questionário (feito na etapa anterior do quiz).
    var respostasSalvas = [];
    try {
      var salvo = sessionStorage.getItem("atralas_respostas");
      respostasSalvas = salvo ? JSON.parse(salvo) : [];
    } catch (e) {
      respostasSalvas = [];
    }

    // Bloqueia o botão durante o envio.
    submetendo = true;
    var botao = document.getElementById("btnEnviar");
    var textOriginal = botao.textContent;
    botao.disabled = true;
    botao.textContent = "Criando...";

    try {
      if (typeof window.cadastrarAcademia !== "function") {
        // Se o Firebase não carregou (ex.: restrição de CSP/domínio), avisamos.
        throw new Error("O serviço de cadastro não está disponível. Verifique a conexão ou o domínio autorizado no Firebase.");
      }

      var resultado = await window.cadastrarAcademia({
        nomeAcademia: academia.value.trim(),
        nome: nome.value.trim(),
        email: emailLimpo,
        ddd: telefoneDados.ddd,
        telefone_limpo: telefoneDados.telefone_limpo,
        telefone_completo: telefoneDados.telefone_completo,
        telefone: telefoneDados.display || digitosTelefone,
        pin: pinLimpo,
        plano: planoEscondido,
        respostas: respostasSalvas,
        aceitaTermos: termos.checked
      });

      // Sucesso: guarda as credenciais.
      removerRespostasSalvas();

      var redirecionou = irParaLogin(resultado.email);

      // Se não há URL de login configurada, confirma mostrando e-mail e PIN.
      if (!redirecionou) {
        registroSucesso.textContent =
          "Cadastro realizado! Guarde seus dados de acesso: " +
          resultado.email + " · PIN " + resultado.pin;
        registroSucesso.hidden = false;
        registroSucesso.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    } catch (erro) {
      console.error("[Cadastro Academia] Erro:", erro);
      mostrarErro(traduzirErro(erro));
    } finally {
      botao.disabled = false;
      botao.textContent = textOriginal;
      submetendo = false;
    }
  }

  function traduzirErro(erro) {
    var msg = String(erro && erro.message || "");
    var etapa = erro && erro.etapa ? erro.etapa + ": " : "";
    var codigo = erro && erro.code ? " (" + erro.code + ")" : "";

    // Erros de permissão no Firestore (regras não publicadas ou projeto errado).
    if (/permission-denied|permission missing|Missing or insufficient permissions|permission/i.test(msg) || /permission-denied/i.test(codigo)) {
      return etapa + "Permissão negada no banco de dados. Publique as regras no projeto correto (atlas-os-21356) com: firebase deploy --only firestore:rules" + codigo;
    }
    if (/already-in-use|email-already-in-use/i.test(msg) || /email-already-in-use/i.test(codigo)) {
      return etapa + "Este e-mail já está cadastrado. Use outro ou faça login." + codigo;
    }
    if (/operation-not-allowed|Missing or insufficient permissions/i.test(msg) || /operation-not-allowed/i.test(codigo)) {
      return etapa + "Habilite o provedor Email/Password no Firebase (Authentication → Sign-in method)." + codigo;
    }
    if (/network|not available|ERR_|failed to fetch/i.test(msg) || /network/i.test(codigo)) {
      return etapa + "Falha de conexão com o Firebase. Verifique internet/firewall." + codigo;
    }
    if (/weak-password|Password should be at least/i.test(msg)) {
      return etapa + "O PIN/senha é muito fraco. Use 6 dígitos.";
    }
    if (/invalid-email|email address is badly formatted/i.test(msg)) {
      return etapa + "Informe um e-mail válido.";
    }
    return etapa + "Não foi possível criar o cadastro (verifique o console)." + codigo;
  }

  /* ===== Abre/fecha a caixinha (overlay no index) ===== */
  function abrirQuestionario() {
    if (!overlay) return;
    overlay.hidden = false;
    // Trava a rolagem do site enquanto o questionário está aberto.
    document.body.style.overflow = "hidden";
  }

  function fecharQuestionario() {
    if (!overlay) return;
    overlay.hidden = true;
    // Libera a rolagem do site.
    document.body.style.overflow = "";
    // Reinicia o fluxo para a próxima abertura.
    indiceAtual = 0;
    respostas = perguntas.map(function () {
      return null;
    });
    renderizarPergunta();
  }

  /* ===== Inicialização conforme o modo ===== */
  if (modoPagina) {
    // cadastro.html: mostra apenas o cadastro e lê o plano da URL.
    planoEscondido = new URLSearchParams(window.location.search).get("plan");
    mostrarRegistro();
    if (registroForm) {
      // Garante que os campos de PIN aceitem apenas números (máx. 6).
      restringirAPinNumerico();
      registroForm.addEventListener("submit", enviarCadastro);

      // Fallback: garante que o clique no botão sempre dispare o envio.
      var botaoEnviar = document.getElementById("btnEnviar");
      if (botaoEnviar) {
        botaoEnviar.addEventListener("click", function (evento) {
          if (evento && evento.preventDefault) evento.preventDefault();
          enviarCadastro(evento);
        });
      }
    }
  } else {
    // index.html: liga os botões "Começar / Cadastrar / Escolher plano".
    var gatilhos = document.querySelectorAll('a[href="#cadastro"], a[href^="#cadastro?plan="]');

    gatilhos.forEach(function (link) {
      link.addEventListener("click", function (evento) {
        evento.preventDefault();
        // Impede que o handler de planos do main.js rode por cima.
        evento.stopImmediatePropagation();

        var href = link.getAttribute("href");
        var indiceInterrogacao = href.indexOf("?");
        if (indiceInterrogacao !== -1) {
          var parametros = new URLSearchParams(href.slice(indiceInterrogacao + 1));
          planoEscondido = parametros.get("plan");
        } else {
          planoEscondido = null;
        }

        abrirQuestionario();
      });
    });

    botaoProximo.addEventListener("click", irProxima);
    botaoVoltar.addEventListener("click", irVoltar);
    if (fechar) {
      fechar.addEventListener("click", fecharQuestionario);
    }

    // Tecla ESC fecha a caixinha.
    document.addEventListener("keydown", function (evento) {
      if (evento.key === "Escape" && !overlay.hidden) {
        fecharQuestionario();
      }
    });

    renderizarPergunta();
  }
})();
