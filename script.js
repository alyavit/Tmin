let a, b, c_n, d_n, e_n, R, f = [], Tmin;

function collectData() {
  a = parseInt(document.getElementById("a").value);
  b = parseInt(document.getElementById("b").value);
  c_n = parseInt(document.getElementById("c_n").value);
  d_n = parseInt(document.getElementById("d_n").value);
  e_n = parseInt(document.getElementById("e_n").value);
  R = parseInt(document.getElementById("R").value);

  // Tmin: минимальные значения c,d,e
  Tmin = Math.max(
    a + d_n,     // A + D
    c_n,         // C
    b + e_n      // B + E
  );

  // Генерируем поля для ввода прибыли
  const profitInputs = document.getElementById("profit-inputs");
  profitInputs.innerHTML = "";
  for (let i = 0; i < 5; i++) {
    const t = Tmin + i;
    const input = document.createElement("div");
    input.innerHTML = `t = ${t} лет: <input type="number" id="f${i}" min="0" placeholder="f${i}"/> млн руб`;
    profitInputs.appendChild(input);
  }

  document.getElementById("profit-table-section").style.display = "block";
}

function calculateAll() {
  // Считываем прибыль
  for (let i = 0; i < 5; i++) {
    f[i] = parseFloat(document.getElementById(`f${i}`).value);
    if (isNaN(f[i])) {
      alert(`Введите значение для f${i}`);
      return;
    }
  }

  // Проверка убывания
  for (let i = 0; i < 4; i++) {
    if (f[i] <= f[i+1]) {
      alert("Ошибка: f0 > f1 > f2 > f3 > f4");
      return;
    }
  }

  // Все возможные комбинации (c,d,e) ∈ {n, n+1, n+2}
  const c_vals = [c_n, c_n+1, c_n+2];
  const d_vals = [d_n, d_n+1, d_n+2];
  const e_vals = [e_n, e_n+1, e_n+2];
  const totalCombinations = 3 * 3 * 3;
  const prob = 1 / totalCombinations;

  // Таблицы: { t: время, prob: вероятность, profit: прибыль }
  const resultsWithoutR = [];
  const resultsWithR = [];

  for (const c of c_vals) {
    for (const d of d_vals) {
      for (const e of e_vals) {
        // Без R
        const t1 = Math.max(a + d, c, b + e);
        const profit1 = t1 - Tmin < 5 ? f[t1 - Tmin] : 0;
        resultsWithoutR.push({ t: t1, prob, profit: profit1 });

        // С R: ускоряем самый "тяжелый" этап в критическом пути
        let t2 = t1;
        // Определяем, что лимитирует: A+D, C или B+E
        const path1 = a + d;
        const path2 = c;
        const path3 = b + e;
        const maxPath = Math.max(path1, path2, path3);

        // Уменьшаем на 1 только если этот путь был критическим
        if (path1 === maxPath) {
          t2 = Math.max(a + d - 1, c, b + e);
        } else if (path2 === maxPath) {
          t2 = Math.max(a + d, c - 1, b + e);
        } else if (path3 === maxPath) {
          t2 = Math.max(a + d, c, b + e - 1);
        }
        t2 = Math.max(t2, Tmin - 1); // не может быть меньше Tmin-1

        const adjustedT = Math.max(0, Math.min(4, t2 - (Tmin - 1))); // индекс прибыли
        const profit2 = f[adjustedT] - R; // вычитаем стоимость R
        resultsWithR.push({ t: t2, prob, profit: profit2 });
      }
    }
  }

  // Агрегируем по времени
  const aggWithoutR = aggregateByTime(resultsWithoutR);
  const aggWithR = aggregateByTime(resultsWithR);

  // Выводим таблицы
  renderTable(aggWithoutR, "table-without-r");
  renderTable(aggWithR, "table-with-r");

  // Принципы принятия решений
  const principlesDiv = document.getElementById("principles");
  principlesDiv.innerHTML = "<h3>Рекомендации по трем принципам:</h3>";

  // 1. Максимальное правдоподобие
  const mostLikelyT1 = aggWithoutR.reduce((a, b) => (a.prob > b.prob ? a : b)).t;
  const mostLikelyT2 = aggWithR.reduce((a, b) => (a.prob > b.prob ? a : b)).t;
  const profit1_ML = f[Math.max(0, Math.min(4, mostLikelyT1 - Tmin))] || 0;
  const profit2_ML = (f[Math.max(0, Math.min(4, mostLikelyT2 - (Tmin - 1)))] || 0) - R;
  const mlDecision = profit2_ML > profit1_ML ? "использовать R" : "не использовать R";
  principlesDiv.innerHTML += `<p><strong>1. Принцип максимального правдоподобия:</strong> ${mlDecision}</p>`;

  // 2. Средний ожидаемый доход
  const expected1 = aggWithoutR.reduce((sum, row) => sum + row.profit * row.prob, 0);
  const expected2 = aggWithR.reduce((sum, row) => sum + row.profit * row.prob, 0);
  const bayesDecision = expected2 > expected1 ? "использовать R" : "не использовать R";
  principlesDiv.innerHTML += `<p><strong>2. Принцип среднего (Байес):</strong> ${bayesDecision} (ожидаемая прибыль: без R = ${expected1.toFixed(1)}, с R = ${expected2.toFixed(1)})</p>`;

  // 3. Минимальный риск (гарантированная прибыль)
  const worstT1 = Math.max(...aggWithoutR.map(r => r.t));
  const worstT2 = Math.max(...aggWithR.map(r => r.t));
  const worstProfit1 = f[Math.max(0, Math.min(4, worstT1 - Tmin))] || 0;
  const worstProfit2 = (f[Math.max(0, Math.min(4, worstT2 - (Tmin - 1)))] || 0) - R;
  const riskDecision = worstProfit2 > worstProfit1 ? "использовать R" : "не использовать R";
  principlesDiv.innerHTML += `<p><strong>3. Принцип гарантированных оценок:</strong> ${riskDecision} (мин. прибыль: без R = ${worstProfit1}, с R = ${worstProfit2})</p>`;

  // Сохраняем данные для экспорта
  window.exportData = {
    a, b, c_n, d_n, e_n, R, f, Tmin,
    aggWithoutR, aggWithR,
    principles: { mlDecision, bayesDecision, riskDecision },
    expected1, expected2
  };

  document.getElementById("results").style.display = "block";
}

