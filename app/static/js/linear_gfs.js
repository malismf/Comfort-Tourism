const RU_MONTHS_LINEAR = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];

// Контейнеры графиков: своя страница — свой график (TCI / HCI)
const LINEAR_TARGETS = ['linear-gfs', 'linear-hci'];

const COLOR_TCI = '#16a34a';   // зелёный — TCI
const COLOR_HCI = '#2563eb';   // синий   — HCI

// Кэш ответов /api/gfs/series по имени МО (эндпоинт теперь отдаёт один МО),
// чтобы не запрашивать заново при повторном клике по тому же району.
const seriesCache = new Map();

(function init() {
  if (typeof Plotly === 'undefined') {
    LINEAR_TARGETS.forEach(id => showErrorLinear('Не удалось загрузить библиотеку Plotly', id));
    return;
  }
  // Данные подтягиваются по клику на МО — ждём выбор района на карте
  LINEAR_TARGETS.forEach(id => promptLinear(id));
})();

// Вызывается из map_gfs.js по клику на МО: selectMo(name, 'linear-gfs' | 'linear-hci')
export async function selectMo(moName, linearId = 'linear-gfs') {
  // Из кэша — мгновенно
  if (seriesCache.has(moName)) {
    const cached = seriesCache.get(moName);
    drawChart(cached, linearId);
    addChartTitle(cached, linearId);
    return;
  }

  // Заглушку-«Загрузка» показываем только до первой отрисовки графика;
  // при повторных кликах оставляем прежний график, пока не придут данные
  const el = document.getElementById(linearId);
  if (el && !el.classList.contains('js-plotly-plot')) {
    el.innerHTML = '<div class="placeholder">Загрузка…</div>';
  }

  let res;
  try {
    res = await fetch(`/api/gfs/series?mo=${encodeURIComponent(moName)}`).then(r => r.json());
  } catch (e) {
    return showErrorLinear('Сетевая ошибка: ' + e.message, linearId);
  }

  if (res.error) return showErrorLinear('Ошибка данных: ' + res.error, linearId);
  if (!Array.isArray(res.series) || !res.series.length) {
    return showErrorLinear(`Нет данных по дням для «${moName}»`, linearId);
  }

  seriesCache.set(moName, res);
  drawChart(res, linearId);
  addChartTitle(res, linearId);
}

function addChartTitle(mo, linearId) {
  const container = document.getElementById(linearId);
  const titleEl = container.parentElement.querySelector('.linear-title');
  if (titleEl) titleEl.innerHTML = `<span class="mo-name">${mo.name}</span>`;
}

function drawChart(mo, linearId) {
  const series = (mo.series || []).slice().sort((a, b) => a.forecast_day - b.forecast_day);
  if (!series.length) return showErrorLinear('Нет данных по дням для выбранного МО', linearId);

  // Категориальная ось X: «+0 · 26 июн» — день прогноза уникален → метки не схлопываются
  const xLabels = series.map(s => {
    const d = fmtShortLinear(s.date_local);
    return d ? `+${s.forecast_day} · ${d}` : `+${s.forecast_day}`;
  });

  const traceTci = {
    type: 'scatter',
    mode: 'lines+markers',
    name: 'TCI',
    x: xLabels,
    y: series.map(s => s.tci),
    line:   { color: COLOR_TCI, width: 3, shape: 'linear' },
    marker: { color: COLOR_TCI, size: 7 },
    connectgaps: true,
  };

  const traceHci = {
    type: 'scatter',
    mode: 'lines+markers',
    name: 'HCI',
    x: xLabels,
    y: series.map(s => s.hci),
    line:   { color: COLOR_HCI, width: 3, shape: 'linear' },
    marker: { color: COLOR_HCI, size: 7 },
    connectgaps: true,
  };

  // Пунктирные линии порогов 6-тиерной шкалы приложения (40/50/60/70/80)
  const thresholds = [40, 50, 60, 70, 80];
  const shapes = thresholds.map(v => ({
    type: 'line',
    xref: 'paper', x0: 0, x1: 1,
    yref: 'y',     y0: v, y1: v,
    line: { color: 'rgba(148,163,184,0.35)', width: 1, dash: 'dot' },
    layer: 'below',
  }));

  const layout = {
    autosize: true,
    height: 560,
    margin: { l: 50, r: 20, t: 18, b: 60 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { family: '-apple-system, system-ui, sans-serif', color: '#334155' },
    xaxis: {
      type: 'category',
      title: { text: 'День прогноза', font: { size: 12, color: '#64748b' } },
      tickfont: { size: 11, color: '#52525b' },
      tickangle: -30,
      showgrid: false,
      zeroline: false,
    },
    yaxis: {
      title: { text: 'Баллы', font: { size: 12, color: '#64748b' } },
      range: [0, 100],
      dtick: 20,
      hoverformat: '.1f',
      tickfont: { size: 11, color: '#52525b' },
      gridcolor: 'rgba(226,232,240,0.8)',
      zeroline: false,
    },
    shapes: shapes,
    legend: {
      orientation: 'h',
      x: 0.5, xanchor: 'center',
      y: 1.06, yanchor: 'bottom',
      font: { size: 13 },
    },
    hovermode: 'x unified',
  };

  const el = document.getElementById(linearId);
  if (!el) return;
  // Очищаем заглушку перед первой инициализацией Plotly (newPlot, не react —
  // контейнер может содержать HTML-заглушку)
  if (!el.classList.contains('js-plotly-plot')) el.innerHTML = '';

  try {
    Plotly.newPlot(linearId, [traceTci, traceHci], layout, {
      displayModeBar: false,
      responsive: true,
    });
  } catch (e) {
    showErrorLinear('Ошибка отрисовки графика: ' + e.message, linearId);
  }
}

function promptLinear(linearId) {
  const el = document.getElementById(linearId);
  if (el && !el.classList.contains('js-plotly-plot')) {
    el.innerHTML = '<div class="placeholder">Выберите муниципальное образование на карте</div>';
  }
}

function showErrorLinear(msg, linearId = 'linear-gfs') {
  const el = document.getElementById(linearId);
  if (el) el.innerHTML = `<div class="placeholder error">${msg}</div>`;
}

function fmtShortLinear(iso) {
  if (!iso) return '';
  const p = iso.split('-');
  if (p.length < 3) return iso;
  return `${parseInt(p[2], 10)} ${RU_MONTHS_LINEAR[parseInt(p[1], 10) - 1]}`;
}