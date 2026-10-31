const STORAGE_KEY = 'geminiPromptArena_v2';
const ROUNDS = {
  simplify: {
    id: 'simplify', no: '01', title: 'Simplify Topik', display: 'SIMPLIFY TOPIK',
    subtitle: 'Ubah topik kuliah yang sulit menjadi instruksi belajar yang jelas dan terarah.',
    description: 'Buat prompt yang meminta Gemini menjelaskan satu topik kuliah yang terasa sulit menggunakan bahasa sederhana, analogi, dan contoh sehari-hari.',
    image: '/assets/round-1-study.jpg', icon: '/assets/round-1-icon.png',
    focus: 'Kejelasan tujuan, konteks pembelajar, strategi penyederhanaan, analogi, dan struktur penjelasan.'
  },
  summarize: {
    id: 'summarize', no: '02', title: 'Summarize Modul', display: 'SUMMARIZE MODUL',
    subtitle: 'Rancang instruksi agar Gemini merangkum materi secara terstruktur dan setia pada sumber.',
    description: 'Buat prompt yang akan digunakan bersama potongan modul dari panitia. Tentukan bagaimana Gemini memilih poin penting dan menyajikannya.',
    image: '/assets/round-2-library.jpg', icon: '/assets/round-2-icon.png',
    focus: 'Arahan penggunaan sumber, seleksi informasi, format ringkasan, kesetiaan pada modul, dan batasan agar tidak mengarang.'
  },
  roleplay: {
    id: 'roleplay', no: '03', title: 'Roleplay Tutor', display: 'ROLEPLAY TUTOR',
    subtitle: 'Buat prompt tutor AI yang mampu membangun percakapan dua arah.',
    description: 'Buat prompt yang meminta Gemini berperan sebagai tutor, bertanya balik, menyesuaikan penjelasan, dan memberi umpan balik selama proses belajar.',
    image: '/assets/round-3-tutor.jpg', icon: '/assets/round-3-icon.png',
    focus: 'Definisi peran, tujuan belajar, desain interaksi, pertanyaan adaptif, umpan balik, dan aturan alur percakapan.'
  }
};

let state = loadState();
let currentView = 'dashboard';
let activeRound = null;
let apiStatus = { configured: false, model: 'gemini-3.8-flash' };
let pendingPromptSubmission = null;

function loadState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { participants: [], activeNim: null }; }
  catch (_) { return { participants: [], activeNim: null }; }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function esc(value = '') {
  return String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}
