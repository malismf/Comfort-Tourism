import { selectMo } from "./linear_gfs.js";

const colors = [
  [0.0, '#ff0000'],   // <40   Очень плохо / Неблагоприятно
  [0.5, '#ff9900'],  // 40-49 Плохо / Нежелательно
  [0.6, '#ffcc00'],  // 50-59 Удовлетворительно / Приемлемо
  [0.7, '#ffff00'],  // 60-69 Хорошо
  [0.8, '#44aa44'],  // 70-79 Очень хорошо
  [1.0, '#006837'],  // ≥80   Отлично
];

export const MapModule = {
  drawChoropleth: function(options) {
    const {
      containerId,
      geojson,
      data,
      valueKey,
      labelFn,
      colorscale = colors,
      zmin = 0,
      zmax = 100,
      colorbarTitle = ''
    } = options;

    const el = document.getElementById(containerId);
    if (!el) throw new Error('Контейнер не найден');

      
    if (!el.classList.contains('js-plotly-plot')) {
      el.innerHTML = '';
    }

    const trace = {
      type: 'choroplethmapbox',
      geojson: geojson,
      featureidkey: 'properties.name',
      locations: data.map(d => d.name),
      z: data.map(d => d[valueKey] ?? null),
      customdata: data.map(d => [d.name, d[valueKey], d.date_local, labelFn(d[valueKey] ?? null)]),
      colorscale: colorscale,
      zmin: zmin,
      zmax: zmax,
      marker: { opacity: 0.85, line: { width: 0.6, color: 'rgba(0,0,0,0.25)' } },
      colorbar: {
        title: { text: colorbarTitle, font: { color: '#52525b', size: 12 } },
        tickfont: { color: '#52525b', size: 11 },
        thickness: 12,
        len: 0.7,
        outlinewidth: 0,
        ticks: 'outside',
        ticklen: 3,
      },
      hovertemplate:
        '<b>%{customdata[0]}</b><br>' +
        colorbarTitle + ': %{customdata[1]:.1f} — %{customdata[3]}<br>' +
        'Дата: %{customdata[2]}<extra></extra>',
    };

    const layout = {
      autosize: true, // Оставляем для адаптивной ширины
      mapbox: { style: 'carto-positron', zoom: 5.0, center: { lat: 57.0, lon: 105.0 } },
      height: 560,
      margin: { r: 0, t: 0, l: 0, b: 0 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      font: { family: '-apple-system, system-ui, sans-serif' },
    };

    try {
      // Убрали responsive: true, чтобы Mapbox не зависал в скрытой вкладке (display: none)
      Plotly.react(containerId, [trace], layout, { displayModeBar: false });
      this.initResizeObserver(containerId);

      el.on('plotly_click', function(clickData) {
      if (clickData.points && clickData.points[0] && clickData.points[0].location) {
          const moName = clickData.points[0].location;
          if (containerId == 'map-hci') {
            selectMo(moName, 'linear-hci');
          }
          else {
            selectMo(moName, 'linear-gfs');
          }
        }
      });

    } catch (e) {
      throw new Error('Ошибка отрисовки Plotly: ' + e.message);
    }
  },

  initResizeObserver: function(containerId) {
    const el = document.getElementById(containerId);
    if (!el || el.dataset.resizeObserved) return;
    
    el.dataset.resizeObserved = "true";

    let resizeTimer;
    const resize = () => {
      if (typeof Plotly === "undefined") return;
      if (!el.classList.contains("js-plotly-plot")) return;
      // Если у блока нулевая ширина (он скрыт), ресайз вызовет ошибки Mapbox - игнорируем
      if (!(el.offsetWidth || el.offsetHeight)) return;
      
      try { Plotly.Plots.resize(el); } catch (e) {}
    };

    const onResize = () => { 
      clearTimeout(resizeTimer); 
      // Уменьшил таймаут до 100мс для более быстрого развертывания карты при переключении
      resizeTimer = setTimeout(resize, 100); 
    };

    // Вешаем обсервер на родительский .module (чтобы ловить смену display: none на display: block)
    const box = el.closest(".module") || el.closest(".map-wrap") || el;
    if ("ResizeObserver" in window) {
      new ResizeObserver(onResize).observe(box);
    }
    
    window.addEventListener("resize", onResize);
  }
};