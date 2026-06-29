let currentDataSource = 'forecast.html';

const CONTAINERS = {
    'forecast.html':     { panel: 'module-forecast',     button: 'src-gfs', plotly: 'gfs-map' },
    'forecast_hci.html': { panel: 'module-forecast-hci', button: 'src-hci', plotly: 'map-hci' },
    'reanalysis.html':   { panel: 'module-reanalysis',   button: 'src-era5' },
};

// рендерится ли график: есть, инициализирован, видим (offsetParent), ненулевой размер
function isRenderable(el) {
    return el && el._fullLayout &&
           el.offsetParent !== null &&
           el.offsetWidth > 0 && el.offsetHeight > 0;
}

function resizePlot(id) {
    if (!id) return;
    const el = document.getElementById(id);
    if (isRenderable(el)) Plotly.Plots.resize(el);
}

function setDataSource(file) {
    currentDataSource = file;
    let activePlotlyId = null;

    for (const [name, m] of Object.entries(CONTAINERS)) {
        const isActive = (name === file);

        const panel = document.getElementById(m.panel);
        if (panel) panel.style.display = isActive ? '' : 'none';

        const button = document.getElementById(m.button);
        if (button) button.classList.toggle('active', isActive);

        if (isActive && m.plotly) activePlotlyId = m.plotly;
    }

    // ресайз только после reflow показанной панели
    if (activePlotlyId) {
        requestAnimationFrame(() =>
            requestAnimationFrame(() => resizePlot(activePlotlyId))
        );
    }
}

document.querySelectorAll('.sidebar-menu .sidebar-btn[data-source]').forEach(btn => {
    btn.addEventListener('click', () => setDataSource(btn.dataset.source));
});

// дебаунс; трогаем ТОЛЬКО текущий видимый график
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        const cfg = CONTAINERS[currentDataSource];
        if (cfg) resizePlot(cfg.plotly);
    }, 150);
});