function aggregateByTime(data) {
  const map = {};
  for (const row of data) {
    if (!map[row.t]) map[row.t] = { t: row.t, prob: 0, profit: 0 };
    map[row.t].prob += row.prob;
  }
  const result = Object.values(map);
  result.sort((a, b) => a.t);
  // Добавляем прибыль
  for (const row of result) {
    const idx = Math.max(0, Math.min(4, row.t - Tmin));
    row.profit = f[idx];
  }
  return result;
}

function renderTable(data, tableId) {
  const table = document.getElementById(tableId);
  table.innerHTML = "<tr><th>Срок (лет)</th><th>Вероятность</th><th>Прибыль (млн руб)</th></tr>";
  for (const row of data) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${row.t}</td><td>${row.prob.toFixed(3)}</td><td>${row.profit}</td>`;
    table.appendChild(tr);
  }
}

function simulateOutcome() {
  const outcomes = window.exportData.aggWithoutR;
  const rand = Math.random();
  let sum = 0;
  let selected;
  for (const outcome of outcomes) {
    sum += outcome.prob;
    if (rand <= sum) {
      selected = outcome;
      break;
    }
  }
  document.getElementById("simulation-result").innerHTML =
    `<p><strong>Смоделированный срок:</strong> ${selected.t} лет</p>
     <p><strong>Прибыль:</strong> ${selected.profit} млн руб</p>`;
}

// Экспорт в CSV
function exportToCSV() {
  let csv = "Тип,Срок,Вероятность,Прибыль\n";
  for (const r of window.exportData.aggWithoutR) {
    csv += `Без R,${r.t},${r.prob},${r.profit}\n`;
  }
  for (const r of window.exportData.aggWithR) {
    csv += `С R,${r.t},${r.prob},${r.profit}\n`;
  }
  download(csv, "factory_results.csv", "text/csv");
}

// Экспорт в TXT
function exportToTXT() {
  const d = window.exportData;
  let txt = `=== Планирование завода ===\n`;
  txt += `A: ${d.a}, B: ${d.b}, C_n: ${d.c_n}, D_n: ${d.d_n}, E_n: ${d.e_n}\n`;
  txt += `R: ${d.R}, Tmin: ${d.Tmin}\n`;
  txt += `Прибыль: [${d.f.join(", ")}]\n\n`;

  txt += "Таблица без R:\n";
  for (const r of d.aggWithoutR) {
    txt += `  ${r.t} лет: ${r.prob.toFixed(3)} (${r.profit} млн)\n`;
  }

  txt += "\nТаблица с R:\n";
  for (const r of d.aggWithR) {
    txt += `  ${r.t} лет: ${r.prob.toFixed(3)} (${r.profit} млн)\n`;
  }

  txt += `\nРекомендации:\n`;
  txt += `1. Макс. правдоподобие: ${d.principles.mlDecision}\n`;
  txt += `2. Байес: ${d.principles.bayesDecision}\n`;
  txt += `3. Мин. риск: ${d.principles.riskDecision}\n`;

  download(txt, "factory_results.txt", "text/plain");
}

function download(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}