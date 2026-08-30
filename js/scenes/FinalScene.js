class FinalScene extends Phaser.Scene {
  constructor(){ super('FinalScene'); }
  create(){
    Music.play('menu'); // Victoria final — tema épico del menú
    const w=this.scale.width, h=this.scale.height;
    this.add.rectangle(0,0,w,h,0x0D0D14).setOrigin(0);

    // Fondo radial dorado
    const rad = this.add.graphics();
    rad.fillGradientStyle(0x2a1800, 0x111520, 0x111520, 0x0D0D14, 0.6);
    rad.fillRect(0,0,w,h);

    // Lluvia de partículas épicas
    for(let i=0;i<60;i++){
      const p = this.add.circle(Math.random()*w, Math.random()*h, Math.random()*3+1, Math.random()>0.5 ? 0xD4AF37 : 0xff6b35, 0.8);
      this.tweens.add({targets:p, y:p.y-h-50, alpha:0, duration:3000+Math.random()*3000, repeat:-1, onRepeat:()=>{p.y=h+20; p.x=Math.random()*w; p.alpha=0.8;}});
    }

    snd_victory();

    // Título épico
    const t1 = this.add.text(w/2, 60, '🏆 ¡HAS RESTAURADO ARITHMOS! 🏆', {fontFamily:'Cinzel', fontSize:'38px', color:'#D4AF37', fontStyle:'800', stroke:'#0A0A10', strokeThickness:4, shadow:{offsetX:0,offsetY:0,color:'#D4AF37',blur:22,fill:true}}).setOrigin(0.5);
    this.tweens.add({targets:t1, scale:{from:1, to:1.04}, duration:1500, yoyo:true, repeat:-1});

    const t2 = this.add.text(w/2, 110, `${STATE.nombre} el Probabilista — Leyenda del Reino`, {fontFamily:'Cinzel', fontSize:'24px', color:'#f5e9c9', fontStyle:'italic'}).setOrigin(0.5);

    // Calcular logros
    const logros = this.calcularLogros();

    // Panel central con resumen
    const panelY = 160;
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x111520, 0.92); panelBg.fillRoundedRect(80, panelY, w-160, h-panelY-120, 14);
    panelBg.lineStyle(2, 0xD4AF37, 0.65); panelBg.strokeRoundedRect(80, panelY, w-160, h-panelY-120, 14);
    panelBg.lineStyle(1, 0xD4AF37, 0.15); panelBg.strokeRoundedRect(83, panelY+3, w-166, h-panelY-126, 12);

    this.add.text(w/2, panelY+25, '🏅 Logros Desbloqueados', {fontFamily:'Cinzel', fontSize:'24px', color:'#D4AF37', fontStyle:'700', letterSpacing:2}).setOrigin(0.5);

    // Listado de logros
    let y = panelY+60;
    logros.forEach(l=>{
      const cardBg = this.add.graphics();
      cardBg.fillStyle(0xD4AF37, 0.08); cardBg.fillRoundedRect(110, y, w-220, 36, 6);
      cardBg.lineStyle(1, 0xD4AF37, 0.4); cardBg.strokeRoundedRect(110, y, w-220, 36, 6);
      this.add.text(130, y+18, l.icon, {fontSize:'24px'}).setOrigin(0, 0.5);
      this.add.text(170, y+10, l.titulo, {fontFamily:'Cinzel', fontSize:'17px', color:'#D4AF37', fontStyle:'700'});
      this.add.text(170, y+25, l.desc, {fontFamily:'Poppins', fontSize:'17px', color:'#ccc'});
      y += 42;
    });

    // Número de la suerte
    const lucky = this.calcNumeroSuerte();
    this.add.text(w/2, y+20, `🎲 Tu Número de la Suerte: ${lucky.num} (apareció ${lucky.count} veces)`, {fontFamily:'Cinzel', fontSize:'24px', color:'#9b59b6', fontStyle:'700'}).setOrigin(0.5);
    this.add.text(w/2, y+45, `"Que te acompañe, ${STATE.nombre} el Probabilista."`, {fontFamily:'Poppins', fontStyle:'italic', fontSize:'19px', color:'#ddd'}).setOrigin(0.5);

    // Botones
    const btnY = h-70;
    this.makeBtn(w/2-320, btnY, '📊 Análisis Estadístico', 0xD4AF37, 0x0A0A10, ()=>this.mostrarAnalisis());
    this.makeBtn(w/2-160, btnY, '💾 Exportar (JSON+CSV)', 0x2a3848, 0xC0C8D0, ()=>this.descargarStats());
    this.makeBtn(w/2, btnY, '🎓 Certificado', 0x1E8449, 0xD5F5E3, ()=>this.mostrarCertificado());
    this.makeBtn(w/2+160, btnY, '📖 Informe Pedagógico', 0x8E44AD, 0xE8D0F0, ()=>this.mostrarInformePed());
    this.makeBtn(w/2+320, btnY, '🔄 Nueva Aventura', 0xC0392B, 0xF5C6C2, ()=>this.nuevaAventura());
  }

  calcularLogros(){
    const logros = [];
    logros.push({icon:'🏅', titulo:'DOMADOR DEL DETERMINISMO', desc:'Derrotaste al Demiurgo. La probabilidad es libre.'});
    logros.push({icon:'🏆', titulo:'HÉROE ÉPICO', desc:'Completaste la aventura. Tu nombre vive en Arithmos.'});
    if(STATE.stats.derrotas === 0) logros.push({icon:'🏅', titulo:'ESTRATEGA DE LAPLACE', desc:'Ganaste sin una sola derrota. Eres un maestro.'});
    if(STATE.stats.derrotas >= 3) logros.push({icon:'🏅', titulo:'RESILIENTE DEL AZAR', desc:'A pesar de múltiples derrotas, conquistaste la victoria.'});
    const objUsados = Object.values(STATE.stats.objetosUsados).reduce((a,b)=>a+b,0);
    if(objUsados >= 10) logros.push({icon:'🏅', titulo:'COLECCIONISTA DE ARTEFACTOS', desc:`Usaste ${objUsados} objetos. Dominas el poder de las distribuciones.`});
    const lucky = this.calcNumeroSuerte();
    if(lucky.count >= 5) logros.push({icon:'🏅', titulo:'BENDECIDO POR LA SUERTE', desc:`Tu número ${lucky.num} salió ${lucky.count}+ veces.`});
    if(STATE.resiliencia === 3) logros.push({icon:'🏅', titulo:'PERFECCIONISTA', desc:'Triplicaste tu Resiliencia. Cada derrota fue una lección.'});
    return logros;
  }

  calcNumeroSuerte(){
    const freq = {};
    STATE.stats.tiradas.forEach(t=>{ freq[t.valor] = (freq[t.valor]||0) + 1; });
    let maxN = 13, maxC = 0;
    for(const k in freq){ if(freq[k]>maxC){ maxC=freq[k]; maxN=parseInt(k); } }
    return {num:maxN, count:maxC};
  }

  /* Certificado de finalización imprimible: nombre, título, stats clave. */
  mostrarCertificado(){
    const total  = STATE.stats.tiradas.length;
    const media  = total > 0 ? (STATE.stats.tiradas.reduce((s,t)=>s+t.valor,0)/total).toFixed(2) : '—';
    const tiempo = fmtTime(Date.now() - STATE.stats.tiempoInicio);
    const titulo = (typeof getTituloActual === 'function') ? getTituloActual() : { emoji:'👑', titulo:'Héroe de la Probabilidad' };
    const fecha  = new Date().toLocaleDateString('es-AR', { day:'numeric', month:'long', year:'numeric' });
    const dif    = (STATE.dificultad||'normal').toUpperCase();

    const certHTML = `
      <div id="__certificado" style="background:linear-gradient(160deg,#fdf8ec,#f5ecd4);border:3px double #8b6914;
                  border-radius:6px;padding:28px 30px;text-align:center;color:#2a1a05;max-width:560px;margin:0 auto;
                  font-family:'Lora',serif;position:relative">
        <div style="font-size:11px;letter-spacing:4px;color:#8b6914;font-family:'Cinzel',serif">REINO DE ARITHMOS</div>
        <div style="font-size:24px;font-family:'Cinzel',serif;font-weight:800;color:#5a3a00;margin:8px 0 2px">CERTIFICADO DE FINALIZACIÓN</div>
        <div style="width:180px;height:1px;background:#8b6914;margin:10px auto"></div>
        <p style="font-size:13px;margin:12px 0 4px">Se certifica que</p>
        <div style="font-size:28px;font-family:'Cinzel',serif;font-weight:700;color:#1a0e00">${STATE.nombre}</div>
        <p style="font-size:13px;line-height:1.6;margin:10px 20px">
          completó la campaña de <b>Héroes Probabilísticos</b> en dificultad <b>${dif}</b>,
          derrotó a los 10 Monstruos Matemáticos y restauró la Probabilidad de Laplace,
          alcanzando el título de
        </p>
        <div style="font-size:19px;font-family:'Cinzel',serif;font-weight:700;color:#7a4a00;margin:4px 0 14px">${titulo.emoji} ${titulo.titulo}</div>
        <div style="display:flex;justify-content:center;gap:26px;font-size:11.5px;color:#5a3a10;margin-bottom:14px">
          <span>🎲 ${total} tiradas</span>
          <span>x̄ = ${media} (μ = 13)</span>
          <span>⏱ ${tiempo}</span>
          <span>💀 ${STATE.stats.derrotas} derrotas</span>
        </div>
        <div style="width:180px;height:1px;background:#8b6914;margin:0 auto 8px"></div>
        <div style="font-size:11px;color:#8b6914">${fecha} · RPG Educativo de Probabilidad · ProfeD.</div>
      </div>`;

    window.__printCert = () => {
      let pa = document.getElementById('__printArea');
      if(!pa){ pa = document.createElement('div'); pa.id = '__printArea'; document.body.appendChild(pa); }
      pa.innerHTML = certHTML;
      let st = document.getElementById('__printCSS');
      if(!st){
        st = document.createElement('style'); st.id = '__printCSS';
        st.textContent = '#__printArea{display:none} @media print{ body>*{display:none!important} body>#__printArea{display:block!important} }';
        document.head.appendChild(st);
      }
      window.print();
    };

    openItemModal(`
      <div style="padding:10px">
        ${certHTML}
        <div class="btn-row" style="display:flex;gap:10px;justify-content:center;margin-top:14px">
          <button class="btn-action btn-secondary" onclick="closeItemModal()">◁ Cerrar</button>
          <button class="btn-action" onclick="window.__printCert()">🖨 Imprimir / Guardar PDF</button>
        </div>
      </div>`);
  }

  mostrarAnalisis(){
    const tiradas = STATE.stats.tiradas;
    const total = tiradas.length;
    const freq = {}; for(let k=2;k<=24;k++) freq[k]=0;
    tiradas.forEach(t=>freq[t.valor]++);

    // Media observada
    const mediaObsNum = total > 0 ? tiradas.reduce((s,t)=>s+t.valor,0)/total : 0;
    const mediaObs = mediaObsNum.toFixed(2);
    const mediaTeo = 13;
    const varObs = total > 0 ? (tiradas.reduce((s,t)=>s+Math.pow(t.valor-mediaObsNum,2),0)/total).toFixed(2) : '0';
    const sdObs = Math.sqrt(parseFloat(varObs)).toFixed(2);

    // Coincidencia con teórica (suma de diferencias absolutas, normalizada)
    let divergencia = 0;
    for(let k=2;k<=24;k++){
      const obs = total>0 ? freq[k]/total : 0;
      const teo = combosExact(k)/CFG.DICE_COMBOS;
      divergencia += Math.abs(obs - teo);
    }
    const similitud = Math.max(0, (1 - divergencia)*100).toFixed(1);

    // Coeficiente de Pearson entre distribución observada y teórica
    const obsVec = [], teoVec = [];
    for(let k=2;k<=24;k++){
      obsVec.push(total>0 ? freq[k]/total : 0);
      teoVec.push(combosExact(k)/CFG.DICE_COMBOS);
    }
    const meanObs2 = obsVec.reduce((s,v)=>s+v,0)/obsVec.length;
    const meanTeo2 = teoVec.reduce((s,v)=>s+v,0)/teoVec.length;
    let covNum=0, sdO=0, sdT=0;
    for(let i=0;i<obsVec.length;i++){
      covNum += (obsVec[i]-meanObs2)*(teoVec[i]-meanTeo2);
      sdO += (obsVec[i]-meanObs2)**2;
      sdT += (teoVec[i]-meanTeo2)**2;
    }
    const pearson = (sdO>0&&sdT>0) ? (covNum/Math.sqrt(sdO*sdT)).toFixed(4) : '—';

    // Frecuencia por cara individual (d1 + d2 pooled, 1-12)
    const faceFreq = {}; for(let f=1;f<=12;f++) faceFreq[f]=0;
    STATE.stats.tiradas.forEach(t=>{ if(t.d1) faceFreq[t.d1]++; if(t.d2) faceFreq[t.d2]++; });
    const totalFaces = Object.values(faceFreq).reduce((s,v)=>s+v,0);
    const faceExpected = totalFaces/12;

    let html = `<div>
      <h3 style="color:#D4AF37;font-family:Cinzel;text-align:center">📊 Análisis Estadístico Completo</h3>
      <div class="card">
        <p><strong>Total de tiradas:</strong> ${total}</p>
        <p><strong>Total de derrotas:</strong> ${STATE.stats.derrotas}</p>
        <p><strong>Tiempo de juego:</strong> ${fmtTime(Date.now() - STATE.stats.tiempoInicio)}</p>
        <p><strong>Media observada:</strong> ${mediaObs}  |  Media teórica: 13</p>
        <p><strong>Desviación estándar observada:</strong> ${sdObs}  |  Teórica: ≈ 4.90</p>
        <p><strong>Similitud con distribución teórica:</strong> <span class="highlight">${similitud}%</span> <span style="color:#888;font-size:11px">(métrica propia: 100 − Σ|obs−teo|)</span></p>
        <p><strong>Correlación de Pearson (obs vs teórica):</strong> <span class="highlight">r = ${pearson}</span> <span style="color:#888;font-size:11px">(1.0 = perfecta, &gt;0.95 excelente)</span></p>
        <p style="margin-top:8px;color:${similitud>=85?'#2ecc71':'#f1c40f'};font-weight:600">${similitud>=95 ? '🏅 ¡Matemático Supremo! Tu distribución coincidió casi perfectamente con la teórica.' : similitud>=85 ? '🎯 Excelente control del azar. Muy cercano a la teoría.' : similitud>=70 ? '📈 Buena aproximación, con variación propia del muestreo.' : '🎲 Mucha dispersión — la ley de los grandes números requiere más tiradas.'}</p>
      </div>

      <h4 style="color:#D4AF37;margin-top:16px">Frecuencias Observadas vs Teóricas</h4>
      <div class="bar-chart">`;
    for(let k=2;k<=24;k++){
      const obs = total>0 ? freq[k]/total : 0;
      const teo = combosExact(k)/CFG.DICE_COMBOS;
      const maxH = Math.max(obs, teo);
      const obsH = obs/Math.max(0.12, maxH*1.1) * 100;
      const teoH = teo/Math.max(0.12, maxH*1.1) * 100;
      html += `<div class="bar-col"><div class="bar-bg"><div class="bar-obs" style="height:${obsH}%" title="Obs ${(obs*100).toFixed(1)}%"></div><div class="bar-teo" style="height:${teoH}%" title="Teo ${(teo*100).toFixed(1)}%"></div></div><div class="bar-lbl">${k}</div></div>`;
    }
    html += `</div>
      <div class="chart-legend"><span><span class="swatch" style="background:#5a7090"></span>Observado</span><span><span class="swatch" style="background:#D4AF37"></span>Teórico</span></div>

      <h4 style="color:#D4AF37;margin-top:16px">Tabla Comparativa</h4>
      <table class="stats-table"><thead><tr><th>Resultado</th><th>Obs. (cant)</th><th>Obs. %</th><th>Teórica %</th><th>Diferencia</th></tr></thead><tbody>`;
    for(let k=2;k<=24;k++){
      const obs = total>0 ? (freq[k]/total*100).toFixed(2) : '0.00';
      const teo = (combosExact(k)/CFG.DICE_COMBOS*100).toFixed(2);
      const diff = (obs - teo).toFixed(2);
      html += `<tr><td><strong>${k}</strong></td><td>${freq[k]}</td><td>${obs}%</td><td>${teo}%</td><td style="color:${Math.abs(diff)<2?'#2ecc71':'#f1c40f'}">${diff}%</td></tr>`;
    }
    html += '</tbody></table>';

    // Histograma de caras individuales (equiprobabilidad)
    html += `<h4 style="color:#D4AF37;margin-top:16px">&#127922; Frecuencia de Caras Individuales (d1 + d2)</h4>
      <p style="color:#aaa;font-size:12px;margin:0 0 8px">Cada cara (1-12) deberia aparecer el ~8.33% del tiempo (equiprobabilidad). Total caras lanzadas: ${totalFaces}</p>
      <div class="bar-chart">`;
    for(let f=1;f<=12;f++){
      const obsF = totalFaces>0 ? faceFreq[f]/totalFaces : 0;
      const teoF = 1/12;
      const maxH2 = Math.max(obsF, teoF);
      const obsH2 = obsF/Math.max(0.12, maxH2*1.1)*100;
      const teoH2 = teoF/Math.max(0.12, maxH2*1.1)*100;
      const diff = Math.abs(obsF - teoF);
      const barColor = diff < 0.02 ? '#2ecc71' : diff < 0.05 ? '#f1c40f' : '#e74c3c';
      html += `<div class="bar-col"><div class="bar-bg"><div class="bar-obs" style="height:${obsH2}%;background:${barColor}" title="Obs ${(obsF*100).toFixed(1)}%"></div><div class="bar-teo" style="height:${teoH2}%" title="Teo 8.33%"></div></div><div class="bar-lbl">${f}</div></div>`;
    }
    html += `</div>
      <div class="chart-legend"><span><span class="swatch" style="background:#5a7090"></span>Observado</span><span><span class="swatch" style="background:#D4AF37"></span>Esperado (8.33%)</span></div>
      <p style="color:#aaa;font-size:12px;margin-top:6px">Verde = dentro de ±2pp del esperado. Amarillo = ±2–5pp. Rojo = &gt;5pp. Un dado justo converge a igual frecuencia en todas las caras (ley de Bernoulli).</p>`;

    // Turnos épicos
    if(STATE.stats.turnosEpicos.length > 0){
      html += `<h4 style="color:#D4AF37;margin-top:16px">⚡ Tiradas Épicas (valores extremos)</h4><ul>`;
      STATE.stats.turnosEpicos.slice(0,10).forEach(t=>{
        html += `<li>Turno ${t.turno} · ${t.jefe}: <strong>${t.valor}</strong></li>`;
      });
      html += '</ul>';
    }

    html += `<div class="btn-row"><button class="btn-action" onclick="closeReportModal()">Cerrar</button></div></div>`;
    openReportModal('📊 Análisis Estadístico Final', html);
  }

  mostrarInformePed(){
    const logros = this.calcularLogros();
    const lucky = this.calcNumeroSuerte();
    let html = `<div>
      <h3 style="color:#D4AF37;font-family:Cinzel;text-align:center">📖 Informe Pedagógico</h3>
      <p style="text-align:center;color:#ddd;font-style:italic">Resumen de conceptos practicados por <strong>${STATE.nombre}</strong></p>

      <h4>🎯 Conceptos trabajados</h4>
      <ul>
        <li><strong>Regla de Laplace:</strong> calculaste probabilidades como Casos Favorables / 144 en cada combate.</li>
        <li><strong>Espacio muestral:</strong> trabajaste con los 144 resultados equiprobables de 2d12.</li>
        <li><strong>Distribución triangular:</strong> experimentaste por qué valores centrales (13) son más frecuentes.</li>
        <li><strong>Eventos independientes:</strong> cada tirada fue un experimento nuevo.</li>
        <li><strong>Probabilidad condicional:</strong> los bonificadores de objetos modificaron el umbral efectivo.</li>
        <li><strong>Ley de los grandes números:</strong> tus ${STATE.stats.tiradas.length} tiradas convergieron (con similitud del ${this.calcSimilitud()}%) a la distribución teórica.</li>
      </ul>

      <h4>📈 Tus indicadores</h4>
      <div class="card">
        <p>• Total de tiradas: <span class="highlight">${STATE.stats.tiradas.length}</span></p>
        <p>• Derrotas asumidas: <span class="highlight">${STATE.stats.derrotas}</span></p>
        <p>• Objetos usados: <span class="highlight">${Object.values(STATE.stats.objetosUsados).reduce((a,b)=>a+b,0)}</span></p>
        <p>• Número más frecuente: <span class="highlight">${lucky.num}</span> (${lucky.count} veces)</p>
        <p>• Tiempo total: <span class="highlight">${fmtTime(Date.now()-STATE.stats.tiempoInicio)}</span></p>
      </div>

      <h4>🧠 Reflexión metacognitiva</h4>
      <p>Piensa: ¿en qué momento usaste una bonificación para modificar la probabilidad? ¿Te arriesgaste con umbrales altos o preferiste esperar con objetos defensivos? Cada decisión refleja tu comprensión del equilibrio entre <em>riesgo</em> y <em>valor esperado</em>.</p>

      <h4>🏅 Logros alcanzados</h4>`;
    logros.forEach(l=>{ html += `<div class="achievement"><div class="icon">${l.icon}</div><div class="text"><strong>${l.titulo}</strong><br>${l.desc}</div></div>`; });

    html += `<h4>📝 Próximos pasos sugeridos</h4>
      <ul>
        <li>Lanza 50 tiradas reales con dos dados (físicos si tienes, o con d12) y compara con tus datos aquí.</li>
        <li>Calcula a mano P(suma = 13), P(suma ≥ 18) y P(doble 1).</li>
        <li>Investiga: ¿qué distribución sigue la suma de 2 dados regulares (d6)? Compara con 2d12.</li>
        <li>Discute en clase: "¿Existe el azar puro o todo es determinismo?"</li>
      </ul>
      <div class="btn-row"><button class="btn-action" onclick="closeReportModal()">Cerrar</button></div></div>`;
    openReportModal('📖 Informe Pedagógico', html);
  }

  calcSimilitud(){
    const total = STATE.stats.tiradas.length;
    if(total===0) return '0';
    const freq={}; for(let k=2;k<=24;k++) freq[k]=0;
    STATE.stats.tiradas.forEach(t=>freq[t.valor]++);
    let div=0;
    for(let k=2;k<=24;k++){ div += Math.abs(freq[k]/total - combosExact(k)/CFG.DICE_COMBOS); }
    return Math.max(0, (1-div)*100).toFixed(1);
  }

  descargarStats(){
    const data = {
      heroe: STATE.nombre,
      fecha: new Date().toISOString(),
      jefesDerrotados: STATE.jefeActual,
      totalTiradas: STATE.stats.tiradas.length,
      totalDerrotas: STATE.stats.derrotas,
      resilienciaFinal: STATE.resiliencia,
      tiempoTotalMs: Date.now() - STATE.stats.tiempoInicio,
      objetosUsados: STATE.stats.objetosUsados,
      frecuenciaResultados: (()=>{ const f={}; for(let k=2;k<=24;k++) f[k]=0; STATE.stats.tiradas.forEach(t=>f[t.valor]++); return f; })(),
      tiradasEpicas: STATE.stats.turnosEpicos,
      logros: this.calcularLogros().map(l=>l.titulo),
      numeroSuerte: this.calcNumeroSuerte()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `heroes_probabilisticos_${STATE.nombre}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    /* CSV — una fila por alumno, pensado para que el docente pegue varias en una planilla. */
    const media = data.totalTiradas > 0
      ? (STATE.stats.tiradas.reduce((s,t)=>s+t.valor,0) / data.totalTiradas).toFixed(2)
      : '';
    const score = (typeof calcScore === 'function') ? calcScore() : '';
    const numLogros = (typeof logrosGet === 'function') ? Object.keys(logrosGet().desbloqueados).length : '';
    const csvHeader = ['alumno','fecha','dificultad','jefes_derrotados','total_tiradas','media_tirada','derrotas','resiliencia_final','tiempo_min','logros_desbloqueados','puntaje'];
    const csvRow = [
      STATE.nombre, new Date().toISOString(), STATE.dificultad||'normal', data.jefesDerrotados,
      data.totalTiradas, media, data.totalDerrotas, data.resilienciaFinal,
      (data.tiempoTotalMs/60000).toFixed(1), numLogros, score
    ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(',');
    const csvBlob = new Blob([csvHeader.join(',') + '\n' + csvRow], {type:'text/csv'});
    const csvUrl = URL.createObjectURL(csvBlob);
    const a2 = document.createElement('a');
    a2.href = csvUrl; a2.download = `heroes_probabilisticos_${STATE.nombre}_${Date.now()}.csv`;
    a2.click();
    URL.revokeObjectURL(csvUrl);

    showToast('💾 Estadísticas descargadas (JSON + CSV)');
  }

  nuevaAventura(){
    clearSave();
    Object.assign(STATE, {
      nombre:"Héroe", jefeActual:0, hp:150, hpMax:150,
      ataque:8, defensa:5, ataqueBase:8, defensaBase:5,
      resiliencia:0, inventario:[], buffs:[],
      loreVisto:[], tiradaGlobal:0, diosaContador:0,
      stats:{tiradas:[], derrotas:0, objetosUsados:{}, tiempoInicio:Date.now(), dañoTotalFinal:0, objetosUsadosFinal:0, turnosEpicos:[]}
    });
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', ()=>this.scene.start('MenuScene'));
  }

  makeBtn(x,y,label,color,txtColor,action){
    const bw = 170, bh = 48;
    const container = this.add.container(x, y);
    const r = (color >> 16) & 0xff, g = (color >> 8) & 0xff, b = color & 0xff;
    const darkCol = Phaser.Display.Color.GetColor(Math.max(0,r-80), Math.max(0,g-80), Math.max(0,b-80));
    const lightCol = Phaser.Display.Color.GetColor(Math.min(255,r+40), Math.min(255,g+40), Math.min(255,b+40));
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.5);
    shadow.fillRoundedRect(-bw/2+2, -bh/2+5, bw, bh, 9);
    const base = this.add.graphics();
    base.fillStyle(darkCol, 1);
    base.fillRoundedRect(-bw/2, -bh/2+4, bw, bh, 9);
    const fg = this.add.graphics();
    fg.fillGradientStyle(lightCol, lightCol, color, color, 1);
    fg.fillRoundedRect(-bw/2, -bh/2, bw, bh, 9);
    const shine = this.add.graphics();
    shine.fillStyle(0xffffff, 0.3);
    shine.fillRoundedRect(-bw/2+3, -bh/2+2, bw-6, bh/2-3, 6);
    const border = this.add.graphics();
    border.lineStyle(2, 0xfff5d0, 0.9);
    border.strokeRoundedRect(-bw/2, -bh/2, bw, bh, 9);
    const t = this.add.text(0, 0, label, {
      fontFamily:'Poppins', fontSize:'15px',
      color:`#${txtColor.toString(16).padStart(6,'0')}`,
      fontStyle:'800', align:'center', stroke:'#000', strokeThickness:txtColor === 0xffffff ? 1 : 0
    }).setOrigin(0.5);
    container.add([shadow, base, fg, shine, border, t]);
    const glow = this.add.graphics();
    glow.fillStyle(color, 0.5);
    glow.fillRoundedRect(x-bw/2-6, y-bh/2-6, bw+12, bh+12, 13);
    glow.setVisible(false);
    const hit = this.add.rectangle(x, y, bw, bh, 0, 0).setInteractive({useHandCursor:true});
    hit.on('pointerover', ()=>{
      this.tweens.add({targets:container, scale:1.07, duration:150, ease:'Back.easeOut'});
      glow.setVisible(true);
      this.tweens.add({targets:glow, alpha:{from:0, to:0.75}, duration:180});
      snd_item();
    });
    hit.on('pointerout', ()=>{
      this.tweens.add({targets:container, scale:1, duration:150});
      this.tweens.add({targets:glow, alpha:0, duration:150, onComplete:()=>glow.setVisible(false)});
    });
    hit.on('pointerdown', ()=>{ this.tweens.add({targets:container, scale:0.94, duration:70, yoyo:true}); });
    hit.on('pointerup', action);
  }
}
