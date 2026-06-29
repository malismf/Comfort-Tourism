let currentIndex = 'tci';
        let currentMode = 'actual';
        let currentMapData = null;
        let currentDate = null;
        let sightsCategories = ['Все'];
        let selectedDistrict = null;
        let highlightedDistricts = [];
        let originalData = null;
        let currentRecommendations = [];
        let currentRecType = 'comfort';
        let currentSeason = 'winter';

        // Цвета маркеров для разных типов туризма
        const categoryColors = {
            'Природный': '#2ecc71',
            'Развлекательный': '#e67e22',
            'Лечебно-оздоровительный': '#1abc9c',
            'Культурно-познавательный': '#9b59b6',
            'Религиозный': '#f1c40f',
            'Активный': '#e74c3c',
            'Сельский': '#27ae60',
            'Событийный': '#3498db'
        };

        // Иконки для категорий
        const categoryIcons = {
            'Активный': '🏃',
            'Природный': '🌲',
            'Культурно-познавательный': '🏛️',
            'Развлекательный': '🎢',
            'Лечебно-оздоровительный': '💊',
            'Религиозный': '⛪',
            'Сельский': '🌾',
            'Событийный': '🎉',
            'Все': '📍'
        };

        function setRecType(type) {
            currentRecType = type;
            document.getElementById('rec_type_comfort').classList.toggle('active', type === 'comfort');
            document.getElementById('rec_type_seasonal').classList.toggle('active', type === 'seasonal');

            const seasonContainer = document.getElementById('season_select_container');
            if (type === 'seasonal') {
                seasonContainer.style.display = 'flex';
            } else {
                seasonContainer.style.display = 'none';
            }
            updateRecommendations();
        }

        function setSeason(season) {
            currentSeason = season;
            document.getElementById('season_winter').classList.toggle('active', season === 'winter');
            document.getElementById('season_summer').classList.toggle('active', season === 'summer');
            document.getElementById('season_year').classList.toggle('active', season === 'year');
            updateRecommendations();
        }

        function setIndex(idx) {
            currentIndex = idx;
            document.getElementById('btn-tci').classList.toggle('active', idx === 'tci');
            document.getElementById('btn-utci').classList.toggle('active', idx === 'utci');
            document.getElementById('btn-tourism').classList.toggle('active', idx === 'tourism');
            document.getElementById('btn-recommend').classList.toggle('active', idx === 'recommend');

            const climateControls = document.getElementById('climate-controls');
            const tourismControls = document.getElementById('tourism-controls');
            const modeButtons = document.getElementById('mode-buttons');
            const recommendationsPanel = document.getElementById('recommendations_panel');
            const mapTitle = document.getElementById('map-title');

            if (idx === 'tourism') {
                climateControls.style.display = 'none';
                tourismControls.style.display = 'flex';
                modeButtons.style.display = 'none';
                recommendationsPanel.style.display = 'none';
                mapTitle.innerHTML = 'Туристические объекты Иркутской области';
                selectedDistrict = null;
                updateTourismMap();
            } else if (idx === 'recommend') {
                climateControls.style.display = 'none';
                tourismControls.style.display = 'none';
                modeButtons.style.display = 'none';
                recommendationsPanel.style.display = 'block';
                mapTitle.innerHTML = 'Рекомендации: лучшие районы для отдыха';
                updateRecommendations();
            } else {
                climateControls.style.display = 'flex';
                tourismControls.style.display = 'none';
                modeButtons.style.display = 'flex';
                recommendationsPanel.style.display = 'none';
                mapTitle.innerHTML = 'Карта климатического индекса';
                updateMap();
            }
        }

        function setMode(mode) {
            if (currentIndex === 'recommend') return;

            currentMode = mode;
            document.getElementById('btn-actual').classList.toggle('active', mode === 'actual');
            document.getElementById('btn-period').classList.toggle('active', mode === 'period');
            document.getElementById('btn-avg').classList.toggle('active', mode === 'avg');

            const yearGroup = document.getElementById('year-group');
            const periodGroup = document.getElementById('period-group');

            if (mode === 'actual') {
                yearGroup.style.display = 'flex';
                periodGroup.style.display = 'none';
                yearGroup.style.opacity = '1';
                yearGroup.style.pointerEvents = 'auto';
            } else if (mode === 'period') {
                yearGroup.style.display = 'none';
                periodGroup.style.display = 'flex';
            } else if (mode === 'avg') {
                yearGroup.style.display = 'flex';
                periodGroup.style.display = 'none';
                yearGroup.style.opacity = '0.5';
                yearGroup.style.pointerEvents = 'none';
            }
            updateMap();
        }

        function getTciLevel(tci) {
            if (tci >= 80) return '🏆 Отлично для туризма';
            if (tci >= 70) return '😊 Очень хорошо';
            if (tci >= 60) return '👍 Хорошо';
            if (tci >= 50) return '😐 Удовлетворительно';
            if (tci >= 40) return '😕 Плохо';
            return '😫 Очень плохо для туризма';
        }

        function getUtciLevel(utci) {
            if (utci > 32) return '🥵 Экстремальная жара';
            if (utci > 26) return '🔥 Сильная жара';
            if (utci > 20) return '🌞 Умеренная жара';
            if (utci > 9) return '😊 Комфортно';
            if (utci > 0) return '🧥 Легкий холод';
            if (utci > -13) return '🧤 Умеренный холод';
            if (utci > -27) return '❄️ Сильный холод';
            return '🥶 Экстремальный холод';
        }

        function getTciIcon(tci) {
            if (tci >= 80) return '🏆';
            if (tci >= 70) return '😊';
            if (tci >= 60) return '👍';
            if (tci >= 50) return '😐';
            if (tci >= 40) return '😕';
            return '😫';
        }

        function getUtciIcon(utci) {
            if (utci > 32) return '🥵';
            if (utci > 26) return '🔥';
            if (utci > 20) return '🌞';
            if (utci > 9) return '😊';
            if (utci > 0) return '🧥';
            if (utci > -13) return '🧤';
            if (utci > -27) return '❄️';
            return '🥶';
        }

        function getTciColor(tci) {
            if (tci >= 80) return '#006837';
            if (tci >= 70) return '#44aa44';
            if (tci >= 60) return '#ffff00';
            if (tci >= 50) return '#ffcc00';
            if (tci >= 40) return '#ff9900';
            return '#ff0000';
        }

        function getUtciColor(utci) {
            if (utci > 32) return '#8B0000';
            if (utci > 26) return '#CD5C5C';
            if (utci > 20) return '#FF6347';
            if (utci > 9) return '#90EE90';
            if (utci > 0) return '#87CEEB';
            if (utci > -13) return '#6495ED';
            if (utci > -27) return '#4169E1';
            return '#00008B';
        }

        async function updateMap() {
            if (currentIndex === 'recommend') return;

            const month = String(document.getElementById('month').value).padStart(2, '0');
            let requestUrl = `/api/map_data?index=${currentIndex}&mode=${currentMode}&month=${month}`;

            if (currentMode === 'actual') {
                const year = document.getElementById('year').value;
                currentDate = `${year}-${month}`;
                requestUrl += `&date=${currentDate}`;
            } else if (currentMode === 'period') {
                const yearsBack = document.getElementById('period_years').value;
                requestUrl += `&years_back=${yearsBack}`;
                currentDate = `period-${yearsBack}-лет`;
            } else if (currentMode === 'avg') {
                requestUrl += `&month=${month}`;
                currentDate = `avg-${month}`;
            }

            try {
                const response = await fetch(requestUrl);
                const data = await response.json();
                currentMapData = data;
                originalData = data;

                if (data.figData && data.figData.data && data.figData.data.length > 0) {
                    Plotly.newPlot('map', data.figData.data, data.figData.layout, { responsive: true });

                    document.getElementById('map').on('plotly_click', function(clickData) {
                        if (clickData.points && clickData.points[0] && clickData.points[0].location) {
                            const moName = clickData.points[0].location;
                            showDistrictInfo(moName);
                        }
                    });
                }

                updateLegend();

            } catch(e) {
                console.error(e);
                document.getElementById('map').innerHTML = '<div style="text-align:center;padding:50px;">❌ Ошибка загрузки карты</div>';
            }
        }

        function updateLegend() {
            const legendDiv = document.getElementById('legend');
            if (currentIndex === 'tci') {
                legendDiv.innerHTML = `
                    <div class="legend-item"><div class="legend-color" style="background:#006837;"></div><span>≥80 Отлично</span></div>
                    <div class="legend-item"><div class="legend-color" style="background:#44aa44;"></div><span>70-79 Очень хорошо</span></div>
                    <div class="legend-item"><div class="legend-color" style="background:#ffff00;"></div><span>60-69 Хорошо</span></div>
                    <div class="legend-item"><div class="legend-color" style="background:#ffcc00;"></div><span>50-59 Удовлетворительно</span></div>
                    <div class="legend-item"><div class="legend-color" style="background:#ff9900;"></div><span>40-49 Плохо</span></div>
                    <div class="legend-item"><div class="legend-color" style="background:#ff0000;"></div><span>&lt;40 Очень плохо</span></div>
                `;
            } else if (currentIndex === 'utci') {
                legendDiv.innerHTML = `
                    <div class="legend-item"><div class="legend-color" style="background:#8B0000;"></div><span>&gt;32°C Экстремальная жара</span></div>
                    <div class="legend-item"><div class="legend-color" style="background:#CD5C5C;"></div><span>26-32°C Сильная жара</span></div>
                    <div class="legend-item"><div class="legend-color" style="background:#FF6347;"></div><span>20-26°C Умеренная жара</span></div>
                    <div class="legend-item"><div class="legend-color" style="background:#90EE90;"></div><span>9-20°C Комфортно</span></div>
                    <div class="legend-item"><div class="legend-color" style="background:#87CEEB;"></div><span>0-9°C Легкий холод</span></div>
                    <div class="legend-item"><div class="legend-color" style="background:#6495ED;"></div><span>-13-0°C Умеренный холод</span></div>
                    <div class="legend-item"><div class="legend-color" style="background:#4169E1;"></div><span>-27-(-13)°C Сильный холод</span></div>
                    <div class="legend-item"><div class="legend-color" style="background:#00008B;"></div><span>&lt;-27°C Экстремальный холод</span></div>
                `;
            }
        }

        function showDistrictInfo(moName) {
            const districtData = currentMapData?.districtsData[moName];
            if (!districtData) return;

            document.getElementById('info-panel').style.display = 'block';

            const tciInfo = getTciLevel(districtData.tci);
            const utciInfo = getUtciLevel(districtData.utci);
            const tciColor = getTciColor(districtData.tci);
            const utciColor = getUtciColor(districtData.utci);
            const tciIcon = getTciIcon(districtData.tci);
            const utciIcon = getUtciIcon(districtData.utci);

            let displayDate = currentDate;
            if (currentMode === 'avg') {
                const month = currentDate.split('-')[1];
                displayDate = `Среднее за ${month}-й месяц`;
            } else if (currentMode === 'period') {
                const years = document.getElementById('period_years').options[document.getElementById('period_years').selectedIndex].text;
                displayDate = years;
            }

            const detailButton = `<button class="detail-btn" onclick="showRasterDetail('${moName}', '${currentDate.replace('avg-', '').replace('period-', '')}', '${currentIndex}')">🔍 Детализация ${currentIndex === 'tci' ? 'TCI' : 'UTCI'} по ячейкам</button>`;

            const infoContent = document.getElementById('info-content');
            infoContent.innerHTML = `
                <div class="info-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                    <h4 style="color: white;">🏙️ РАЙОН</h4>
                    <div class="value" style="color: white; font-size: 24px;">${moName}</div>
                    <div class="unit" style="color: rgba(255,255,255,0.8);">${displayDate}</div>
                </div>
                <div class="info-card" style="border-top: 4px solid ${tciColor};">
                    <h4>🌿 TCI ${tciIcon}</h4>
                    <div class="value" style="color: ${tciColor};">${districtData.tci.toFixed(1)}</div>
                    <div class="unit">баллов (0-100)</div>
                    <div class="level">${tciInfo}</div>
                </div>
                <div class="info-card" style="border-top: 4px solid ${utciColor};">
                    <h4>🔥 UTCI ${utciIcon}</h4>
                    <div class="value" style="color: ${utciColor};">${districtData.utci.toFixed(1)}</div>
                    <div class="unit">°C</div>
                    <div class="level">${utciInfo}</div>
                </div>
                <div class="info-card">
                    ${detailButton}
                </div>
            `;

            loadGraph(moName);
            document.getElementById('info-panel').scrollIntoView({ behavior: 'smooth' });
        }

        async function loadGraph(moName) {
            const response = await fetch(`/api/district_history?mo=${encodeURIComponent(moName)}`);
            const data = await response.json();

            const trace1 = {
                x: data.map(d => d.date),
                y: data.map(d => d.tci),
                name: 'TCI',
                type: 'scatter',
                mode: 'lines+markers',
                line: { color: '#667eea', width: 2 },
                marker: { size: 4, color: '#764ba2' },
                yaxis: 'y'
            };

            const trace2 = {
                x: data.map(d => d.date),
                y: data.map(d => d.utci),
                name: 'UTCI',
                type: 'scatter',
                mode: 'lines+markers',
                line: { color: '#e74c3c', width: 2 },
                marker: { size: 4, color: '#c0392b' },
                yaxis: 'y2'
            };

            const layout = {
                title: `Динамика климатических индексов: ${moName}`,
                xaxis: { title: 'Дата', tickangle: -45, tickfont: { size: 10 } },
                yaxis: { title: 'TCI (баллы)', range: [0, 100], side: 'left', gridcolor: '#e0e0e0' },
                yaxis2: { title: 'UTCI (°C)', range: [-40, 50], side: 'right', overlaying: 'y', gridcolor: '#e0e0e0' },
                height: 400,
                hovermode: 'closest',
                margin: { l: 60, r: 60, t: 50, b: 80 },
                plot_bgcolor: '#fafafa',
                paper_bgcolor: 'white'
            };

            Plotly.newPlot('graph', [trace1, trace2], layout);
        }

        async function showRasterDetail(moName, date, index_type) {
            const modal = document.getElementById('rasterModal');
            modal.style.display = 'block';

            let displayDate = date;
            if (currentMode === 'avg') {
                displayDate = `среднее за ${date.split('-')[1]}-й месяц`;
            } else if (currentMode === 'period') {
                displayDate = document.getElementById('period_years').options[document.getElementById('period_years').selectedIndex].text;
            }

            const indexLabel = index_type === 'tci' ? 'TCI' : 'UTCI';
            const indexUnit = index_type === 'tci' ? 'баллы' : '°C';

            document.getElementById('rasterTitle').innerHTML = `📊 Детализация ${indexLabel} по ячейкам: ${moName} (${displayDate})`;

            try {
                const statsResp = await fetch(`/api/district_raster_stats?mo=${encodeURIComponent(moName)}&date=${date}&index=${index_type}&mode=${currentMode}&years_back=${document.getElementById('period_years')?.value || 5}`);
                const stats = await statsResp.json();

                if (stats && stats.count > 0) {
                    document.getElementById('rasterStats').innerHTML = `
                        <div class="info-card"><h4>📐 Ячеек</h4><div class="value">${stats.count}</div><div class="unit">внутри района</div></div>
                        <div class="info-card"><h4>📈 Максимум</h4><div class="value">${stats.max.toFixed(1)}</div><div class="unit">${indexUnit}</div></div>
                        <div class="info-card"><h4>📉 Минимум</h4><div class="value">${stats.min.toFixed(1)}</div><div class="unit">${indexUnit}</div></div>
                        <div class="info-card"><h4>📊 Среднее</h4><div class="value">${stats.mean.toFixed(1)}</div><div class="unit">${indexUnit}</div></div>
                    `;
                } else {
                    document.getElementById('rasterStats').innerHTML = '<div class="info-card" style="width:100%;">Нет данных для отображения</div>';
                }

                const pointsResp = await fetch(`/api/district_raster?mo=${encodeURIComponent(moName)}&date=${date}&index=${index_type}&mode=${currentMode}&years_back=${document.getElementById('period_years')?.value || 5}`);
                const points = await pointsResp.json();
                const boundaryResp = await fetch(`/api/geojson_boundary?mo=${encodeURIComponent(moName)}`);
                const boundaryGeoJson = await boundaryResp.json();

                if (points && points.length > 0) {
                    const lats = points.map(p => p.lat);
                    const lons = points.map(p => p.lon);
                    let values = index_type === 'tci' ? points.map(p => p.tci) : points.map(p => p.utci);
                    const centerLat = lats.reduce((a,b) => a+b, 0) / lats.length;
                    const centerLon = lons.reduce((a,b) => a+b, 0) / lons.length;

                    let colorscale, cmin, cmax;
                    if (index_type === 'tci') {
                        colorscale = 'RdYlGn';
                        cmin = 40;
                        cmax = 100;
                    } else {
                        colorscale = 'RdYlBu_r';
                        cmin = -50;
                        cmax = 50;
                    }

                    const pointTrace = {
                        type: 'scattermapbox',
                        lat: lats,
                        lon: lons,
                        mode: 'markers',
                        marker: {
                            size: 22,
                            color: values,
                            colorscale: colorscale,
                            cmin: cmin,
                            cmax: cmax,
                            colorbar: { title: index_type === 'tci' ? 'TCI' : 'UTCI (°C)' },
                            opacity: 0.85,
                            line: { color: 'black', width: 0.5 }
                        },
                        text: values.map(v => index_type === 'tci' ? `TCI: ${v.toFixed(1)}` : `UTCI: ${v.toFixed(1)}°C`),
                        hoverinfo: 'text',
                        name: `Ячейки ${indexLabel}`
                    };

                    const traces = [pointTrace];
                    if (boundaryGeoJson && boundaryGeoJson.features && boundaryGeoJson.features.length > 0) {
                        const coords = boundaryGeoJson.features[0].geometry.coordinates[0][0];
                        const boundaryTrace = {
                            type: 'scattermapbox',
                            lat: coords.map(c => c[1]),
                            lon: coords.map(c => c[0]),
                            mode: 'lines',
                            line: { color: '#e74c3c', width: 3 },
                            name: 'Граница района',
                            hoverinfo: 'skip'
                        };
                        traces.push(boundaryTrace);
                    }

                    const layout = {
                        mapbox: { style: 'carto-positron', zoom: 8.5, center: { lat: centerLat, lon: centerLon } },
                        height: 450,
                        margin: { l: 0, r: 0, t: 0, b: 0 },
                        legend: { x: 0, y: 1, bgcolor: 'rgba(255,255,255,0.8)' }
                    };
                    Plotly.newPlot('rasterMap', traces, layout, { responsive: true });

                    const histTrace = {
                        x: values,
                        type: 'histogram',
                        nbinsx: 15,
                        marker: { color: '#667eea', line: { color: 'white', width: 1 } },
                        xbins: { start: index_type === 'tci' ? 50 : -50, end: index_type === 'tci' ? 100 : 50, size: index_type === 'tci' ? 3 : 5 }
                    };
                    const histLayout = {
                        title: `Распределение ${indexLabel} по ячейкам`,
                        xaxis: { title: index_type === 'tci' ? 'TCI (баллы)' : 'UTCI (°C)' },
                        yaxis: { title: 'Количество ячеек' },
                        height: 350
                    };
                    Plotly.newPlot('rasterHistogram', [histTrace], histLayout);
                } else {
                    document.getElementById('rasterMap').innerHTML = '<div style="text-align:center;padding:50px;">❌ Нет данных для отображения</div>';
                    document.getElementById('rasterHistogram').innerHTML = '';
                }
            } catch (error) {
                console.error('Ошибка:', error);
            }
        }

        function closeRasterModal() {
            document.getElementById('rasterModal').style.display = 'none';
        }

        async function updateRecommendations() {
            const month = document.getElementById('recommend_month').value;
            const period = document.getElementById('recommend_period').value;

            const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
            document.getElementById('recommend_month_name').innerHTML = `(${monthNames[month-1]})`;

            let periodText = '';
            if (period === 'avg') {
                periodText = 'средние многолетние';
            } else {
                periodText = `последние ${period} лет`;
            }
            document.getElementById('recommend_period_text').innerHTML = `📊 ${periodText}`;

            try {
                let url;
                if (currentRecType === 'comfort') {
                    url = `/api/recommendations?month=${month.padStart(2,'0')}&period=${period}`;
                } else {
                    url = `/api/recommendations_seasonal?month=${month.padStart(2,'0')}&period=${period}&season_type=${currentSeason}`;
                }

                const response = await fetch(url);
                const recommendations = await response.json();
                currentRecommendations = recommendations;

                const listDiv = document.getElementById('recommendations_list');

                if (recommendations.length === 0) {
                    listDiv.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">Нет данных для отображения</div>';
                    return;
                }

                let html = '';
                for (let i = 0; i < recommendations.length; i++) {
                    const rec = recommendations[i];
                    const rankClass = i === 0 ? 'rank-1' : (i === 1 ? 'rank-2' : (i === 2 ? 'rank-3' : ''));

                    let typeIcon = '';
                    let typeName = '';
                    if (currentRecType === 'comfort') {
                        typeIcon = '🌡️';
                        typeName = 'Комфортный климат';
                    } else {
                        if (currentSeason === 'winter') {
                            typeIcon = '❄️';
                            typeName = 'Зимний отдых';
                        } else if (currentSeason === 'summer') {
                            typeIcon = '☀️';
                            typeName = 'Летний отдых';
                        } else {
                            typeIcon = '🏛️';
                            typeName = 'Круглогодичный';
                        }
                    }

                    html += `
                        <div class="rec-item ${rankClass}" onclick="selectRecommendationDistrict('${rec.mo}')">
                            <div class="rec-name">${i+1}. ${rec.mo}</div>
                            <div class="rec-rating">⭐ Рейтинг: ${rec.rating}</div>
                            <div class="rec-stats">
                                <span>🌿 TCI: ${rec.tci}</span>
                                <span>🔥 UTCI: ${rec.utci !== null ? rec.utci + '°C' : '—'}</span>
                            </div>
                            <div class="rec-stats">
                                <span>${typeIcon} ${typeName}</span>
                                <span>🏛️ Объектов: ${rec.sights_count}</span>
                            </div>
                        </div>
                    `;
                }
                listDiv.innerHTML = html;

                await highlightRecommendationDistricts(recommendations, month, period);

            } catch(e) {
                console.error('Ошибка загрузки рекомендаций:', e);
                document.getElementById('recommendations_list').innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">❌ Ошибка загрузки</div>';
            }
        }

        async function highlightRecommendationDistricts(recommendations, month, period) {
            const topDistricts = recommendations.map(r => r.mo);
            highlightedDistricts = topDistricts;

            let requestUrl;
            if (period === 'avg') {
                requestUrl = `/api/map_data?index=tci&mode=avg&month=${month.padStart(2,'0')}`;
            } else {
                requestUrl = `/api/map_data?index=tci&mode=period&month=${month.padStart(2,'0')}&years_back=${period}`;
            }

            try {
                const response = await fetch(requestUrl);
                const data = await response.json();
                currentMapData = data;

                if (data.figData && data.figData.data && data.figData.data.length > 0) {
                    const figData = JSON.parse(JSON.stringify(data.figData.data));

                    if (figData[0] && figData[0].marker) {
                        figData[0].marker.opacity = 0.35;
                    }

                    if (figData[0]) {
                        figData[0].hovertemplate = '<b>%{location}</b><br>TCI: %{z:.1f}<extra></extra>';
                    }

                    Plotly.newPlot('map', figData, data.figData.layout, { responsive: true });

                    const geojsonResponse = await fetch('/api/geojson');
                    const geojson = await geojsonResponse.json();

                    const highlightTraces = [];
                    for (const rec of recommendations) {
                        for (const feature of geojson.features) {
                            if (feature.properties.name === rec.mo) {
                                const coords = feature.geometry.coordinates[0][0];
                                highlightTraces.push({
                                    type: 'scattermapbox',
                                    lat: coords.map(c => c[1]),
                                    lon: coords.map(c => c[0]),
                                    mode: 'lines',
                                    line: { color: '#f1c40f', width: 4 },
                                    hoverinfo: 'skip',
                                    name: `⭐ ${rec.mo} (${rec.rating} баллов)`
                                });
                                break;
                            }
                        }
                    }

                    if (highlightTraces.length > 0) {
                        Plotly.addTraces('map', highlightTraces);
                    }

                    document.getElementById('map').on('plotly_click', function(clickData) {
                        if (clickData.points && clickData.points[0] && clickData.points[0].location) {
                            const moName = clickData.points[0].location;
                            if (topDistricts.includes(moName)) {
                                showDistrictInfo(moName);
                            } else {
                                const infoDiv = document.getElementById('selected-info');
                                const originalText = infoDiv.innerHTML;
                                infoDiv.innerHTML = `⚠️ Район "${moName}" не входит в ТОП-5. Нажмите на рекомендованный район для деталей.`;
                                infoDiv.style.background = '#fff3cd';
                                setTimeout(() => {
                                    infoDiv.innerHTML = originalText;
                                    infoDiv.style.background = '#f0f8ff';
                                }, 2000);
                            }
                        }
                    });

                    updateLegend();
                }
            } catch(e) {
                console.error('Ошибка подсветки:', e);
            }
        }

        async function selectRecommendationDistrict(moName) {
            const rec = currentRecommendations.find(r => r.mo === moName);
            if (rec) {
                const tempDistrictsData = {};
                tempDistrictsData[moName] = {
                    tci: rec.tci,
                    utci: rec.utci
                };

                const tempMapData = {
                    districtsData: tempDistrictsData,
                    figData: currentMapData?.figData
                };

                currentMapData = tempMapData;
                showDistrictInfo(moName);
            }
        }

        // === ФУНКЦИИ ДЛЯ ТРЕТЬЕЙ ВКЛАДКИ (ТУРИСТИЧЕСКИЕ ОБЪЕКТЫ) ===

        async function loadTourismCategories() {
            const response = await fetch('/api/tourism_categories');
            const categories = await response.json();
            sightsCategories = categories;
            const select = document.getElementById('sights_category');
            select.innerHTML = '';
            for (const cat of categories) {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat;
                select.appendChild(option);
            }
        }

        function resetDistrictSelection() {
            selectedDistrict = null;
            updateTourismMap();
            document.getElementById('info-panel').style.display = 'none';
        }

        async function updateTourismMap() {
            const month = String(document.getElementById('tourism_month').value).padStart(2, '0');
            const category = document.getElementById('sights_category').value;

            if (selectedDistrict) {
                await selectDistrictForSights(selectedDistrict);
                return;
            }

            try {
                const response = await fetch(`/api/tourism_sights_all?category=${encodeURIComponent(category)}`);
                const sights = await response.json();

                const geoResponse = await fetch('/api/geojson');
                const geojson = await geoResponse.json();

                const boundaryTrace = {
                    type: 'scattermapbox',
                    lat: [],
                    lon: [],
                    mode: 'lines',
                    line: { color: '#333', width: 1 },
                    hoverinfo: 'skip'
                };

                for (const feature of geojson.features) {
                    const coords = feature.geometry.coordinates[0][0];
                    boundaryTrace.lat.push(...coords.map(c => c[1]));
                    boundaryTrace.lon.push(...coords.map(c => c[0]));
                    boundaryTrace.lat.push(null);
                    boundaryTrace.lon.push(null);
                }

                if (category === 'Все') {
                    const sightsByCategory = {};
                    for (const sight of sights) {
                        const cat = sight.category || 'Другое';
                        if (!sightsByCategory[cat]) sightsByCategory[cat] = [];
                        sightsByCategory[cat].push(sight);
                    }

                    const traces = [boundaryTrace];
                    for (const [cat, catSights] of Object.entries(sightsByCategory)) {
                        const color = categoryColors[cat] || '#95a5a6';
                        traces.push({
                            type: 'scattermapbox',
                            lat: catSights.map(s => s.lat),
                            lon: catSights.map(s => s.lon),
                            mode: 'markers',
                            marker: { size: 10, color: color, opacity: 0.85 },
                            text: catSights.map(s => `<b>${s.name}</b><br>${s.category || ''}`),
                            hoverinfo: 'text',
                            name: cat
                        });
                    }

                    const layout = {
                        mapbox: { style: 'carto-positron', zoom: 5.3, center: { lat: 57.0, lon: 105.0 } },
                        height: 600,
                        margin: { l: 0, r: 0, t: 0, b: 0 }
                    };

                    Plotly.newPlot('map', traces, layout, { responsive: true });

                    document.getElementById('legend').innerHTML = `
                        <div class="legend-item"><div style="width:30px;height:20px;background:#2ecc71;"></div><span>Природный</span></div>
                        <div class="legend-item"><div style="width:30px;height:20px;background:#e67e22;"></div><span>Развлекательный</span></div>
                        <div class="legend-item"><div style="width:30px;height:20px;background:#1abc9c;"></div><span>Лечебно-оздоровительный</span></div>
                        <div class="legend-item"><div style="width:30px;height:20px;background:#9b59b6;"></div><span>Культурно-познавательный</span></div>
                        <div class="legend-item"><div style="width:30px;height:20px;background:#f1c40f;"></div><span>Религиозный</span></div>
                        <div class="legend-item"><div style="width:30px;height:20px;background:#e74c3c;"></div><span>Активный</span></div>
                        <div class="legend-item"><div style="width:30px;height:20px;background:#27ae60;"></div><span>Сельский</span></div>
                        <div class="legend-item"><div style="width:30px;height:20px;background:#3498db;"></div><span>Событийный</span></div>
                        <div class="legend-item"><button class="detail-btn" style="padding:5px 10px; margin-top:5px;" onclick="resetDistrictSelection()">🗺️ Сбросить выбор района</button></div>
                    `;

                } else {
                    const markerColor = categoryColors[category] || '#e74c3c';
                    const markersTrace = {
                        type: 'scattermapbox',
                        lat: sights.map(s => s.lat),
                        lon: sights.map(s => s.lon),
                        mode: 'markers',
                        marker: { size: 10, color: markerColor, opacity: 0.85 },
                        text: sights.map(s => `<b>${s.name}</b><br>${s.category || ''}`),
                        hoverinfo: 'text',
                        name: category
                    };

                    const layout = {
                        mapbox: { style: 'carto-positron', zoom: 5.3, center: { lat: 57.0, lon: 105.0 } },
                        height: 600,
                        margin: { l: 0, r: 0, t: 0, b: 0 }
                    };

                    Plotly.newPlot('map', [boundaryTrace, markersTrace], layout, { responsive: true });

                    document.getElementById('legend').innerHTML = `
                        <div class="legend-item"><div style="width:30px;height:20px;background:${markerColor};border-radius:3px;"></div><span>${category} (${sights.length} объектов)</span></div>
                        <div class="legend-item"><button class="detail-btn" style="padding:5px 10px; margin-top:5px;" onclick="resetDistrictSelection()">🗺️ Сбросить выбор района</button></div>
                    `;
                }

            } catch(e) {
                console.error(e);
                document.getElementById('map').innerHTML = '<div style="text-align:center;padding:50px;">❌ Ошибка загрузки карты</div>';
            }
        }

        async function showDistrictsAnalysis() {
            const month = String(document.getElementById('tourism_month').value).padStart(2, '0');
            const response = await fetch(`/api/tourism_quadrant?month=${month}`);
            const quadrants = await response.json();

            const groups = {
                "Эталонная территория": [],
                "Спящий гигант": [],
                "Устойчивый туризм": [],
                "Сложная территория": []
            };

            for (const [mo, data] of Object.entries(quadrants)) {
                if (groups[data.quadrant]) {
                    groups[data.quadrant].push({mo, ...data});
                }
            }

            let html = '<div style="display:flex; flex-wrap:wrap; gap:20px; justify-content:center;">';

            for (const [quadrant, items] of Object.entries(groups)) {
                if (items.length === 0) continue;

                const color = items[0].color;
                const icon = items[0].icon;

                html += `
                    <div style="flex:1; min-width:250px; border-left: 4px solid ${color}; padding:10px; background:#f8f9fa; border-radius:8px;">
                        <h4 style="color:${color};">${icon} ${quadrant}</h4>
                        <div style="max-height:300px; overflow-y:auto;">
                `;

                for (const item of items) {
                    html += `
                        <div onclick="selectDistrictForSights('${item.mo}')"
                             style="padding:8px; margin:5px; background:white; border-radius:5px; cursor:pointer; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                            <strong>${item.mo}</strong><br>
                            <span style="font-size:12px;">TCI: ${item.tci} | Объектов: ${item.sights_count}</span>
                        </div>
                    `;
                }

                html += `</div></div>`;
            }

            html += `</div>`;

            const modal = document.getElementById('districtsModal');
            document.getElementById('districtsContent').innerHTML = html;
            modal.style.display = 'block';
        }

        async function selectDistrictForSights(moName) {
            selectedDistrict = moName;
            closeDistrictsModal();

            const category = document.getElementById('sights_category').value;
            const month = String(document.getElementById('tourism_month').value).padStart(2, '0');
            const year = 2024;
            const date = `${year}-${month}`;

            const sightsResponse = await fetch(`/api/tourism_sights_by_district?mo=${encodeURIComponent(moName)}&category=${encodeURIComponent(category)}`);
            const sights = await sightsResponse.json();

            let tciValue = null;
            let utciValue = null;

            try {
                const climateResponse = await fetch(`/api/map_data?date=${date}&index=tci&mode=actual`);
                const climateData = await climateResponse.json();
                if (climateData.districtsData && climateData.districtsData[moName]) {
                    tciValue = climateData.districtsData[moName].tci;
                    utciValue = climateData.districtsData[moName].utci;
                }
            } catch(e) {
                console.error("Ошибка загрузки климатических данных:", e);
            }

            const geoResponse = await fetch('/api/geojson_boundary?mo=' + encodeURIComponent(moName));
            const boundaryGeoJson = await geoResponse.json();

            const allGeoResponse = await fetch('/api/geojson');
            const allGeojson = await allGeoResponse.json();

            const allBoundariesTrace = {
                type: 'scattermapbox',
                lat: [],
                lon: [],
                mode: 'lines',
                line: { color: '#ccc', width: 0.5 },
                hoverinfo: 'skip'
            };

            for (const feature of allGeojson.features) {
                const coords = feature.geometry.coordinates[0][0];
                allBoundariesTrace.lat.push(...coords.map(c => c[1]));
                allBoundariesTrace.lon.push(...coords.map(c => c[0]));
                allBoundariesTrace.lat.push(null);
                allBoundariesTrace.lon.push(null);
            }

            let selectedBoundaryTrace = null;
            if (boundaryGeoJson.features && boundaryGeoJson.features.length > 0) {
                const coords = boundaryGeoJson.features[0].geometry.coordinates[0][0];
                selectedBoundaryTrace = {
                    type: 'scattermapbox',
                    lat: coords.map(c => c[1]),
                    lon: coords.map(c => c[0]),
                    mode: 'lines',
                    line: { color: '#e74c3c', width: 3 },
                    hoverinfo: 'skip'
                };
            }

            if (category === 'Все') {
                const sightsByCategory = {};
                for (const sight of sights) {
                    const cat = sight.category || 'Другое';
                    if (!sightsByCategory[cat]) sightsByCategory[cat] = [];
                    sightsByCategory[cat].push(sight);
                }

                const traces = [allBoundariesTrace];
                if (selectedBoundaryTrace) traces.push(selectedBoundaryTrace);
                for (const [cat, catSights] of Object.entries(sightsByCategory)) {
                    const color = categoryColors[cat] || '#95a5a6';
                    traces.push({
                        type: 'scattermapbox',
                        lat: catSights.map(s => s.lat),
                        lon: catSights.map(s => s.lon),
                        mode: 'markers',
                        marker: { size: 12, color: color, opacity: 0.9 },
                        text: catSights.map(s => `<b>${s.name}</b><br>${s.category || ''}`),
                        hoverinfo: 'text',
                        name: cat
                    });
                }

                const centerLat = sights.length ? sights.reduce((a,b) => a+b.lat, 0)/sights.length : 57.0;
                const centerLon = sights.length ? sights.reduce((a,b) => a+b.lon, 0)/sights.length : 105.0;

                const layout = {
                    mapbox: { style: 'carto-positron', zoom: 8, center: { lat: centerLat, lon: centerLon } },
                    height: 600,
                    margin: { l: 0, r: 0, t: 0, b: 0 }
                };

                Plotly.newPlot('map', traces, layout, { responsive: true });

                document.getElementById('legend').innerHTML = `
                    <div class="legend-item"><div style="width:30px;height:20px;background:#2ecc71;"></div><span>Природный</span></div>
                    <div class="legend-item"><div style="width:30px;height:20px;background:#e67e22;"></div><span>Развлекательный</span></div>
                    <div class="legend-item"><div style="width:30px;height:20px;background:#1abc9c;"></div><span>Лечебно-оздоровительный</span></div>
                    <div class="legend-item"><div style="width:30px;height:20px;background:#9b59b6;"></div><span>Культурно-познавательный</span></div>
                    <div class="legend-item"><div style="width:30px;height:20px;background:#f1c40f;"></div><span>Религиозный</span></div>
                    <div class="legend-item"><div style="width:30px;height:20px;background:#e74c3c;"></div><span>Активный</span></div>
                    <div class="legend-item"><div style="width:30px;height:20px;background:#27ae60;"></div><span>Сельский</span></div>
                    <div class="legend-item"><div style="width:30px;height:20px;background:#3498db;"></div><span>Событийный</span></div>
                    <div class="legend-item"><div style="width:30px;height:3px;background:#e74c3c;"></div><span>Выбранный район: ${moName}</span></div>
                    <div class="legend-item"><button class="detail-btn" style="padding:5px 10px; margin-top:5px;" onclick="resetDistrictSelection()">🗺️ Показать всю область</button></div>
                `;

            } else {
                const markerColor = categoryColors[category] || '#e74c3c';
                const markersTrace = {
                    type: 'scattermapbox',
                    lat: sights.map(s => s.lat),
                    lon: sights.map(s => s.lon),
                    mode: 'markers',
                    marker: { size: 12, color: markerColor, opacity: 0.9 },
                    text: sights.map(s => `<b>${s.name}</b><br>${s.category || ''}`),
                    hoverinfo: 'text',
                    name: `${moName} (${sights.length} объектов)`
                };

                const traces = [allBoundariesTrace];
                if (selectedBoundaryTrace) traces.push(selectedBoundaryTrace);
                traces.push(markersTrace);

                const centerLat = sights.length ? sights.reduce((a,b) => a+b.lat, 0)/sights.length : 57.0;
                const centerLon = sights.length ? sights.reduce((a,b) => a+b.lon, 0)/sights.length : 105.0;

                const layout = {
                    mapbox: { style: 'carto-positron', zoom: 8, center: { lat: centerLat, lon: centerLon } },
                    height: 600,
                    margin: { l: 0, r: 0, t: 0, b: 0 }
                };

                Plotly.newPlot('map', traces, layout, { responsive: true });

                document.getElementById('legend').innerHTML = `
                    <div class="legend-item"><div style="width:30px;height:20px;background:${markerColor};"></div><span>${category} (${sights.length} объектов)</span></div>
                    <div class="legend-item"><div style="width:30px;height:3px;background:#e74c3c;"></div><span>Выбранный район: ${moName}</span></div>
                    <div class="legend-item"><button class="detail-btn" style="padding:5px 10px; margin-top:5px;" onclick="resetDistrictSelection()">🗺️ Показать всю область</button></div>
                `;
            }

            document.getElementById('info-panel').style.display = 'block';

            const tciIconE = getTciIcon(tciValue || 0);
            const utciIconE = getUtciIcon(utciValue || 0);
            const tciColorC = getTciColor(tciValue || 0);
            const utciColorC = getUtciColor(utciValue || 0);
            const tciLevelText = getTciLevel(tciValue || 0);
            const utciLevelText = getUtciLevel(utciValue || 0);
            const categoryIcon = categoryIcons[category] || '📍';

            let infoHtml = `
                <div class="info-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                    <h4 style="color: white;">🏙️ РАЙОН</h4>
                    <div class="value" style="color: white; font-size: 28px;">${moName}</div>
                </div>

                <div class="info-card" style="border-top: 4px solid ${tciColorC};">
                    <h4>🌿 TCI ${tciIconE}</h4>
                    <div class="value" style="color: ${tciColorC};">${tciValue !== null ? tciValue.toFixed(1) : '—'}</div>
                    <div class="unit">баллов (0-100)</div>
                    <div class="level">${tciValue !== null ? tciLevelText : 'Нет данных'}</div>
                </div>

                <div class="info-card" style="border-top: 4px solid ${utciColorC};">
                    <h4>🔥 UTCI ${utciIconE}</h4>
                    <div class="value" style="color: ${utciColorC};">${utciValue !== null ? utciValue.toFixed(1) : '—'}</div>
                    <div class="unit">°C</div>
                    <div class="level">${utciValue !== null ? utciLevelText : 'Нет данных'}</div>
                </div>

                <div class="info-card">
                    <h4>${categoryIcon} ${category}</h4>
                    <div class="value">${sights.length}</div>
                    <div class="unit">объектов туризма</div>
                </div>
            `;

            if (sights.length > 0) {
                infoHtml += `
                    <div class="info-card" style="width:100%; max-width: 100%;">
                        <h4>📋 СПИСОК ОБЪЕКТОВ</h4>
                        <div class="sights-list">
                `;
                for (const sight of sights.slice(0, 20)) {
                    const catIcon = categoryIcons[sight.category] || '📍';
                    infoHtml += `
                        <div class="sight-item">
                            <span><strong>${sight.name}</strong></span>
                            <span style="font-size: 11px; color: #888;">${catIcon} ${sight.category || ''}</span>
                        </div>
                    `;
                }
                if (sights.length > 20) {
                    infoHtml += `<div class="sight-item" style="color:#888;">... и ещё ${sights.length - 20} объектов</div>`;
                }
                infoHtml += `
                        </div>
                    </div>
                `;
            }

            document.getElementById('info-content').innerHTML = infoHtml;
            document.getElementById('info-panel').scrollIntoView({ behavior: 'smooth' });
        }

        function closeDistrictsModal() {
            document.getElementById('districtsModal').style.display = 'none';
        }

        // Инициализация
        window.onload = function() {
            setMode('actual');
            setIndex('tci');
            setRecType('comfort');
            setSeason('winter');
            loadTourismCategories();
            document.getElementById('year').addEventListener('change', updateMap);
            document.getElementById('month').addEventListener('change', updateMap);
            document.getElementById('period_years').addEventListener('change', updateMap);
            document.getElementById('tourism_month').addEventListener('change', function() {
                selectedDistrict = null;
                updateTourismMap();
            });
            document.getElementById('sights_category').addEventListener('change', function() {
                selectedDistrict = null;
                updateTourismMap();
            });
            updateMap();
        };
