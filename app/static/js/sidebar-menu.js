let currentDataSource = 'forecast.html';

const CONTAINERS = {
    'forecast.html':     { panel: 'module-forecast',     button: 'src-gfs'},
    'forecast_hci.html': { panel: 'module-forecast-hci', button: 'src-hci' },
    'reanalysis.html':   { panel: 'module-reanalysis',   button: 'src-era5' },
};

function setDataSource(file) {
    currentDataSource = file;

    for (const [name, m] of Object.entries(CONTAINERS)) {
        const isActive = (name === file);

        const panel = document.getElementById(m.panel);
        if (panel) panel.style.display = isActive ? '' : 'none';

        const button = document.getElementById(m.button);
        if (button) button.classList.toggle('active', isActive);

        if (isActive && panel) resizePlots(panel);
    }
}

document.querySelectorAll('.sidebar-menu .sidebar-btn[data-source]').forEach(btn => {
    btn.addEventListener('click', () => setDataSource(btn.dataset.source));
});

function resizePlots(container) {
    if (typeof Plotly === 'undefined') return;
    container.querySelectorAll('.js-plotly-plot').forEach(function (p) {
        try { Plotly.Plots.resize(p); } catch (e) {}
    });
}
