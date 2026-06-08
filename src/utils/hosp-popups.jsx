export const buildHospitalPopup = (d) => {
    const getOccColor = (cat) => {
      const map = { over: '#dc2626', vhigh: '#ea580c', high: '#f59e0b', norm: '#16a34a', low: '#6b7280', vlow: '#9ca3af' };
      return map[cat] || '#6b7280';
    };

    const occColor = getOccColor(d.occ_cat);

    const profilesHtml = d.bed_profiles?.map((p) => {
      const pct = d.total_beds > 0 ? Math.round((p.beds / d.total_beds) * 100) : 0;
      return `
        <div class="ml-row" style="margin-bottom: 2px;">
          <span>${p.profile_name}</span>
          <b>${p.beds} к. (${pct}%)</b>
        </div>
        <div class="ml-bar" style="height: 4px; margin-bottom: 8px;"><i style="width: ${pct}%; background: #3b82f6"></i></div>
      `;
    }).join('') || '<div class="text-center text-gray-400 py-2">Нет данных по профилям</div>';

    const patientStats = [
      { label: 'Сельские', val: d.rural_admitted, color: '#16a34a' },
      { label: 'Дети 0–14', val: d.children_admitted, color: '#0ea5e9' },
    ].map(s => {
      const pct = d.admitted > 0 ? ((s.val / d.admitted) * 100).toFixed(1) : '0.0';
      return `
        <div class="ml-row">
          <span>${s.label}</span> <b style="color:${s.color}">${pct}%</b>
        </div>
        <div class="ml-bar"><i style="width:${pct}%; background:${s.color}"></i></div>
      `;
    }).join('');

    return `
    <div class="ml-card">
      <div class="ml-hd">
        <h3 class="ml-ttl">${d.name}</h3>
        <div style="display:flex; align-items:center; gap:8px;">
           <span class="ml-chip" style="background:${occColor}22; color:${occColor};">
            ● ${d.pct_occupied}% загрузки
          </span>
          <span style="font-size:10px; color:#a0aec0; font-weight:600;">${d.ownership}</span>
        </div>
        <div class="ml-meta">
          <span class="ml-pill">🚐 ${d.org_type}</span>
          <span class="ml-pill">📍 ${d.district}</span>
        </div>
      </div>

      <div class="ml-bd">
        ${d.work > 340 ? `
          <div class="ml-warning-box">
            ⚠️ Работа койки <b>${d.work} дн/год</b> — перегружено (норма ≤340)
          </div>
        ` : ''}

        <div class="ml-row">
          <span>Загруженность коек</span>
          <b style="color:${occColor}">${d.pct_occupied}%</b>
        </div>
        <div class="ml-bar"><i style="width:${Math.min(d.pct_occupied, 100)}%; background:${occColor}"></i></div>
        <div style="font-size: 10px; color: #a0aec0; margin-top: 4px; display:flex; justify-content:space-between; font-weight:600;">
          <span>Занято: ${Math.round(d.occupied_beds)}</span>
          <span>Всего: ${d.total_beds}</span>
        </div>

        <div class="ml-section-title">📊 Основные показатели</div>
        <div class="ml-kpi">
          <div class="ml-box">
            <div class="ml-cap">СДПБ / Оборот</div>
            <div class="ml-val">${d.sdpb} дн / ${d.turnover}</div>
          </div>
          <div class="ml-box">
            <div class="ml-cap">Летальность</div>
            <div class="ml-val" style="color:#e53e3e;">${d.lethal}%</div>
          </div>
        </div>

        <div class="ml-section-title">👥 Пациенты</div>
        ${patientStats}

        <div class="ml-section-title">🛌 Профили (${d.total_beds} коек)</div>
        <div class="ml-profiles">
          ${profilesHtml}
        </div>

        <div class="ml-section-title">🏢 Все здания (${d.bld_count || 0} корп.)</div>
        <div class="ml-bld-wrapper">
          <table class="ml-table">
            <thead>
              <tr>
                <th>Год</th>
                <th>Состояние</th>
                <th style="text-align:right;">Износ</th>
              </tr>
            </thead>
            <tbody>
              ${d.all_blds && d.all_blds.length > 0 ? d.all_blds.map((b) => `
                <tr>
                  <td>${b.year_built || '—'}</td>
                  <td>
                    <span style="color:${b.wear > 50 ? '#dd6b20' : '#38a169'}; font-weight:bold;">
                      ${b.wear > 50 ? '● Кап.рем' : '● Исправно'}
                    </span>
                  </td>
                  <td style="text-align:right;"><b>${b.wear}%</b></td>
                </tr>
              `).join('') : '<tr><td colspan="3" style="text-align:center; padding:10px;">Нет данных</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
};

export const buildRefusalPopupHTML = (item) => {
    const pctRef = item.total_emergency_visits > 0 
      ? ((item.hospitalization_denied / item.total_emergency_visits) * 100).toFixed(1) 
      : "0";

    const occPct = (item.occupancy_rate_percent * 100).toFixed(1);

    return `
      <div style="padding: 12px; font-family: sans-serif; min-width: 250px; text-align: left; line-height: 1.5;">
        <div style="font-weight: bold; font-size: 14px; margin-bottom: 2px; color: #212121;">
          ${item.facility_type || 'Объект'}
        </div>
        <div style="color: #888; font-size: 11px; margin-bottom: 8px;">
          ${item.district || ''}
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 6px 0;" />
        
        <div style="font-size: 12px; color: #333;">
          <div style="display:flex; justify-content:space-between">
            <span>Обращений:</span> <b>${Math.round(item.total_emergency_visits || 0).toLocaleString()}</b>
          </div>
          <div style="display:flex; justify-content:space-between">
            <span>Госпитализировано:</span> <b>${Math.round(item.hospitalized_emerg || 0).toLocaleString()}</b>
          </div>
          <div style="display:flex; justify-content:space-between; margin-top: 2px; color: #C62828;">
            <span>Отказано:</span> <b>${Math.round(item.hospitalization_denied || 0).toLocaleString()} (${pctRef}%)</b>
          </div>
          
          <div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed #eee;">
            <div style="display:flex; justify-content:space-between">
              <span>Занятость коек:</span> <b>${occPct}%</b>
            </div>
            <div style="display:flex; justify-content:space-between">
              <span>Коек (ср.год):</span> <b>${Math.round(item.beds_avg_annual || 0)}</b>
            </div>
          </div>
        </div>
      </div>
    `;
};

export const buildPlannedObjectPopupHTML = (p) => {
    const title = p.name || p.short_name || 'Объект здравоохранения';

    return `
        <div style="padding: 10px 14px; font-family: sans-serif; min-width: 230px; text-align: left;">
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
            <span style="font-size: 14px;">🏗</span>
            <div style="font-weight: bold; font-size: 13px; color: #333;">${title}</div>
        </div>
        <div style="color: #888; font-size: 11px; margin-left: 20px;">${p.district || 'Алматы'}</div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 8px 0;">
        <div style="font-size: 12px; line-height: 1.6; color: #444;">
            <div>Тип: <b>${p.obj_type || '—'}</b></div>
            <div>Статус: <b>${p.status || '—'}</b></div>
            <div>Коек: <b>${p.capacity || '—'}</b></div>
        </div>
        </div>
    `;
};