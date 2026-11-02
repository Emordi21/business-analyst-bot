import { ask } from '../api.js';
import { state, persist } from '../store.js';
import { esc, fmtDate, tracker } from '../utils.js';

const TOPICS = [
  'Mixed BA topics', 'Requirements elicitation', 'Requirements analysis & documentation', 'User stories & acceptance criteria',
  'Process modelling (BPMN)', 'Stakeholder analysis & engagement', 'Agile & Scrum for BAs', 'BABOK knowledge areas',
  'UML & use cases', 'Business case & feasibility', 'Data analysis & SQL basics', 'Testing & UAT',
];

// Kept at module level so leaving the Quiz tab mid-quiz doesn't lose your place.
let session = { phase: 'setup' }; // phases: setup | loading | play | done | error

// Points at the Quiz screen currently on display (if any). When the AI finishes writing
// questions we redraw THAT screen, even if the user left and came back while waiting.
let current = { alive: () => false, draw: () => {} };

function parseQuiz(text) {
  const clean = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const data = JSON.parse(clean);
  const qs = (data.questions ?? data).filter(
    (q) => q && typeof q.question === 'string' && Array.isArray(q.options) && q.options.length === 4 && Number.isInteger(q.answerIndex) && q.answerIndex >= 0 && q.answerIndex < 4,
  );
  if (!qs.length) throw new Error('The AI returned no usable questions.');
  return qs;
}

async function generate(cfg) {
  const system = 'You are an expert Business Analysis exam writer (BABOK v3, IIBA ECBA/CCBA/CBAP style). Respond with ONLY valid JSON and no other text.';
  const prompt = `Create ${cfg.count} multiple-choice questions on "${cfg.topic}" at ${cfg.difficulty} level. Prefer realistic workplace scenarios. Each question has exactly 4 options and exactly one correct answer; vary which position is correct. Add a short explanation of why the answer is right.
JSON shape: {"questions":[{"question":"...","options":["A","B","C","D"],"answerIndex":0,"explanation":"..."}]}`;
  return parseQuiz(await ask({ system, messages: [{ role: 'user', content: prompt }], json: true }));
}