function currentParticipant() { return state.participants.find(person => person.nim === state.activeNim) || null; }
function initials(name = 'G') { return name.trim().split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase() || 'G'; }
function toast(message) {
  const element = document.getElementById('toast');
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.remove('show'), 3400);
}
function updateApiStatus() {
  const element = document.getElementById('apiStatus');
  element.classList.toggle('connected', apiStatus.configured);
  element.querySelector('small').textContent = apiStatus.configured ? `Terhubung · ${apiStatus.model}` : 'API key belum diatur';
}
async function refreshApiStatus() {
  try { apiStatus = await (await fetch('/api/status')).json(); }
  catch (_) { apiStatus = { configured: false, model: 'Gemini API' }; }
  updateApiStatus();
}
function updateProfile() {
  const participant = currentParticipant();
  document.getElementById('profileName').textContent = participant ? participant.name : 'Belum mendaftar';
  document.getElementById('avatarText').textContent = participant ? initials(participant.name) : 'G';
}
function setView(view) {
  currentView = view;
  document.querySelectorAll('.nav-item').forEach(button => button.classList.toggle('active', button.dataset.view === view));
  document.getElementById('crumbCurrent').textContent = view === 'leaderboard' ? 'Scoreboard' : 'Overview';
  render();
}
function getParticipantSummary(person) {
  const scores = Object.values(person.rounds || {});
  const completed = scores.length;
  const average = completed ? scores.reduce((sum, result) => sum + Number(result.totalScore || 0), 0) / completed : 0;
  return { completed, average: Math.round(average * 10) / 10, allDone: completed === 3 };
}
function roundCard(id, participant) {
  const round = ROUNDS[id];
  const result = participant?.rounds?.[id];
  return `<article class="round-card">
    <div class="round-photo"><img src="${round.image}" alt=""><span class="round-tag">RONDE ${round.no}</span><span class="round-badge"><img src="${round.icon}" alt=""></span></div>
    <div class="round-info"><h3>${round.title}</h3><p>${round.description}</p>
      <div class="round-foot"><small>${result ? 'Prompt sudah dinilai' : 'Submission: prompt saja'}</small><span class="round-score">${result ? `${Number(result.totalScore).toFixed(1)} / 100` : 'OPEN CHALLENGE'}</span></div>
      <div class="progress-line"><span style="width:${result ? result.totalScore : 0}%"></span></div>
      <button class="btn ${result ? 'btn-light' : 'btn-primary'}" style="width:100%;margin-top:13px" data-round="${id}">${result ? 'Lihat laporan' : 'Mulai ronde'} <span>→</span></button>
    </div>
  </article>`;
}
function renderDashboard() {
  const participant = currentParticipant();
  const summary = participant ? getParticipantSummary(participant) : { completed: 0, average: 0, allDone: false };
  const root = document.getElementById('viewRoot');
  const participantArea = participant ? `
    <div class="participant-current"><span class="avatar">${esc(initials(participant.name))}</span><span><b>${esc(participant.name)}</b><small>NIM: ${esc(participant.nim)} · ${summary.completed}/3 ronde selesai</small></span><button class="btn btn-light" style="margin-left:auto" id="switchParticipant">Ganti peserta</button></div>` : `
    <div class="participant-panel registration-panel">
      <div class="registration-heading"><span class="section-kicker">PESERTA KOMPETISI</span><h3>Daftar untuk memulai</h3><p>Isi nama lengkap dan NIM. Tidak ada data lain yang diminta.</p></div>
      <div class="field"><label>NAMA LENGKAP</label><input id="participantName" maxlength="100" autocomplete="name" placeholder="Masukkan nama lengkap"></div>
      <div class="field"><label>NIM</label><input id="participantNim" maxlength="40" autocomplete="off" placeholder="Masukkan NIM"></div>
      <button class="btn btn-primary" id="registerParticipant">Daftar peserta <span>→</span></button>
    </div>`;

  root.innerHTML = `
    <section class="hero">
      <div class="hero-content">
        <span class="eyebrow"><span class="star">✦</span> GOOGLE STUDENT AMBASSADOR · ACADEMIC PROMPTING <span class="eyebrow-host">· GABRIEL IGNASIUS SINAGA</span></span>
        <h1>Think better.<br><span>Prompt smarter.</span></h1>
        <p>Uji kemampuan menyusun prompt melalui tiga tantangan. Tulis prompt terbaikmu, kirim untuk dievaluasi Gemini, lalu pelajari skor dan feedback yang diberikan secara kritis.</p>
        <div class="hero-meta"><span>◈ 3 RONDE TANTANGAN</span><span>◎ PENILAIAN PROMPT 100 POIN</span><span>✦ AI-POWERED FEEDBACK</span></div>
      </div>
      <div class="hero-art"><div class="art-glow"></div><img src="/assets/round-1-study.jpg" alt="Meja belajar"><img class="art-icon" src="/assets/gemini-spark.png" alt=""></div>
    </section>
    ${participantArea}
    <div class="welcome-row"><div><div class="section-kicker">YOUR CHALLENGE BOARD</div><h2 class="section-title">Pilih ronde tantangan</h2><div class="section-sub">Setiap ronde hanya meminta satu hal: prompt yang kamu susun.</div></div><button class="btn btn-light" data-view="leaderboard">Lihat scoreboard ↗</button></div>
    <div class="metrics">
      <div class="metric"><div class="metric-icon">✦</div><div><b>${participant ? `${summary.completed}/3` : '0/3'}</b><small>Ronde selesai</small></div></div>
      <div class="metric"><div class="metric-icon">◎</div><div><b>${participant && summary.completed ? summary.average.toFixed(1) : '—'}</b><small>Rata-rata sementara</small></div></div>
      <div class="metric"><div class="metric-icon">★</div><div><b>${summary.allDone ? 'FINAL' : 'IN PROGRESS'}</b><small>Status kompetisi</small></div></div>
    </div>
    <div class="round-grid">${['simplify', 'summarize', 'roleplay'].map(id => roundCard(id, participant)).join('')}</div>
    <div class="notice" style="margin-top:18px">Sistem hanya menilai teks prompt yang dikirim peserta. Jawaban Gemini tidak diminta dan tidak dianalisis. Nama dan NIM digunakan untuk identitas laporan, bukan sebagai bahan penilaian AI.</div>`;

  root.querySelectorAll('[data-round]').forEach(button => button.addEventListener('click', () => openRound(button.dataset.round)));
  root.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
  document.getElementById('registerParticipant')?.addEventListener('click', registerParticipant);
  document.getElementById('switchParticipant')?.addEventListener('click', showParticipantSwitcher);
}
function registerParticipant() {
  const name = document.getElementById('participantName').value.trim();
  const nim = document.getElementById('participantNim').value.trim();
  if (!name || !nim) return toast('Nama lengkap dan NIM wajib diisi.');
  let participant = state.participants.find(item => item.nim.toLowerCase() === nim.toLowerCase());
  if (participant) {
    participant.name = name;
  } else {
    participant = { name, nim, rounds: {}, createdAt: new Date().toISOString() };
    state.participants.push(participant);
  }
  state.activeNim = participant.nim;
  saveState();
  updateProfile();
  renderDashboard();
  toast('Pendaftaran peserta berhasil.');
}
function showParticipantSwitcher() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-backdrop';
  const rows = state.participants.map(person => `<button class="switch-row" data-nim="${esc(person.nim)}"><b>${esc(person.name)}</b><small>NIM: ${esc(person.nim)}</small></button>`).join('');
  overlay.innerHTML = `<div class="modal"><h2>Pilih peserta</h2><p>Pilih peserta yang akan menggunakan perangkat ini. Hasil tersimpan di browser ini.</p><div class="switch-list">${rows || '<small>Belum ada peserta.</small>'}</div><div class="modal-actions"><button class="btn btn-light" id="closeSwitch">Tutup</button><button class="btn btn-primary" id="newParticipant">Daftar peserta baru</button></div></div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#closeSwitch').onclick = () => overlay.remove();
  overlay.querySelector('#newParticipant').onclick = () => { overlay.remove(); state.activeNim = null; saveState(); updateProfile(); renderDashboard(); };
  overlay.querySelectorAll('[data-nim]').forEach(button => button.addEventListener('click', () => {
    state.activeNim = button.dataset.nim;
    saveState(); updateProfile(); overlay.remove(); renderDashboard();
  }));
}
function rubricPreview(id) {
  const rubrics = {
    simplify: [['Kejelasan tujuan', 15], ['Konteks dan audiens', 15], ['Spesifikasi tugas', 15], ['Strategi penyederhanaan', 20], ['Struktur keluaran', 15], ['Contoh dan analogi', 10], ['Batasan dan kualitas', 10]],
    summarize: [['Arahan penggunaan sumber', 20], ['Cakupan informasi', 15], ['Format keluaran', 15], ['Kesetiaan sumber', 20], ['Audiens dan tujuan', 10], ['Prioritas detail', 10], ['Kejelasan instruksi', 10]],
    roleplay: [['Definisi peran tutor', 15], ['Konteks belajar', 15], ['Interaksi dua arah', 20], ['Pertanyaan adaptif', 15], ['Umpan balik', 15], ['Gaya komunikasi', 10], ['Aturan percakapan', 10]]
  }[id];
  return `<aside class="rubric-card"><h3>Rubrik evaluasi prompt</h3><p>Gemini akan memeriksa prompt berdasarkan tujuh aspek khusus ronde ini.</p><div class="rubric-group"><strong>KRITERIA PENILAIAN</strong>${rubrics.map(([title, max]) => `<div class="rubric-item"><span>${title}</span><b>${max} pt</b></div>`).join('')}</div><div class="score-weight"><span>Total maksimal</span><span>100 / 100</span></div><div class="notice" style="margin-top:14px">Penilaian hanya berdasarkan teks prompt. Hasil atau jawaban Gemini tidak diminta.</div></aside>`;
}
function openRound(id) {
  const participant = currentParticipant();
  if (!participant) {
    toast('Daftarkan nama dan NIM terlebih dahulu.');
    document.getElementById('participantName')?.focus();
    return;
  }
  activeRound = id;
  currentView = 'challenge';
  document.querySelectorAll('.nav-item').forEach(button => button.classList.remove('active'));
  document.getElementById('crumbCurrent').textContent = ROUNDS[id].title;
  const round = ROUNDS[id];
  const previous = participant.rounds[id];
  document.getElementById('viewRoot').innerHTML = `
    <div class="challenge-head"><button class="back-link" id="backDashboard">← Kembali ke overview</button><span class="section-kicker">RONDE ${round.no} DARI 03</span></div>
    <section class="round-hero"><div class="round-hero-copy"><span class="eyebrow">ROUND ${round.no} · ${round.title.toUpperCase()}</span><h1>${round.display}</h1><p>${round.description}</p></div><div class="round-hero-img"><img src="${round.image}" alt=""></div></section>
    <div class="form-layout">
      <form class="form-card" id="promptForm">
        <div><span class="section-kicker">SUBMISSION PESERTA</span><h2 style="margin-top:6px">Masukkan prompt kamu</h2></div>
        <p class="form-intro">${round.subtitle} Tempel prompt persis seperti yang akan kamu berikan kepada Gemini. Tidak perlu menempel jawaban Gemini.</p>
        <div class="prompt-task"><b>Fokus ronde ini</b><span>${round.focus}</span></div>
        <div class="field"><label>PROMPT PESERTA <span style="color:#e08d43">*</span></label><textarea id="promptText" class="large prompt-only" maxlength="20000" required placeholder="Tulis atau tempel prompt yang kamu buat di sini…">${esc(previous?.prompt || participant.drafts?.[id] || '')}</textarea><div class="textarea-meta"><span>Hanya prompt yang akan dikirim untuk dinilai.</span><span id="charCount">${(previous?.prompt || '').length} / 20.000</span></div></div>
        <div class="notice ${apiStatus.configured ? 'good' : 'warn'}">${apiStatus.configured ? `Gemini Evaluator siap menggunakan model <b>${esc(apiStatus.model)}</b>.` : 'API key belum terhubung. Panitia perlu mengatur GEMINI_API_KEY di file .env dan menjalankan ulang server.'} Nama dan NIM tidak dikirim ke Gemini API.</div>
        <div class="form-actions"><small>Pastikan prompt yang dikirim adalah prompt final yang ingin kamu ikutsertakan dalam kompetisi.</small><button class="btn btn-primary" type="submit" ${apiStatus.configured ? '' : 'disabled'}>Evaluasi prompt <span>✦</span></button></div>
      </form>
      ${rubricPreview(id)}
    </div>`;
  document.getElementById('backDashboard').onclick = () => setView('dashboard');
  const textarea = document.getElementById('promptText');
  textarea.addEventListener('input', () => { document.getElementById('charCount').textContent = `${textarea.value.length.toLocaleString('id-ID')} / 20.000`; });
  document.getElementById('promptForm').addEventListener('submit', submitPrompt);
}
async function submitPrompt(event) {
  event.preventDefault();
  const prompt = document.getElementById('promptText').value.trim();
  const participant = currentParticipant();
  if (!participant) return toast('Peserta tidak ditemukan. Silakan daftar kembali.');
  if (!prompt) return toast('Prompt wajib diisi.');

  pendingPromptSubmission = { roundId: activeRound, prompt };
  participant.drafts = participant.drafts || {};
  participant.drafts[activeRound] = prompt;
  saveState();
  await runPromptEvaluation(pendingPromptSubmission);
}

async function runPromptEvaluation(submission) {
  const root = document.getElementById('viewRoot');
  const round = ROUNDS[submission.roundId];
  root.innerHTML = `<div class="loading-panel"><div class="spinner"></div><h2>Gemini sedang menilai prompt…</h2><p>Memeriksa tujuh kriteria khusus ronde ini.<br>Server akan mencoba ulang otomatis jika Gemini sedang padat. Prompt kamu tetap tersimpan.</p></div>`;

  try {
    // Only roundId + prompt are sent. Participant name and NIM stay in this browser.
    const response = await fetch('/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission)
    });
    const result = await response.json();
    if (!response.ok) {
      const error = new Error(result.error || 'Evaluasi gagal.');
      error.retryable = Boolean(result.retryable);
      error.errorCode = result.errorCode || '';
      error.attempts = result.attempts || 1;
      throw error;
    }

    const participant = currentParticipant();
    if (!participant) throw new Error('Data peserta tidak ditemukan. Silakan pilih peserta kembali.');
    const report = { ...result, prompt: submission.prompt };
    participant.rounds[submission.roundId] = report;
    if (participant.drafts) delete participant.drafts[submission.roundId];
    pendingPromptSubmission = null;
    saveState();
    renderReport(report, participant);
  } catch (error) {
    const retryable = Boolean(error.retryable);
    const detail = esc(error.message);
    const retryButton = retryable
      ? `<button class="btn btn-primary" id="retryPrompt">Coba evaluasi lagi ↻</button>`
      : '';
    root.innerHTML = `
      <div class="empty-state">
        <img src="/assets/gemini-spark.png" alt="">
        <h3>Evaluasi belum berhasil</h3>
        <p>${detail}</p>
        <p class="retry-preserve-note">Prompt kamu sudah disimpan sementara. Kamu tidak perlu mengetik ulang.</p>
        <div class="result-actions" style="justify-content:center">
          ${retryButton}
          <button class="btn btn-light" id="backToPromptForm">Kembali ke form</button>
        </div>
      </div>`;
    document.getElementById('retryPrompt')?.addEventListener('click', () => {
      if (pendingPromptSubmission) runPromptEvaluation(pendingPromptSubmission);
    });
    document.getElementById('backToPromptForm').onclick = () => openRound(submission.roundId);
  }
}

function criteriaMarkup(criteria) {
  return criteria.map(item => {
    const percentage = item.max ? Math.max(0, Math.min(100, item.score / item.max * 100)) : 0;
    return `<div class="criterion"><div class="criterion-top"><b>${esc(item.title)}</b><span>${Number(item.score).toFixed(1)} / ${item.max}</span></div><p>${esc(item.feedback)}</p><div class="evidence"><b>Bukti dari prompt:</b> ${esc(item.evidence)}</div><div class="criterion-bar"><span style="width:${percentage}%"></span></div></div>`;
  }).join('');
}
function feedbackList(items, emptyText) {
  return items?.length ? `<ul class="feedback-list">${items.map(item => `<li>${esc(item)}</li>`).join('')}</ul>` : `<p class="section-sub">${emptyText}</p>`;
}
function renderReport(report, participant) {
  currentView = 'report';
  document.getElementById('crumbCurrent').textContent = 'Laporan penilaian';
  const angle = Math.max(0, Math.min(100, report.totalScore)) * 3.6;
  document.getElementById('viewRoot').innerHTML = `
    <div class="challenge-head"><button class="back-link" id="reportBack">← Kembali ke ronde</button><span class="section-kicker">PROMPT EVALUATION REPORT · ${esc(report.roundTitle.toUpperCase())}</span></div>
    <div class="report-identity"><div><span class="section-kicker">IDENTITAS PESERTA</span><h2>${esc(participant.name)}</h2><p>NIM: <b>${esc(participant.nim)}</b></p></div><div class="report-mark">GEMINI<br><b>PROMPT ARENA</b></div></div>
    <div class="result-top">
      <div class="score-card"><div class="score-ring" style="--score-angle:${angle}deg"><div class="score-ring-inner"><b>${Number(report.totalScore).toFixed(1)}</b><small>/ 100</small></div></div><span>${esc(report.grade.toUpperCase())}</span></div>
      <div class="score-detail"><h1>Skor kualitas prompt</h1><p>${esc(report.roundTitle)}<br>Dievaluasi oleh ${esc(report.model)} · ${new Date(report.evaluatedAt).toLocaleString('id-ID')}</p><div class="overall-feedback"><b>Feedback utama evaluator</b><p>${esc(report.overallFeedback)}</p></div></div>
    </div>
    <section class="result-card criteria-report"><h3>Rincian penilaian per kriteria <span style="color:#347cf6">(100 poin)</span></h3>${criteriaMarkup(report.criteria)}</section>
    <div class="feedback-grid">
      <section class="feedback-card"><h3>✦ Kekuatan prompt</h3>${feedbackList(report.strengths, 'Tidak ada kekuatan spesifik yang dicatat.')}</section>
      <section class="feedback-card issues"><h3>△ Temuan kritis</h3>${feedbackList(report.criticalIssues, 'Tidak ada isu kritis yang dicatat.')}</section>
      <section class="feedback-card"><h3>↗ Rekomendasi perbaikan</h3>${feedbackList(report.improvementActions, 'Belum ada rekomendasi perbaikan.')}</section>
      <section class="feedback-card"><h3>Catatan juri</h3><p class="section-sub">${esc(report.juryNote || 'Tidak ada catatan tambahan.')}</p><div class="notice" style="margin-top:12px">Penilaian ini didasarkan pada prompt yang diserahkan. Output Gemini tidak menjadi bagian dari penilaian.</div></section>
    </div>
    <div class="result-actions"><button class="btn btn-primary" id="printReport">Cetak / Simpan PDF</button><button class="btn btn-light" id="downloadReport">Unduh laporan JSON</button><button class="btn btn-light" id="backOverview">Kembali ke dashboard</button></div>
    <div class="notice">Laporan peserta: <b>${esc(participant.name)}</b> · NIM <b>${esc(participant.nim)}</b>. Skor akhir ronde dihitung dari jumlah tujuh kriteria rubrik. Juri dapat menggunakan bukti kutipan dan feedback sebagai dasar verifikasi.</div>`;
  document.getElementById('reportBack').onclick = () => openRound(report.roundId);
  document.getElementById('printReport').onclick = () => window.print();
  document.getElementById('downloadReport').onclick = () => downloadJson({ participant: { name: participant.name, nim: participant.nim }, report }, `laporan-${report.roundId}-${participant.nim}.json`);
  document.getElementById('backOverview').onclick = () => setView('dashboard');
}
function renderLeaderboard() {
  const rows = [...state.participants].map(person => ({ person, summary: getParticipantSummary(person) })).sort((a, b) => {
    return Number(b.summary.allDone) - Number(a.summary.allDone) || b.summary.average - a.summary.average || b.summary.completed - a.summary.completed;
  });
  document.getElementById('viewRoot').innerHTML = `
    <div class="leader-head"><div><div class="section-kicker">COMPETITION RESULTS</div><h1 class="section-title" style="font-size:26px">Scoreboard peserta</h1><div class="section-sub">Rekap skor dari tiga ronde pada browser ini.</div></div><div style="display:flex;gap:8px"><button class="btn btn-light" id="exportCsv">Unduh CSV</button><button class="btn btn-light" id="printBoard">Cetak</button></div></div>
    ${rows.length ? `<div class="leader-table-wrap"><table class="leader-table"><thead><tr><th>RANK</th><th>NAMA PESERTA</th><th>NIM</th><th>SIMPLIFY</th><th>SUMMARIZE</th><th>ROLEPLAY</th><th>RONDE</th><th>SKOR AKHIR</th></tr></thead><tbody>${rows.map(({ person, summary }, index) => `<tr><td><span class="rank-num">${index + 1}</span></td><td><b>${esc(person.name)}</b></td><td>${esc(person.nim)}</td><td>${scoreText(person, 'simplify')}</td><td>${scoreText(person, 'summarize')}</td><td>${scoreText(person, 'roleplay')}</td><td>${summary.completed}/3</td><td class="final-score">${summary.allDone ? summary.average.toFixed(1) : '—'}</td></tr>`).join('')}</tbody></table></div><div class="notice" style="margin-top:14px">Skor akhir kompetisi ditampilkan setelah peserta menyelesaikan ketiga ronde. Perhitungan menggunakan rata-rata sederhana dari tiga skor ronde. Data scoreboard tersimpan lokal pada browser ini.</div>` : `<div class="empty-state"><img src="/assets/gemini-spark.png" alt=""><h3>Belum ada peserta</h3><p>Peserta yang mendaftar dan menyelesaikan ronde akan muncul di scoreboard.</p><button class="btn btn-primary" id="goOverview">Ke overview</button></div>`}`;
  document.getElementById('goOverview')?.addEventListener('click', () => setView('dashboard'));
  document.getElementById('exportCsv')?.addEventListener('click', exportCsv);
  document.getElementById('printBoard')?.addEventListener('click', () => window.print());
}
function scoreText(person, roundId) {
  const score = person.rounds?.[roundId]?.totalScore;
  return score === undefined ? '—' : Number(score).toFixed(1);
}
function exportCsv() {
  const rows = [['Nama', 'NIM', 'Simplify Topik', 'Summarize Modul', 'Roleplay Tutor', 'Ronde Selesai', 'Skor Akhir']];
  state.participants.forEach(person => {
    const summary = getParticipantSummary(person);
    rows.push([person.name, person.nim, person.rounds.simplify?.totalScore ?? '', person.rounds.summarize?.totalScore ?? '', person.rounds.roleplay?.totalScore ?? '', summary.completed, summary.allDone ? summary.average : '']);
  });
  const csv = '\uFEFF' + rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'scoreboard-gemini-prompt-arena.csv');
}
function downloadJson(data, filename) {
  downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), filename);
}
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename; anchor.click();
  URL.revokeObjectURL(url);
}
function render() {
  updateProfile();
  if (currentView === 'leaderboard') renderLeaderboard();
  else renderDashboard();
}

document.querySelectorAll('.nav-item').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
document.querySelectorAll('.side-round').forEach(button => button.addEventListener('click', () => openRound(button.dataset.round)));
document.querySelectorAll('.brand').forEach(button => button.addEventListener('click', event => { event.preventDefault(); setView('dashboard'); }));
document.getElementById('profileChip').addEventListener('click', () => currentParticipant() ? showParticipantSwitcher() : toast('Daftar nama dan NIM pada dashboard terlebih dahulu.'));
refreshApiStatus();
render();
