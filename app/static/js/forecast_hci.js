import { MapModule } from './map_gfs.js';

let geojsonHci    = null;
let availDaysHci  = [];
let currentDayHci = null;

const RU_MONTHS_HCI = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];

(async () => {
  if (typeof Plotly === 'undefined') {
    return showErrorHci('Не удалось загрузить библиотеку Plotly');
  }
  try {
    const [gj, days] = await Promise.all([
      fetch('/api/geojson').then(r => r.json()),
      fetch('/api/gfs/days').then(r => r.json()),
    ]);
    if (gj.error)   return showErrorHci('Ошибка GeoJSON: ' + gj.error);
    if (days.error) return showErrorHci('Ошибка дней: ' + days.error);

    geojsonHci   = gj;
    availDaysHci = Array.isArray(days) ? days : [];
    renderDaysHci();

    if (availDaysHci.length) selectDayHci(availDaysHci[0].day);
    else showErrorHci('В базе нет данных прогноза');
  } catch (e) {
    showErrorHci('Сетевая ошибка: ' + e.message);
  }
})();

function renderDaysHci() {
  const track = document.getElementById('track-hci');
  track.innerHTML = '';
  availDaysHci.forEach(d => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'day';
    btn.dataset.day = d.day;
    btn.innerHTML = `<span class="dn">+${d.day}</span><span class="dd">${d.date ? fmtShortHci(d.date) : ''}</span>`;
    btn.addEventListener('click', () => selectDayHci(d.day));
    track.appendChild(btn);
  });
}

function selectDayHci(day) {
  currentDayHci = day;
  document.querySelectorAll('#track-hci .day').forEach(b =>
    b.classList.toggle('active', +b.dataset.day === day)
  );
  loadMapHci(day);
}

async function loadMapHci(forecastDay) {
  let res;
  try {
    res = await fetch(`/api/gfs/hci?forecast_day=${forecastDay}`).then(r => r.json());
  } catch (e) {
    return showErrorHci('Сетевая ошибка: ' + e.message);
  }
  if (res.error) return showErrorHci(res.error);

  updateRunMetaHci(res);

  if (!res.data || !res.data.length) {
    return showErrorHci(`Нет данных для дня +${forecastDay}`);
  }
  drawMapHci(res.data, forecastDay);
}

function drawMapHci(data, forecastDay) {
  try {
    MapModule.drawChoropleth({
      containerId: 'map-hci',
      geojson: geojsonHci,
      data: data,
      day: forecastDay,
      valueKey: 'hci',
      labelFn: hciLabel,
      colorbarTitle: 'HCI'
    });
  } catch (e) {
    showErrorHci(e.message);
  }
}

function updateRunMetaHci(res) {
  const forecastDate = res.data?.[0]?.date_local;
  const cycle = String(res.cycle ?? 0).padStart(2, '0');
  document.getElementById('run-meta-hci').innerHTML =
    `Прогон <span class="v">№${res.run_id ?? '—'}</span>` +
    `<span class="dot">·</span>запуск <span class="v">${res.run_date ? fmtFullHci(res.run_date) : '—'}, ${cycle} UTC</span>` +
    `<span class="dot">·</span>прогноз на <span class="v">${forecastDate ? fmtFullHci(forecastDate) : '—'}</span> (+${res.forecast_day} дн.)`;
}

function showErrorHci(msg) {
  document.getElementById('map-hci').innerHTML =
    `<div class="placeholder error">${msg}</div>`;
}

function fmtShortHci(iso) {
  const p = iso.split('-');
  if (p.length < 3) return iso;
  return `${parseInt(p[2], 10)} ${RU_MONTHS_HCI[parseInt(p[1], 10) - 1]}`;
}

function fmtFullHci(iso) {
  const p = iso.split('-');
  if (p.length < 3) return iso;
  return `${parseInt(p[2], 10)} ${RU_MONTHS_HCI[parseInt(p[1], 10) - 1]} ${p[0]}`;
}

function hciLabel(hci) {
  if (hci == null) return 'нет данных';
  if (hci >= 90)   return 'идеально';
  if (hci >= 80)   return 'отлично';
  if (hci >= 70)   return 'очень хорошо';
  if (hci >= 60)   return 'хорошо';
  if (hci >= 50)   return 'приемлемо';
  if (hci >= 40)   return 'нежелательно';
  return 'неблагоприятно';
}