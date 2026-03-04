(function () {

  if (document.getElementById("__overlay__")) return;

  function showOverlay(message, done = false) {
    let overlay = document.getElementById("__overlay__");

    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "__overlay__";
      overlay.style.cssText = `
        position: fixed; inset: 0; z-index: 999999;
        background: rgba(0, 0, 0, 0.92);
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        gap: 20px; font-family: 'Segoe UI', sans-serif;
        transition: opacity 0.5s ease;
      `;
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = done ? `
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="30" stroke="#4ade80" stroke-width="4"/>
        <polyline points="18,33 28,43 46,22" stroke="#4ade80" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <p style="color:#4ade80;font-size:20px;font-weight:600;margin:0;letter-spacing:0.5px;">Respondido com sucesso!</p>
    ` : `
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" style="animation: spin 1s linear infinite;">
        <circle cx="28" cy="28" r="24" stroke="#ffffff22" stroke-width="5"/>
        <path d="M28 4 A24 24 0 0 1 52 28" stroke="#a78bfa" stroke-width="5" stroke-linecap="round"/>
      </svg>
      <p style="color:#e2e8f0;font-size:18px;font-weight:500;margin:0;letter-spacing:0.3px;">${message}</p>
      <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    `;

    if (done) {
      setTimeout(() => {
        overlay.style.opacity = "0";
        setTimeout(() => overlay.remove(), 500);
      }, 2000);
    }
  }

  function cleanText(text) {
    return (text || "")
      .replace(/\(\s*[ivxIVX]+\s*\)/g, "")
      .replace(/\([^)]+\)/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getQuestions() {
    return [...document.querySelectorAll('.takeQuestionDiv')].map((div, i) => {
      const title = div.querySelector('.steptitle')?.innerText.trim().toUpperCase() || `PERGUNTA ${i + 1}`;
      const descricao = cleanText(div.querySelector('legend')?.innerText || "");
      const opcoes = [...div.querySelectorAll('table.multiple-choice-table tr')].reduce((acc, row) => {
        const letra = row.querySelector('.multiple-choice-numbering')?.innerText.replace('.', '').trim();
        const texto = cleanText(row.querySelector('label')?.innerText || "");
        if (letra && texto) acc.push({ letra, texto });
        return acc;
      }, []);
      return { pergunta: title, descricao, opcoes };
    });
  }

  function markAnswers(data) {
    document.querySelectorAll('.takeQuestionDiv').forEach((div, i) => {
      const title = div.querySelector('.steptitle')?.innerText.trim().toUpperCase() || `PERGUNTA ${i + 1}`;
      const found = Array.isArray(data) ? data.find(q => q.pergunta?.toUpperCase() === title) : null;
      const correct = (found?.resposta || data[title] || "").toLowerCase();
      if (!correct) return;

      div.querySelectorAll('table.multiple-choice-table tr').forEach(row => {
        const letra = row.querySelector('.multiple-choice-numbering')?.innerText.replace('.', '').trim().toLowerCase();
        const radio = row.querySelector('input[type="radio"]');
        if (letra && radio && letra === correct) {
          radio.checked = true;
          row.style.background = "#14532d";
        }
      });
    });
  }

  async function run() {
    showOverlay("Analisando perguntas...");

    const questions = getQuestions();

    const prompt = `
Responda corretamente cada questão abaixo.
Retorne APENAS JSON válido, sem texto extra.

Formato:
[
  { "pergunta": "PERGUNTA 1", "resposta": "a" }
]

Questões:
${JSON.stringify(questions, null, 2)}
`;

    showOverlay("Consultando IA...");

    try {
      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=AIzaSyCAO2-H0-cVVJDb9op5R2o1eo6wa6NJjhY",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        }
      );

      const data = await res.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const match = raw.match(/\[[\s\S]*\]|\{[\s\S]*\}/);

      if (!match) throw new Error("JSON não encontrado na resposta.");

      markAnswers(JSON.parse(match[0]));
      showOverlay("", true);

    } catch (err) {
      console.error(err);
      showOverlay("Erro ao obter resposta.");
      setTimeout(() => document.getElementById("__overlay__")?.remove(), 3000);
    }
  }

  run();

})();