export function renderQuiz(el, _params, app) {
  const draw = () => renderQuiz(el, _params, app);
  current = { alive: tracker(el), draw };
  const S = session;

  if (S.phase === 'setup') {
    const recent = state.quizResults.slice(0, 5);
    el.innerHTML = `
      <section class="panel scroll">
        <header class="panel-head"><div class="tile">🎓</div><div class="head-text"><h2>BA Quiz</h2><p>Test yourself with AI-written questions and get instant explanations.</p></div></header>
        <div class="pad">
          <form id="quiz-form" class="stack">
            <label>Topic<select name="topic">${TOPICS.map((t) => `<option>${esc(t)}</option>`).join('')}</select></label>
            <label>…or a specific focus (optional)<input name="custom" placeholder="e.g. Prioritisation techniques, BPMN gateways" maxlength="100" /></label>
            <fieldset><legend>Difficulty</legend><div class="seg">
              ${['Beginner', 'Intermediate', 'Advanced'].map((d, i) => `<label><input type="radio" name="difficulty" value="${d}" ${i === 1 ? 'checked' : ''}/><span>${d}</span></label>`).join('')}
            </div></fieldset>
            <fieldset><legend>Questions</legend><div class="seg">
              ${[5, 10, 15].map((n, i) => `<label><input type="radio" name="count" value="${n}" ${i === 0 ? 'checked' : ''}/><span>${n}</span></label>`).join('')}
            </div></fieldset>
            <button class="primary wide" type="submit">Start quiz</button>
          </form>
          ${recent.length ? `<h3>Recent results</h3><ul class="plain">${recent.map((r) => `<li><b>${r.score}/${r.total}</b> · ${esc(r.topic)} · ${esc(r.difficulty)} <span class="dim">· ${fmtDate(r.at)}</span></li>`).join('')}</ul>` : ''}
        </div>
      </section>`;
    el.querySelector('#quiz-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const cfg = { topic: f.get('custom').trim() || f.get('topic'), difficulty: f.get('difficulty'), count: Number(f.get('count')) };
      session = { phase: 'loading', cfg };
      draw();
      try {
        const questions = await generate(cfg);
        session = { phase: 'play', cfg, questions, i: 0, picked: null, score: 0, answers: [] };
      } catch (err) {
        session = { phase: 'error', message: err.message };
      }
      if (current.alive()) current.draw();
    });
    return;
  }

  if (S.phase === 'loading') {
    el.innerHTML = `<section class="panel center"><div class="spinner"></div><h3>Writing your ${S.cfg.count} questions…</h3><p class="dim">${esc(S.cfg.topic)} · ${S.cfg.difficulty}</p></section>`;
    return;
  }

  if (S.phase === 'error') {
    el.innerHTML = `<section class="panel center"><h3>⚠️ Couldn't create the quiz</h3><p class="dim">${esc(S.message)}</p><button class="primary" id="back">Try again</button></section>`;
    el.querySelector('#back').addEventListener('click', () => { session = { phase: 'setup' }; draw(); });
    return;
  }

  if (S.phase === 'play') {
    const q = S.questions[S.i];
    const answered = S.picked !== null;
    el.innerHTML = `
      <section class="panel scroll">
        <header class="panel-head"><div class="tile">🎓</div>
          <div class="head-text"><h2>${esc(S.cfg.topic)}</h2><p>${S.cfg.difficulty} · Question ${S.i + 1} of ${S.questions.length}</p></div>
          <button class="ghost" id="quit">Quit</button></header>
        <div class="progress"><div style="width:${(S.i / S.questions.length) * 100}%"></div></div>
        <div class="pad">
          <h3 class="question">${esc(q.question)}</h3>
          <div class="options">
            ${q.options.map((o, i) => {
              const cls = !answered ? '' : i === q.answerIndex ? 'correct' : i === S.picked ? 'wrong' : 'dim';
              return `<button class="option ${cls}" data-i="${i}" ${answered ? 'disabled' : ''}><b>${'ABCD'[i]}</b><span>${esc(o)}</span></button>`;
            }).join('')}
          </div>
          ${answered ? `<div class="feedback ${S.picked === q.answerIndex ? 'ok' : 'no'}"><b>${S.picked === q.answerIndex ? '✅ Correct!' : '❌ Not quite.'}</b> ${esc(q.explanation ?? '')}</div>
            <button class="primary wide" id="next">${S.i + 1 === S.questions.length ? 'See results' : 'Next question →'}</button>` : ''}
        </div>
      </section>`;
    el.querySelectorAll('.option').forEach((b) =>
      b.addEventListener('click', () => {
        S.picked = Number(b.dataset.i);
        if (S.picked === q.answerIndex) S.score++;
        S.answers.push(S.picked);
        draw();
      }),
    );
    el.querySelector('#quit')?.addEventListener('click', () => { session = { phase: 'setup' }; draw(); });
    el.querySelector('#next')?.addEventListener('click', () => {
      if (S.i + 1 === S.questions.length) {
        state.quizResults.unshift({ topic: S.cfg.topic, difficulty: S.cfg.difficulty, score: S.score, total: S.questions.length, at: Date.now() });
        state.quizResults = state.quizResults.slice(0, 20);
        persist();
        S.phase = 'done';
      } else {
        S.i++;
        S.picked = null;
      }
      draw();
    });
    return;
  }

  // phase === 'done'
  const pct = Math.round((S.score / S.questions.length) * 100);
  el.innerHTML = `
    <section class="panel scroll">
      <header class="panel-head"><div class="tile">🎓</div><div class="head-text"><h2>Results</h2><p>${esc(S.cfg.topic)} · ${S.cfg.difficulty}</p></div></header>
      <div class="pad">
        <div class="score"><span>${S.score}<small>/${S.questions.length}</small></span><p>${pct >= 80 ? '🏆 Excellent work!' : pct >= 60 ? '👍 Good, keep practising.' : '📚 Worth another look at this topic.'}</p></div>
        <div class="row"><button class="primary" id="retake">Retake this quiz</button><button class="ghost" id="new">New quiz</button></div>
        <h3>Review</h3>
        ${S.questions.map((q, i) => `
          <details class="review ${S.answers[i] === q.answerIndex ? 'ok' : 'no'}"><summary>${S.answers[i] === q.answerIndex ? '✅' : '❌'} ${esc(q.question)}</summary>
            <p>Your answer: <b>${esc(q.options[S.answers[i]])}</b></p>
            <p>Correct answer: <b>${esc(q.options[q.answerIndex])}</b></p>
            <p class="dim">${esc(q.explanation ?? '')}</p></details>`).join('')}
      </div>
    </section>`;
  el.querySelector('#retake').addEventListener('click', () => { session = { ...S, phase: 'play', i: 0, picked: null, score: 0, answers: [] }; draw(); });
  el.querySelector('#new').addEventListener('click', () => { session = { phase: 'setup' }; draw(); });
}
