import { MapModule } from './map_gfs.js';

let geojson   = null;
let availDays = [];
let currentDay = null;

const RU_MONTHS = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];

(async () => {
  if (typeof Plotly === 'undefined') {
    return showError('Не удалось загрузить библиотеку Plotly');
  }
  try {
    const [gj, days] = await Promise.all([
      fetch('/api/geojson').then(r => r.json()),
      fetch('/api/gfs/days').then(r => r.json()),
    ]);
    if (gj.error)   return showError('Ошибка GeoJSON: ' + gj.error);
    if (days.error) return showError('Ошибка дней: ' + days.error);

    geojson   = gj;
    availDays = Array.isArray(days) ? days : [];
    renderDays();

    if (availDays.length) selectDay(availDays[0].day);
    else showError('В базе нет данных прогноза');
  } catch (e) {
    showError('Сетевая ошибка: ' + e.message);
  }
})();

function renderDays() {
  const track = document.getElementById('track');
  track.innerHTML = '';
  availDays.forEach(d => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'day';
    btn.dataset.day = d.day;
    btn.innerHTML = `<span class="dn">+${d.day}</span><span class="dd">${d.date ? fmtShort(d.date) : ''}</span>`;
    btn.addEventListener('click', () => selectDay(d.day));
    track.appendChild(btn);
  });
}

function selectDay(day) {
  currentDay = day;
  document.querySelectorAll('#track .day').forEach(b =>
    b.classList.toggle('active', +b.dataset.day === day)
  );
  loadMap(day);
}

async function loadMap(forecastDay) {
  let res;
  try {
    res = await fetch(`/api/gfs/tci?forecast_day=${forecastDay}`).then(r => r.json());
  } catch (e) {
    return showError('Сетевая ошибка: ' + e.message);
  }
  if (res.error) return showError(res.error);

  updateRunMeta(res);

  if (!res.data || !res.data.length) {
    return showError(`Нет данных для дня +${forecastDay}`);
  }
  drawMap(res.data, forecastDay);
}

function drawMap(data, forecastDay) {
  try {
    MapModule.drawChoropleth({
      containerId: 'gfs-map',
      geojson: geojson,
      data: data,
      day: forecastDay,
      valueKey: 'tci',
      labelFn: tciLabel,
      colorbarTitle: 'TCI'
    });
  } catch (e) {
    showError(e.message);
  }
}

function updateRunMeta(res) {
  const forecastDate = res.data?.[0]?.date_local;
  const cycle = String(res.cycle ?? 0).padStart(2, '0');
  document.getElementById('run-meta').innerHTML =
    `Прогон <span class="v">№${res.run_id ?? '—'}</span>` +
    `<span class="dot">·</span>запуск <span class="v">${res.run_date ? fmtFull(res.run_date) : '—'}, ${cycle} UTC</span>` +
    `<span class="dot">·</span>прогноз на <span class="v">${forecastDate ? fmtFull(forecastDate) : '—'}</span> (+${res.forecast_day} дн.)`;
}

function showError(msg) {
  document.getElementById('gfs-map').innerHTML =
    `<div class="placeholder error">${msg}</div>`;
}

function fmtShort(iso) {
  const p = iso.split('-');
  if (p.length < 3) return iso;
  return `${parseInt(p[2],10)} ${RU_MONTHS[parseInt(p[1],10)-1]}`;
}

function fmtFull(iso) {
  const p = iso.split('-');
  if (p.length < 3) return iso;
  return `${parseInt(p[2],10)} ${RU_MONTHS[parseInt(p[1],10)-1]} ${p[0]}`;
}

function tciLabel(tci) {
  if (tci == null) return 'нет данных';
  if (tci >= 90) return 'идеально';
  if (tci >= 80) return 'отлично';
  if (tci >= 70) return 'очень хорошо';
  if (tci >= 60) return 'хорошо';
  if (tci >= 50) return 'приемлемо';
  if (tci >= 40) return 'нежелательно';
  return 'неблагоприятно';
}