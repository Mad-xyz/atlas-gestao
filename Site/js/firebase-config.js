/**
 * CONFIGURAÇÃO DO FIREBASE + LOGIN DO ATRALAS
 * Centralizada em um único lugar para facilitar a troca.
 * Altere aqui e veja o efeito no cadastro (Cadastrar minha academia).
 */

// Configuração do projeto Firebase do Atralas.
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyAW5VzuqbAFRbpoYaOVVbSdMJCL4Fm2dao",
  authDomain: "atlas-os-21356.firebaseapp.com",
  projectId: "atlas-os-21356",
  storageBucket: "atlas-os-21356.firebasestorage.app",
  messagingSenderId: "1070954204252",
  appId: "1:1070954204252:web:0faf12656f5f4de9d36a99",
  measurementId: "G-QMNYWXE3F2"
};

/**
 * Endereço da tela de login do painel do Atralas (System).
 *
 * DESENVOLVIMENTO (System rodando com `npm run dev` na pasta System):
 *   -> http://localhost:5173/login
 *
 * PRODUÇÃO (painel publicado):
 *   -> troque para a URL real, ex: "https://atlas-multi-tenant.web.app/login"
 *
 * Também aceita sobrescrita via URL: cadastro.html?destino=https://.../login
 */
window.ENDERECO_LOGIN = "http://localhost:5173/login";
