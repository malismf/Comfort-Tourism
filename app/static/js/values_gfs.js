(function () {
  const RU_MONTHS = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];

  function fmtShort(iso) {
    if (!iso) return '';
    const p = iso.split('-');
    if (p.length < 3) return iso;
    return `${parseInt(p[2], 10)} ${RU_MONTHS[parseInt(p[1], 10) - 1]}`;
  }

  function fmt(x) {
    return (x === null || x === undefined) ? '—' : (+x).toFixed(1);
  }

  //  Цветовые шкалы — отдельный массив на каждый сабиндекс 
  // [min, color]
  const COLORS = {
    tci: {
      cid: [[5, '#4caf50'], [4, '#8bc34a'], [3, '#ffeb3b'], [2, '#ff9800'], [1, '#ff5722'], [0, '#f44336'], [-1, '#e53935'], [-2, '#d32f2f'], [-3, '#b71c1c']],
      cia: [[5, '#4caf50'], [4, '#8bc34a'], [3, '#ffeb3b'], [2, '#ff9800'], [1, '#ff5722'], [0, '#f44336'], [-1, '#e53935'], [-2, '#d32f2f'], [-3, '#b71c1c']],
      r:   [[5, '#4caf50'], [4, '#8bc34a'], [3, '#ffeb3b'], [2, '#ff9800'], [1, '#ff5722'], [0, '#f44336'], [-1, '#e53935']],
      s:   [[5, '#4caf50'], [4, '#8bc34a'], [3, '#ffeb3b'], [2, '#ff9800'], [1, '#ff5722'], [0, '#f44336'], [-1, '#e53935']],
      w:   [[5, '#4caf50'], [4, '#8bc34a'], [3, '#ffeb3b'], [2, '#ff9800'], [1, '#ff5722'], [0, '#f44336'], [-1, '#e53935']],
      index: [[80, '#006837'], [70, '#44aa44'], [60, '#ffff00'], [50, '#ffcc00'], [40, '#ff9900'], [0, '#ff0000']],
    },
    hci: {
      et: [[40, '#f44336'], [36, '#ff5722'], [34, '#ff9800'], [32, '#ffeb3b'], [28, '#8bc34a'], [19, '#4caf50'], [14, '#8bc34a'], [10, '#ffeb3b'], [-1, '#ff9800'], [-Infinity, '#ff5722']],
      tc: [[8, '#4caf50'], [6, '#8bc34a'], [5, '#ffeb3b'], [3, '#ff9800'], [1, '#ff5722'], [0, '#f44336']],
      r:  [[10, '#4caf50'], [9, '#8bc34a'], [8, '#ffeb3b'], [5, '#ff9800'], [2, '#ff5722'], [0, '#f44336'], [-1, '#e53935']],
      w:  [[10, '#4caf50'], [9, '#8bc34a'], [8, '#ffeb3b'], [6, '#ff9800'], [3, '#ff5722'], [0, '#f44336'], [-10, '#b71c1c']],
      a:  [[9, '#4caf50'], [7, '#8bc34a'], [6, '#ffeb3b'], [4, '#ff9800'], [2, '#ff5722']],
      index: [[80, '#006837'], [70, '#44aa44'], [60, '#ffff00'], [50, '#ffcc00'], [40, '#ff9900'], [0, '#ff0000']],
    },
  };

  const NEUTRAL = '#cbd5e1';

  function colorFor(value, scale) {
    if (value === null || value === undefined || !scale || !scale.length) return NEUTRAL;
    for (const [min, c] of scale) {
      if (value >= min) return c;
    }
    return NEUTRAL;
  }

  const TCI_FIELDS = [['cid', 'CID'], ['cia', 'CIA'], ['r', 'R'], ['s', 'S'], ['w', 'W']];
  const HCI_FIELDS = [['et', 'ET'], ['tc', 'TC'], ['a', 'A'], ['r', 'R'], ['w', 'W']];

  function buildCells(parts, fields, indexVal, group) {
    return fields.map(([key, label]) => {
      const value = parts ? parts[key] : null;
      const color = colorFor(value, COLORS[group][key]);
      return `
        <div class="value-cell">
          <span class="vc-label">${label}</span>
          <span class="vc-value">${fmt(value)}</span>
          <span class="vc-dot" style="background:${color}"></span>
        </div>`;
    }).join('') + `
      <div class="value-cell value-index">
        <span class="vc-label">${group.toUpperCase()}</span>
        <span class="vc-value">${fmt(indexVal)}</span>
        <span class="vc-dot" style="background:${colorFor(indexVal, COLORS[group].index)}"></span>
      </div>`;
  }

  function render(el, moName, entry, isHci) {
    const group  = isHci ? 'hci' : 'tci';
    const fields = isHci ? HCI_FIELDS : TCI_FIELDS;
    const parts  = isHci ? entry.hci_parts : entry.tci_parts;
    const indexVal = isHci ? entry.hci : entry.tci;

    el.innerHTML = `
      <div class="values-head">
        <span class="values-label">${isHci ? 'HCI' : 'TCI'}</span>
        <span class="values-mo">${moName}</span>
        <span class="values-day">+${entry.forecast_day} · ${fmtShort(entry.date_local)}</span>
      </div>
      <div class="values-grid">
        ${buildCells(parts, fields, indexVal, group)}
      </div>`;
  }

  async function selectMoValues(moName, containerId, day) {
    containerId = containerId || 'values-gfs';
    const el = document.getElementById(containerId);
    if (!el) return;

    el.innerHTML = '<div class="values-loading"><span class="values-spin"></span>Загрузка…</div>';

    let res;
    try {
      res = await fetch(`/api/gfs/series?mo=${encodeURIComponent(moName)}`).then(r => r.json());
    } catch (e) {
      el.innerHTML = `<div class="values-error">Сетевая ошибка: ${e.message}</div>`;
      return;
    }
    if (res.error) {
      el.innerHTML = `<div class="values-error">${res.error}</div>`;
      return;
    }
    if (!res.series || !res.series.length) {
      el.innerHTML = `<div class="values-empty">Нет данных для «${moName}»</div>`;
      return;
    }

    const entry = res.series.find(s => s.forecast_day === day) ?? res.series[0];
    const isHci = containerId.indexOf('hci') !== -1;
    render(el, res.name || moName, entry, isHci);
  }

  window.selectMoValues = selectMoValues;
})();