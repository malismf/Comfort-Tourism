
(function (global) {
  const RU_MONTHS = [
    'янв','фев','мар','апр','май','июн',
    'июл','авг','сен','окт','ноя','дек'
  ];

  function fmtFull(iso) {
    if (!iso) return '—';
    const p = iso.split('-');
    if (p.length < 3) return iso;
    return `${parseInt(p[2], 10)} ${RU_MONTHS[parseInt(p[1], 10) - 1]} ${p[0]}`;
  }

  /**
   * Обновляет карточку метаданных прогона.
   * @param {string} containerId  — id DOM-элемента (напр. 'run-meta' или 'run-meta-hci')
   * @param {object} res          — объект ответа API: { run_id, run_date, cycle, forecast_day, data }
   */
  function updateRunMeta(containerId, res) {
    const el = document.getElementById(containerId);
    if (!el) return;

    const forecastDate = res.data?.[0]?.date_local;
    const cycle = String(res.cycle ?? 0).padStart(2, '0');

    el.innerHTML =
      `Прогон <span class="v">№${res.run_id ?? '—'}</span>` +
      `<span class="dot">·</span>запуск <span class="v">${fmtFull(res.run_date)}, ${cycle} UTC</span>` +
      `<span class="dot">·</span>прогноз на <span class="v">${fmtFull(forecastDate)}</span> (+${res.forecast_day} дн.)`;
  }

  /* Экспорт в глобальное пространство */
  global.RunMeta = { updateRunMeta };
})(window);
