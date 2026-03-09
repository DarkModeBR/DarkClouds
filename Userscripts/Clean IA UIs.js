// ==UserScript==
// @name         Clean IA UIs
// @match        https://claude.ai/*
// @match        https://chatgpt.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';

  const RULES = {
    'claude.ai': {
      css: `
        .ml-0\\.5.inline-flex.items-center.gap-1\\.5.rounded-lg.h-8.pl-2.pr-2\\.5.bg-bg-300,
        .downloads-link,
        button.Button_ghost__BUAoh:has(svg [style*="look-around"]),
        button.Button_ghost__BUAoh:has(path[d*="M6.99951 8.66672"]),
        a[aria-label="Personalizar"][href="/customize"],
        a[aria-label="Procurar"][href="#"],
        a[aria-label="Projetos"][href="/projects"],
        a[aria-label="Código"][href="/cli_landing"],
        a[aria-label="Conversas"][href="/recents"],
        a[aria-label="Artefatos"][href="/artifacts"],
        a[aria-label="Obter apps e extensões"][href="/downloads"],
        ul[role="tablist"][aria-label="Categorias de prompt"],
        div[role="note"][data-disclaimer="true"],
        button[data-testid="wiggle-controls-actions-share"],
        div[role="group"][aria-label="Message actions"],
        span.absolute:has(span.animate-ping) {
          display: none !important;
        }
      `,
      selectors: [
        '.ml-0\\.5.inline-flex.items-center.gap-1\\.5.rounded-lg.h-8.pl-2.pr-2\\.5.bg-bg-300',
        '.downloads-link',
        'a[aria-label="Personalizar"][href="/customize"]',
        'a[aria-label="Procurar"][href="#"]',
        'a[aria-label="Projetos"][href="/projects"]',
        'a[aria-label="Código"][href="/cli_landing"]',
        'a[aria-label="Conversas"][href="/recents"]',
        'a[aria-label="Artefatos"][href="/artifacts"]',
        'a[aria-label="Obter apps e extensões"][href="/downloads"]',
        'ul[role="tablist"][aria-label="Categorias de prompt"]',
        'div[role="note"][data-disclaimer="true"]',
        'button[data-testid="wiggle-controls-actions-share"]',
        'div[role="group"][aria-label="Message actions"]',
        'span.absolute:has(span.animate-ping)',
      ],
    },
    'chatgpt.com': {
      css: `
        button.button-glimmer-cta,
        div:has(> button.button-glimmer-cta),
        div:has(> div > button.button-glimmer-cta),
        button[aria-label="Dispensar lembrete de upgrade"],
        button[aria-label="Resgatar oferta"],
        button[aria-label="Compartilhar"][data-testid="share-chat-button"],
        button[aria-label="Iniciar um chat em grupo"],
        button[aria-label="Ativar chat temporário"],
        div.select-none:has(a[class*="text-token-text-primary"][class*="underline"]),
        div.z-0.flex.min-h-\\[46px\\].justify-start,
        div:has(> div > button[data-testid="copy-turn-action-button"]),
        a[href="/codex"][data-sidebar-item="true"],
        a[href="/images"][data-sidebar-item="true"],
        a[data-testid="sidebar-item-library"][data-sidebar-item="true"],
        a[href="/apps"][data-sidebar-item="true"],
        a[data-testid="apps-button"][data-sidebar-item="true"],
        button.__menu-item[data-sidebar-item="true"]:has(.truncate:only-child),
        div.__menu-item[data-sidebar-item="true"]:has(.truncate) {
          display: none !important;
        }
      `,
      selectors: [
        'button.button-glimmer-cta',
        'div:has(> button.button-glimmer-cta)',
        'div:has(> div > button.button-glimmer-cta)',
        'button[aria-label="Dispensar lembrete de upgrade"]',
        'button[aria-label="Resgatar oferta"]',
        'button[aria-label="Compartilhar"][data-testid="share-chat-button"]',
        'button[aria-label="Iniciar um chat em grupo"]',
        'button[aria-label="Ativar chat temporário"]',
        'div:has(> div > button[data-testid="copy-turn-action-button"])',
        'a[href="/codex"][data-sidebar-item="true"]',
        'a[href="/images"][data-sidebar-item="true"]',
        'a[data-testid="sidebar-item-library"][data-sidebar-item="true"]',
        'a[href="/apps"][data-sidebar-item="true"]',
        'a[data-testid="apps-button"][data-sidebar-item="true"]',
      ],
    },
  };

  const hostname = location.hostname;
  const site = Object.keys(RULES).find((key) => hostname.includes(key));
  if (!site) return;

  const { css, selectors } = RULES[site];

  const style = document.createElement('style');
  style.textContent = css;

  const inject = () => (document.head || document.documentElement).appendChild(style);

  if (document.head) {
    inject();
  } else {
    const obs = new MutationObserver(() => {
      if (document.head) { inject(); obs.disconnect(); }
    });
    obs.observe(document.documentElement, { childList: true });
  }

  const hide = () => {
    selectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        el.style.setProperty('display', 'none', 'important');
      });
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    hide();
    new MutationObserver(hide).observe(document.body, { childList: true, subtree: true });
  }, { once: true });

})();
