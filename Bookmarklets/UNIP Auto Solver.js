(async () => {
  if (document.getElementById("__qs__")) return;

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&display=swap');

    #__qs__ {
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      background: rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Inter', sans-serif;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    #__qs__.visible { opacity: 1; }

    #__qs_box__ {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }

    #__qs_spinner__ {
      width: 36px;
      height: 36px;
      border: 2px solid rgba(255, 255, 255, 0.1);
      border-top-color: rgba(255, 255, 255, 0.8);
      border-radius: 50%;
      animation: __qs_spin__ 0.8s linear infinite;
    }

    #__qs_msg__ {
      font-size: 14px;
      font-weight: 300;
      color: rgba(255, 255, 255, 0.6);
      letter-spacing: 0.3px;
    }

    #__qs_check__ {
      display: none;
      width: 36px;
      height: 36px;
      align-items: center;
      justify-content: center;
    }

    #__qs_check__ svg {
      width: 28px;
      height: 28px;
      stroke: rgba(255, 255, 255, 0.85);
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
      fill: none;
      stroke-dasharray: 40;
      stroke-dashoffset: 40;
      animation: __qs_draw__ 0.4s ease forwards;
    }

    @keyframes __qs_spin__ { to { transform: rotate(360deg); } }
    @keyframes __qs_draw__ { to { stroke-dashoffset: 0; } }
  `;

  const styleEl = document.createElement("style");
  styleEl.id = "__qs_style__";
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  const overlay = document.createElement("div");
  overlay.id = "__qs__";
  overlay.innerHTML = `
    <div id="__qs_box__">
      <div id="__qs_spinner__"></div>
      <div id="__qs_check__">
        <svg viewBox="0 0 28 28"><polyline points="5,14 11,20 23,8"/></svg>
      </div>
      <div id="__qs_msg__">Aguarde...</div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("visible"));

  const setMsg = (t) => { document.getElementById("__qs_msg__").textContent = t; };

  const done = (count, total) => {
    document.getElementById("__qs_spinner__").style.display = "none";
    const check = document.getElementById("__qs_check__");
    check.style.display = "flex";
    setMsg(`${count} de ${total} respondidas`);
    setTimeout(() => {
      overlay.style.opacity = "0";
      setTimeout(() => {
        overlay.remove();
        styleEl.remove();
      }, 300);
    }, 1800);
  };

  const extractQuestions = () => {
    const questions = [];
    document.querySelectorAll(".takeQuestionDiv").forEach((div, i) => {
      const text = div.querySelector("legend")?.innerText?.trim();
      const options = [];
      div.querySelectorAll("table tr").forEach((row) => {
        const label = row.querySelector(".multiple-choice-numbering")?.innerText?.trim();
        const answer = row.querySelector("label")?.innerText?.trim();
        const input = row.querySelector("input[type=radio]");
        if (label && answer && input)
          options.push({ label, answer, value: input.value, name: input.name });
      });
      if (text && options.length) questions.push({ index: i + 1, text, options });
    });
    return questions;
  };

  const askAI = async (prompt) => {
    const res = await fetch("https://quillbot.squareweb.app/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt }),
    });
    const data = await res.json();
    const raw = data.reply ?? data.response ?? data.message ?? JSON.stringify(data);
    return typeof raw === "string" ? raw : JSON.stringify(raw);
  };

  const buildPrompt = (questions) => {
    let p = `Você receberá uma lista de perguntas objetivas de múltipla escolha.
  Sua tarefa é:
  1. Ler cuidadosamente cada pergunta.
  2. Identificar a alternativa correta entre a, b, c, d ou e.
  3. Responder todas as questões obrigatoriamente.
  4. Não pular nenhuma pergunta.
  5. Não explicar o raciocínio.
  ⚠️ Regras obrigatórias de saída:
  * Retorne somente JSON válido.
  * Não escreva comentários, explicações, títulos ou texto extra.
  * Use exatamente este formato:
  {"respostas":{"1":"a","2":"b","3":"c"}}
  ⚠️ Cada número da questão deve ser uma chave em texto. ⚠️ Cada resposta deve conter apenas uma letra minúscula: a, b, c, d ou e. ⚠️ Se houver dúvida, escolha a alternativa mais provável.
  Responda agora às questões:\n\n`;
  
    questions.forEach((q) => {
      p += `Pergunta ${q.index}: ${q.text}\n`;
      q.options.forEach((o) => (p += `${o.label} ${o.answer}\n`));
      p += "\n";
    });
  
    return p;
  };

  const markAnswers = (questions, answers) => {
    let marked = 0;
    questions.forEach((q) => {
      const letter = answers[String(q.index)]?.toLowerCase();
      if (!letter) return;
      const opt = q.options.find((o) => o.label.replace(".", "").trim().toLowerCase() === letter);
      if (!opt) return;
      const input = document.querySelector(`input[name="${opt.name}"][value="${opt.value}"]`);
      if (input) { input.click(); marked++; }
    });
    return marked;
  };

  setMsg("Lendo perguntas...");
  const questions = extractQuestions();

  setMsg("Consultando IA...");
  const raw = await askAI(buildPrompt(questions));

  let answers;
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error();
    const obj = JSON.parse(match[0]);
    answers = typeof obj.respostas === "string"
      ? JSON.parse(obj.respostas)
      : obj.respostas ?? obj;
  } catch {
    setMsg("Erro ao processar resposta.");
    setTimeout(() => { overlay.remove(); styleEl.remove(); }, 2500);
    return;
  }

  setMsg("Marcando respostas...");
  const marked = markAnswers(questions, answers);
  done(marked, questions.length);
})();
