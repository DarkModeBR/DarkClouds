// ==UserScript==
// @name         DIO Auto Solver
// @match        https://*.dio.me/*
// ==/UserScript==

(function () {
    'use strict';

    let authToken         = null;
    let autoSelectEnabled = true;
    let autoAnswerEnabled = true;
    let solving           = false;
    let lastSolvedId      = null;

    function hideUnwantedElements() {
        const css = `
            section.vwHpO,
            section.sc-cwHptR.sc-gfoqjT { display: none !important; }

            .sc-iUVXli,
            div.ecaGwK { display: none !important; }
        `;
        const s = document.createElement('style');
        s.id = 'dio-solver-hide';
        s.textContent = css;
        if (document.head) {
            document.head.appendChild(s);
        } else {
            document.addEventListener('DOMContentLoaded', () => document.head.appendChild(s));
        }

        const obs = new MutationObserver(() => {
            [
                'section.vwHpO',
                'section.sc-cwHptR.sc-gfoqjT',
                '.sc-iUVXli',
                'div.ecaGwK'
            ].forEach(sel => {
                document.querySelectorAll(sel).forEach(el => {
                    el.style.setProperty('display', 'none', 'important');
                });
            });
        });
        obs.observe(document.documentElement, { childList: true, subtree: true });
    }

    function createMenu() {
        if (document.getElementById('dio-solver-menu')) return;

        const style = document.createElement('style');
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap');

            #dio-solver-menu {
                position: fixed;
                top: 80px;
                right: 24px;
                z-index: 2147483647;
                font-family: 'JetBrains Mono', monospace;
                user-select: none;
                width: 220px;
                opacity: 0;
                pointer-events: none;
                transform: translateY(-10px);
                transition: opacity 0.35s ease, transform 0.35s ease;
            }
            #dio-solver-menu.dio-visible {
                opacity: 1;
                pointer-events: all;
                transform: translateY(0);
            }
            #dio-solver-panel {
                background: #0d0d0d;
                border: 1px solid #222;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 8px 40px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.03) inset;
            }
            #dio-solver-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 10px 14px;
                cursor: grab;
                background: #111;
                border-bottom: 1px solid #1e1e1e;
            }
            #dio-solver-header:active { cursor: grabbing; }
            #dio-solver-header-left { display: flex; align-items: center; gap: 7px; }
            #dio-solver-dot {
                width: 7px; height: 7px; border-radius: 50%;
                background: #00e5ff; box-shadow: 0 0 6px #00e5ff;
                animation: dio-pulse 2s ease-in-out infinite;
            }
            @keyframes dio-pulse {
                0%,100% { opacity:1; box-shadow:0 0 6px #00e5ff; }
                50% { opacity:.4; box-shadow:0 0 2px #00e5ff; }
            }
            #dio-solver-title {
                font-size: 10px; font-weight: 700;
                letter-spacing: .12em; color: #888; text-transform: uppercase;
            }
            #dio-solver-minimize {
                background: none; border: none; color: #444; cursor: pointer;
                font-size: 14px; line-height: 1; padding: 0; transition: color .2s;
            }
            #dio-solver-minimize:hover { color: #aaa; }
            #dio-solver-body { padding: 14px; display: flex; flex-direction: column; gap: 10px; }
            .dio-row { display: flex; align-items: center; justify-content: space-between; }
            .dio-label {
                font-size: 10px; font-weight: 600;
                letter-spacing: .08em; color: #555; text-transform: uppercase;
            }
            .dio-toggle { position: relative; width: 36px; height: 20px; flex-shrink: 0; }
            .dio-toggle input { opacity: 0; width: 0; height: 0; }
            .dio-slider {
                position: absolute; inset: 0; background: #1e1e1e;
                border: 1px solid #2a2a2a; border-radius: 20px; cursor: pointer;
                transition: background .25s, border-color .25s;
            }
            .dio-slider::before {
                content: ''; position: absolute; width: 12px; height: 12px;
                left: 3px; top: 3px; background: #444; border-radius: 50%;
                transition: transform .25s, background .25s;
            }
            .dio-toggle input:checked + .dio-slider { background: #001f2e; border-color: #00e5ff44; }
            .dio-toggle input:checked + .dio-slider::before {
                transform: translateX(16px); background: #00e5ff; box-shadow: 0 0 6px #00e5ff88;
            }
            .dio-divider { height: 1px; background: #1a1a1a; margin: 2px 0; }
            #dio-solver-status {
                font-size: 9px; letter-spacing: .06em; color: #333; text-align: center;
                padding: 8px 14px; border-top: 1px solid #1a1a1a; background: #0a0a0a;
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: color .3s;
            }
            #dio-solver-pill {
                display: none;
                align-items: center; gap: 8px;
                background: #0d0d0d; border: 1px solid #222; border-radius: 99px;
                padding: 7px 14px; cursor: pointer;
                box-shadow: 0 4px 20px rgba(0,0,0,.6);
                opacity: 0; pointer-events: none;
                transform: translateY(-10px);
                transition: opacity 0.35s ease, transform 0.35s ease, border-color 0.2s;
            }
            #dio-solver-pill.dio-visible {
                opacity: 1; pointer-events: all; transform: translateY(0);
            }
            #dio-solver-pill:hover { border-color: #333; }
            #dio-solver-pill span {
                font-size: 10px; font-weight: 700;
                letter-spacing: .1em; color: #555; text-transform: uppercase;
            }
        `;
        document.head.appendChild(style);

        const menu = document.createElement('div');
        menu.id = 'dio-solver-menu';
        menu.innerHTML = `
            <div id="dio-solver-panel">
                <div id="dio-solver-header">
                    <div id="dio-solver-header-left">
                        <div id="dio-solver-dot"></div>
                        <span id="dio-solver-title">DIO Solver</span>
                    </div>
                    <button id="dio-solver-minimize" title="Minimizar">−</button>
                </div>
                <div id="dio-solver-body">
                    <div class="dio-row">
                        <span class="dio-label">Auto Selecionar</span>
                        <label class="dio-toggle">
                            <input type="checkbox" id="toggle-autoselect" checked>
                            <span class="dio-slider"></span>
                        </label>
                    </div>
                    <div class="dio-divider"></div>
                    <div class="dio-row">
                        <span class="dio-label">Auto Responder</span>
                        <label class="dio-toggle">
                            <input type="checkbox" id="toggle-autoanswer" checked>
                            <span class="dio-slider"></span>
                        </label>
                    </div>
                </div>
                <div id="dio-solver-status">aguardando questao...</div>
            </div>
            <div id="dio-solver-pill">
                <div style="width:6px;height:6px;border-radius:50%;background:#00e5ff;box-shadow:0 0 5px #00e5ff;flex-shrink:0;"></div>
                <span>DIO Solver</span>
            </div>
        `;
        document.body.appendChild(menu);

        document.getElementById('toggle-autoselect').addEventListener('change', function () {
            autoSelectEnabled = this.checked;
            setStatus(autoSelectEnabled ? 'auto-select ativado' : 'auto-select desativado');
        });
        document.getElementById('toggle-autoanswer').addEventListener('change', function () {
            autoAnswerEnabled = this.checked;
            setStatus(autoAnswerEnabled ? 'auto-responder ativado' : 'auto-responder desativado');
        });

        const panel = document.getElementById('dio-solver-panel');
        const pill  = document.getElementById('dio-solver-pill');

        document.getElementById('dio-solver-minimize').addEventListener('click', () => {
            panel.style.display = 'none';
            pill.style.display  = 'flex';
            requestAnimationFrame(() => requestAnimationFrame(() => pill.classList.add('dio-visible')));
        });

        pill.addEventListener('click', () => {
            pill.classList.remove('dio-visible');
            setTimeout(() => {
                pill.style.display  = 'none';
                panel.style.display = '';
            }, 350);
        });

        makeDraggable(menu, document.getElementById('dio-solver-header'));
        makeDraggable(menu, pill);
    }

    function showMenu() {
        const menu = document.getElementById('dio-solver-menu');
        if (menu) menu.classList.add('dio-visible');
    }

    function makeDraggable(el, handle) {
        let ox, oy, mx, my;
        handle.addEventListener('mousedown', e => {
            e.preventDefault();
            mx = e.clientX; my = e.clientY;
            ox = el.offsetLeft; oy = el.offsetTop;
            const onMove = e => {
                el.style.left = (ox + e.clientX - mx) + 'px';
                el.style.top  = (oy + e.clientY - my) + 'px';
                el.style.right = 'unset';
                el.style.bottom = 'unset';
            };
            const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });
    }

    function setStatus(msg, type = 'idle') {
        const el = document.getElementById('dio-solver-status');
        if (!el) return;
        const colors = { idle: '#333', info: '#00e5ff88', success: '#00e67688', error: '#ff525288' };
        el.textContent = msg;
        el.style.color = colors[type] || '#333';
    }

    const originalFetch = window.fetch;

    window.fetch = async function (...args) {
        const [url, options = {}] = args;
        const urlStr = typeof url === 'string' ? url : url.toString();

        if (options && options.headers) {
            const h  = options.headers;
            let auth = (h instanceof Headers) ? h.get('authorization') : (h.authorization || h.Authorization);
            if (auth && auth.startsWith('Bearer ')) authToken = auth;
        }

        let response;
        try { response = await originalFetch.apply(this, args); }
        catch (e) { throw e; }

        const isQuestionGet = (
            urlStr.includes('sms.dio.me/api/questions/') &&
            !urlStr.includes('/answer') &&
            (!options.method || options.method.toUpperCase() === 'GET')
        );

        if (isQuestionGet) {
            try {
                const data = await response.clone().json();
                if (data.id && Array.isArray(data.choices) && data.choices.length > 0) {
                    if (solving && lastSolvedId === data.id) return response;
                    showMenu();
                    setStatus('questao detectada...', 'info');
                    setTimeout(() => solveQuestion(data.id, data.choices), 500);
                }
            } catch (e) {}
        }

        return response;
    };

    async function solveQuestion(questionId, choices) {
        if (!authToken) {
            setStatus('aguardando token...', 'info');
            setTimeout(() => solveQuestion(questionId, choices), 2000);
            return;
        }

        solving      = true;
        lastSolvedId = questionId;

        const responses = [];

        for (let i = 0; i < choices.length; i++) {
            const choice = choices[i];
            setStatus(`testando ${i + 1}/${choices.length}: "${choice.description}"`, 'info');

            try {
                const res    = await originalFetch(`https://sms.dio.me/api/questions/${questionId}/answer/`, {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                        'authorization': authToken,
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify({ answer: choice.id })
                });
                const result = await res.json();
                responses.push({ choice, result });
            } catch (err) {
                responses.push({ choice, result: null });
            }

            if (i < choices.length - 1) await sleep(800);
        }

        const correct = responses.find(({ result }) => result !== null && result.is_correct === true);

        if (!correct) {
            setStatus('sem resposta correta', 'error');
            solving = false;
            return;
        }

        const { choice, result } = correct;
        const answerText = result.correct_answer_detail || choice.description;
        setStatus('CORRETA: ' + answerText, 'success');

        if (autoSelectEnabled) {
            await sleep(600);
            clickCorrectAnswer(answerText);
            if (autoAnswerEnabled) {
                await sleep(800);
                await waitAndClick(['RESPONDER'], 8, 400);
                await sleep(1000);
                await waitAndClick(['CONTINUAR'], 10, 500);
            }
        }

        setStatus('aguardando questao...', 'idle');
        solving = false;
    }

    function clickCorrectAnswer(answerText) {
        const norm = answerText.trim().toLowerCase();
        for (const li of document.querySelectorAll('li')) {
            const t = li.textContent.trim().toLowerCase();
            if (t === norm || t.includes(norm) || norm.includes(t)) {
                li.style.cssText += 'border:3px solid #00ff88 !important;box-shadow:0 0 20px rgba(0,255,136,.6) !important;border-radius:8px !important;background-color:rgba(0,255,136,.15) !important;';
                li.click();
                const r = li.querySelector('.radio, div, input');
                if (r) r.click();
                return true;
            }
        }
        for (const el of document.querySelectorAll('button, label, span, p, div')) {
            if (el.textContent.trim().toLowerCase() === norm) {
                el.click();
                return true;
            }
        }
        return false;
    }

    function waitAndClick(texts, maxAttempts = 10, interval = 500) {
        return new Promise(resolve => {
            let attempts = 0;
            const tryClick = () => {
                attempts++;
                for (const btn of document.querySelectorAll('button')) {
                    for (const t of texts) {
                        if (btn.textContent.trim().toLowerCase() === t.toLowerCase()) {
                            btn.click();
                            resolve(true); return;
                        }
                    }
                }
                if (attempts < maxAttempts) setTimeout(tryClick, interval);
                else resolve(false);
            };
            tryClick();
        });
    }

    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    const _xhrOpen      = XMLHttpRequest.prototype.open;
    const _xhrSend      = XMLHttpRequest.prototype.send;
    const _xhrSetHeader = XMLHttpRequest.prototype.setRequestHeader;

    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
        this._url = url; this._method = method;
        return _xhrOpen.apply(this, [method, url, ...rest]);
    };
    XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
        if (name.toLowerCase() === 'authorization' && value.startsWith('Bearer ')) authToken = value;
        return _xhrSetHeader.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function (body) {
        const url = this._url || '', method = this._method || '';
        if (url.includes('sms.dio.me/api/questions/') && !url.includes('/answer') && method.toUpperCase() === 'GET') {
            this.addEventListener('load', function () {
                try {
                    const data = JSON.parse(this.responseText);
                    if (data.id && Array.isArray(data.choices) && data.choices.length > 0) {
                        if (solving && lastSolvedId === data.id) return;
                        showMenu();
                        setStatus('questao detectada (XHR)...', 'info');
                        setTimeout(() => solveQuestion(data.id, data.choices), 500);
                    }
                } catch (e) {}
            });
        }
        return _xhrSend.apply(this, arguments);
    };

    function init() {
        hideUnwantedElements();
        createMenu();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else setTimeout(init, 100);

})();