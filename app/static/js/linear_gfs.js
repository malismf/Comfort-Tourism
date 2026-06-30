let seriesData  = [];     
let currentMoId = null;

const RU_MONTHS_LINEAR = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];

const COLOR_TCI = '#16a34a';   // зелёный — TCI
const COLOR_HCI = '#2563eb';   // синий — HCI

(async () => {
  if (typeof Plotly === 'undefined') {
    return showErrorLinear('Не удалось загрузить библиотеку Plotly');
  }
  try {
    const res = await fetch('/api/gfs/series').then(r => r.json());
    if (res.error) return showErrorLinear('Ошибка данных: ' + res.error);

    seriesData = Array.isArray(res.data) ? res.data : [];
    updateRunMetaLinear(res);
    renderMoSelect();

    if (seriesData.length) selectMo(seriesData[0].mo_id);
    else showErrorLinear('В базе нет данных прогноза');
  } catch (e) {
    showErrorLinear('Сетевая ошибка: ' + e.message);
  }
})();

function renderMoSelect() {
  const sel = document.getElementById('mo-select-linear');
  if (!sel) return;
  sel.innerHTML = '';
  seriesData.forEach(mo => {
    const opt = document.createElement('option');
    opt.value = mo.mo_id;
    opt.textContent = mo.name;
    sel.appendChild(opt);
  });
  sel.addEventListener('change', () => selectMo(+sel.value));
}

export function selectMo(moName, linearId) {
  const sel = document.getElementById('mo-select-linear');
  if (sel) sel.value = String(moName);

  const mo = seriesData.find(m => m.name === moName);
  if (!mo) return showErrorLinear('МО не найдено');
  drawChart(mo, linearId);
}

function drawChart(mo, linearId) {
  const series = (mo.series || []).slice().sort((a, b) => a.forecast_day - b.forecast_day);
  if (!series.length) return showErrorLinear('Нет данных по дням для выбранного МО');

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
  // Очищаем спиннер перед первой инициализацией Plotly (newPlot, не react —
  // контейнер может содержать HTML-заглушку)
  if (!el.classList.contains('js-plotly-plot')) el.innerHTML = '';

  try {
    Plotly.newPlot(linearId, [traceTci, traceHci], layout, {
      displayModeBar: false,
      responsive: true,
    });
  } catch (e) {
    showErrorLinear('Ошибка отрисовки графика: ' + e.message);
  }
}

function updateRunMetaLinear(res) {
  const el = document.getElementById('run-meta-linear');
  if (!el) return;

  const cycle = String(res.cycle ?? 0).padStart(2, '0');
  const days  = Array.isArray(res.days) ? res.days : [];
  const horizon = days.length
    ? `${days.length} дн. (+${days[0].day}…+${days[days.length - 1].day})`
    : '—';

  el.innerHTML =
    `Прогон <span class="v">№${res.run_id ?? '—'}</span>` +
    `<span class="dot">·</span>запуск <span class="v">${res.run_date ? fmtFullLinear(res.run_date) : '—'}, ${cycle} UTC</span>` +
    `<span class="dot">·</span>горизонт <span class="v">${horizon}</span>`;
}

function showErrorLinear(msg) {
  const el = document.getElementById('linear-chart');
  if (el) el.innerHTML = `<div class="placeholder error">${msg}</div>`;
}

function fmtShortLinear(iso) {
  if (!iso) return '';
  const p = iso.split('-');
  if (p.length < 3) return iso;
  return `${parseInt(p[2], 10)} ${RU_MONTHS_LINEAR[parseInt(p[1], 10) - 1]}`;
}

function fmtFullLinear(iso) {
  if (!iso) return '—';
  const p = iso.split('-');
  if (p.length < 3) return iso;
  return `${parseInt(p[2], 10)} ${RU_MONTHS_LINEAR[parseInt(p[1], 10) - 1]} ${p[0]}`;
}
