// Основной объект приложения
const app = {
    // Основные переменные
    timeScenarios: [],
    timeScenariosWithReserve: [],
    profitTable: {},
    minTime: 0,
    
    // Инициализация приложения
    init: function() {
        this.setupEventListeners();
        this.loadData();
        this.generateProfitTableInputs();
    },
    
    // Настройка обработчиков событий
    setupEventListeners: function() {
        document.getElementById('n').addEventListener('change', () => this.generateProfitTableInputs());
        document.getElementById('a').addEventListener('change', () => this.generateProfitTableInputs());
        document.getElementById('b').addEventListener('change', () => this.generateProfitTableInputs());
        
        document.getElementById('calculate-btn').addEventListener('click', () => this.calculate());
        document.getElementById('save-data-btn').addEventListener('click', () => this.saveData());
        document.getElementById('simulate-btn').addEventListener('click', () => this.simulateRandomScenario());
        document.getElementById('export-txt-btn').addEventListener('click', () => this.exportData('txt'));
        //document.getElementById('export-csv-btn').addEventListener('click', () => this.exportData('csv'));
    },
    
    // Переключение отображения деталей
    toggleDetails: function(id) {
        const element = document.getElementById(id);
        element.classList.toggle('hidden');
    },
    
    // Генерация полей для ввода таблицы прибыли
    generateProfitTableInputs: function() {
        const a = parseInt(document.getElementById('a').value);
        const b = parseInt(document.getElementById('b').value);
        const n = parseInt(document.getElementById('n').value);
        
        // Расчет минимального времени
        this.minTime = Math.max(a + n, n, b + n);
        
        const container = document.getElementById('profit-table-inputs');
        container.innerHTML = '';
        
        for (let i = 0; i < 5; i++) {
            const time = this.minTime + i;
            const div = document.createElement('div');
            div.className = 'input-group';
            
            const label = document.createElement('label');
            label.textContent = `Прибыль за ${time} лет (млн. руб.):`;
            
            const input = document.createElement('input');
            input.type = 'number';
            input.id = `profit-${time}`;
            input.min = '0';
            
            // Установка значений по умолчанию или загруженных данных
            const defaultValues = this.savedProfits || [150, 130, 100, 70, 40];
            input.value = defaultValues[i] || defaultValues[i];
            
            div.appendChild(label);
            div.appendChild(input);
            container.appendChild(div);
        }
    },
    
    // Основная функция расчета
    calculate: function() {
        // Получение входных данных
        const a = parseInt(document.getElementById('a').value);
        const b = parseInt(document.getElementById('b').value);
        const n = parseInt(document.getElementById('n').value);
        const r = parseInt(document.getElementById('r').value);
        
        // Валидация входных данных
        if (!this.validateInputs(a, b, n, r)) {
            return;
        }
        
        // Получение таблицы прибыли
        this.profitTable = {};
        for (let i = 0; i < 5; i++) {
            const time = this.minTime + i;
            const profit = parseInt(document.getElementById(`profit-${time}`).value);
            this.profitTable[time] = profit;
        }
        
        // Проверка, что прибыль убывает
        if (!this.validateProfitTable()) {
            alert('Ошибка: прибыль должна убывать с увеличением времени.');
            return;
        }
        
        // Расчет всех возможных сценариев
        this.calculateScenarios(a, b, n);
        
        // Расчет сценариев с использованием резерва
        this.calculateScenariosWithReserve(a, b, n, r);
        
        // Отображение результатов
        this.displayResults();
        
        // Показ раздела с результатами
        document.getElementById('results').classList.remove('hidden');
    },
    
    // Валидация входных данных
    validateInputs: function(a, b, n, r) {
        const errors = [];
        
        if (a <= 0) errors.push('Этап A должен быть больше 0');
        if (b <= 0) errors.push('Этап B должен быть больше 0');
        if (n <= 0) errors.push('Базовое время n должно быть больше 0');
        if (r <= 0) errors.push('Резервные средства R должны быть больше 0');
        
        // Проверка таблицы прибыли
        for (let i = 0; i < 5; i++) {
            const time = this.minTime + i;
            const profit = parseInt(document.getElementById(`profit-${time}`).value);
            if (profit < 0) {
                errors.push(`Прибыль за ${time} лет не может быть отрицательной`);
            }
        }
        
        if (errors.length > 0) {
            alert('Ошибки валидации:\n' + errors.join('\n'));
            return false;
        }
        
        return true;
    },
    
    // Валидация таблицы прибыли
    validateProfitTable: function() {
        let prevProfit = Infinity;
        for (let i = 0; i < 5; i++) {
            const time = this.minTime + i;
            const profit = this.profitTable[time];
            if (profit >= prevProfit) {
                return false;
            }
            prevProfit = profit;
        }
        return true;
    },
    
    // Расчет всех возможных временных сценариев
    calculateScenarios: function(a, b, n) {
        this.timeScenarios = [];
        
        // Все возможные комбинации для c, d, e
        for (let c = n; c <= n + 3; c++) {
            for (let d = n; d <= n + 3; d++) {
                for (let e = n; e <= n + 3; e++) {
                    const time = Math.max(a + d, c, b + e);
                    this.timeScenarios.push({
                        c, d, e,
                        time,
                        profit: this.profitTable[time] || 0
                    });
                }
            }
        }
    },
    
    // Расчет сценариев с использованием резервных средств
    calculateScenariosWithReserve: function(a, b, n, r) {
        this.timeScenariosWithReserve = [];
        
        for (let c = n; c <= n + 3; c++) {
            for (let d = n; d <= n + 3; d++) {
                for (let e = n; e <= n + 3; e++) {
                    // Пробуем ускорить каждый из этапов A, B, C, D, E
                    const scenarios = [];
                    
                    // Ускорение этапа A
                    scenarios.push({
                        accelerated: 'A',
                        time: Math.max(Math.max(a - 1, 1) + d, c, b + e),
                        profit: (this.profitTable[Math.max(Math.max(a - 1, 1) + d, c, b + e)] || 0) - r
                    });
                    
                    // Ускорение этапа B
                    scenarios.push({
                        accelerated: 'B',
                        time: Math.max(a + d, c, Math.max(b - 1, 1) + e),
                        profit: (this.profitTable[Math.max(a + d, c, Math.max(b - 1, 1) + e)] || 0) - r
                    });
                    
                    // Ускорение этапа C
                    scenarios.push({
                        accelerated: 'C',
                        time: Math.max(a + d, Math.max(c - 1, n), b + e),
                        profit: (this.profitTable[Math.max(a + d, Math.max(c - 1, n), b + e)] || 0) - r
                    });
                    
                    // Ускорение этапа D
                    scenarios.push({
                        accelerated: 'D',
                        time: Math.max(a + Math.max(d - 1, n), c, b + e),
                        profit: (this.profitTable[Math.max(a + Math.max(d - 1, n), c, b + e)] || 0) - r
                    });
                    
                    // Ускорение этапа E
                    scenarios.push({
                        accelerated: 'E',
                        time: Math.max(a + d, c, b + Math.max(e - 1, n)),
                        profit: (this.profitTable[Math.max(a + d, c, b + Math.max(e - 1, n))] || 0) - r
                    });
                    
                    // Находим лучший вариант ускорения (сначала по времени, потом по прибыли)
                    const bestScenario = scenarios.reduce((best, current) => {
                        if (current.time < best.time) return current;
                        if (current.time === best.time && current.profit > best.profit) return current;
                        return best;
                    });
                    
                    this.timeScenariosWithReserve.push({
                        c, d, e,
                        accelerated: bestScenario.accelerated,
                        time: bestScenario.time,
                        profit: bestScenario.profit
                    });
                }
            }
        }
    },
    
    // Отображение результатов расчетов
    displayResults: function() {
        this.displayTimeScenarios();
        this.displayDetailedScenarios();
        this.displayPrinciplesAnalysis();
        this.createCharts();
    },
    
    // Отображение таблицы временных сценариев
    displayTimeScenarios: function() {
        const container = document.getElementById('time-scenarios-table');
        const totalScenarios = this.timeScenarios.length;
        
        const timeStats = this.calculateTimeStats(this.timeScenarios);
        const timeStatsWithReserve = this.calculateTimeStats(this.timeScenariosWithReserve);
        
        let html = `
            <h4>Без использования резервных средств</h4>
            <table>
                <tr>
                    <th>Время (лет)</th>
                    <th>Количество сценариев</th>
                    <th>Вероятность</th>
                    <th>Средняя прибыль (млн. руб.)</th>
                </tr>
        `;
        
        for (const time in timeStats) {
            const probability = (timeStats[time].count / totalScenarios * 100).toFixed(2);
            const avgProfit = (timeStats[time].totalProfit / timeStats[time].count).toFixed(2);
            
            html += `
                <tr>
                    <td>${time}</td>
                    <td>${timeStats[time].count}</td>
                    <td>${probability}%</td>
                    <td>${avgProfit}</td>
                </tr>
            `;
        }
        
        html += `
            </table>
            <h4>С использованием резервных средств</h4>
            <table>
                <tr>
                    <th>Время (лет)</th>
                    <th>Количество сценариев</th>
                    <th>Вероятность</th>
                    <th>Средняя прибыль (млн. руб.)</th>
                </tr>
        `;
        
        for (const time in timeStatsWithReserve) {
            const probability = (timeStatsWithReserve[time].count / totalScenarios * 100).toFixed(2);
            const avgProfit = (timeStatsWithReserve[time].totalProfit / timeStatsWithReserve[time].count).toFixed(2);
            
            html += `
                <tr>
                    <td>${time}</td>
                    <td>${timeStatsWithReserve[time].count}</td>
                    <td>${probability}%</td>
                    <td>${avgProfit}</td>
                </tr>
            `;
        }
        
        html += `</table>`;
        container.innerHTML = html;
    },
    
    // Расчет статистики по времени
    calculateTimeStats: function(scenarios) {
        const stats = {};
        scenarios.forEach(scenario => {
            if (!stats[scenario.time]) {
                stats[scenario.time] = { count: 0, totalProfit: 0 };
            }
            stats[scenario.time].count++;
            stats[scenario.time].totalProfit += scenario.profit;
        });
        return stats;
    },
    
    // Отображение детальных таблиц перебора
    displayDetailedScenarios: function() {
        const tableWithout = document.getElementById('detailed-table-without').querySelector('tbody');
        const tableWith = document.getElementById('detailed-table-with').querySelector('tbody');
        
        tableWithout.innerHTML = '';
        tableWith.innerHTML = '';
        
        this.timeScenarios.forEach(scenario => {
            const row = tableWithout.insertRow();
            row.insertCell(0).textContent = scenario.c;
            row.insertCell(1).textContent = scenario.d;
            row.insertCell(2).textContent = scenario.e;
            row.insertCell(3).textContent = scenario.time;
            row.insertCell(4).textContent = scenario.profit;
        });
        
        this.timeScenariosWithReserve.forEach(scenario => {
            const row = tableWith.insertRow();
            row.insertCell(0).textContent = scenario.c;
            row.insertCell(1).textContent = scenario.d;
            row.insertCell(2).textContent = scenario.e;
            row.insertCell(3).textContent = scenario.accelerated;
            row.insertCell(4).textContent = scenario.time;
            row.insertCell(5).textContent = scenario.profit;
        });
    },
    
    // Анализ по трем принципам принятия решений
    displayPrinciplesAnalysis: function() {
        const principlesContainer = document.getElementById('principles-analysis');
        const recommendationContainer = document.getElementById('recommendation');
        
        const mostLikelyTimeWithout = this.findMostLikelyTime(this.timeScenarios);
        const mostLikelyTimeWith = this.findMostLikelyTime(this.timeScenariosWithReserve);
        const expectedProfitWithout = this.calculateExpectedProfit(this.timeScenarios);
        const expectedProfitWith = this.calculateExpectedProfit(this.timeScenariosWithReserve);
        const minProfitWithout = this.calculateMinProfit(this.timeScenarios);
        const minProfitWith = this.calculateMinProfit(this.timeScenariosWithReserve);
        
        principlesContainer.innerHTML = this.generatePrinciplesHTML(
            mostLikelyTimeWithout, mostLikelyTimeWith,
            expectedProfitWithout, expectedProfitWith,
            minProfitWithout, minProfitWith
        );
        
        recommendationContainer.innerHTML = this.generateRecommendation(
            mostLikelyTimeWithout, mostLikelyTimeWith,
            expectedProfitWithout, expectedProfitWith,
            minProfitWithout, minProfitWith
        );
    },
    
    // Генерация HTML для принципов
    generatePrinciplesHTML: function(mlWithout, mlWith, expWithout, expWith, minWithout, minWith) {
        return `
            <div class="result-section">
                <h4>1. Принцип максимального правдоподобия</h4>
                <div class="calculation-details">
                    <p><strong>Расчет:</strong> Выбирается наиболее вероятный срок завершения для каждого варианта</p>
                    <p>Без резерва: время ${mlWithout.time} лет (вероятность ${mlWithout.probability}%)</p>
                    <p>С резервом: время ${mlWith.time} лет (вероятность ${mlWith.probability}%)</p>
                    <p>Прибыль без резерва: ${mlWithout.avgProfit} млн. руб.</p>
                    <p>Прибыль с резервом: ${mlWith.avgProfit} млн. руб.</p>
                </div>
                <p>Наиболее вероятное время без резерва: <strong>${mlWithout.time} лет</strong> 
                (вероятность: ${mlWithout.probability}%, прибыль: ${mlWithout.avgProfit} млн. руб.)</p>
                <p>Наиболее вероятное время с резервом: <strong>${mlWith.time} лет</strong> 
                (вероятность: ${mlWith.probability}%, прибыль: ${mlWith.avgProfit} млн. руб.)</p>
                <div class="recommendation ${mlWith.avgProfit > mlWithout.avgProfit ? 'positive' : 'negative'}">
                    <strong>Рекомендация:</strong> ${mlWith.avgProfit > mlWithout.avgProfit ? 
                    'Использовать резервные средства' : 'Не использовать резервные средства'}
                </div>
            </div>
            
            <div class="result-section">
                <h4>2. Принцип среднего (ожидаемая прибыль)</h4>
                <div class="calculation-details">
                    <p><strong>Расчет:</strong> Сумма (прибыль × вероятность) для всех сценариев</p>
                    <p>Без резерва: ${expWithout.toFixed(2)} млн. руб.</p>
                    <p>С резервом: ${expWith.toFixed(2)} млн. руб.</p>
                    <p>Разница: ${(expWith - expWithout).toFixed(2)} млн. руб.</p>
                </div>
                <p>Ожидаемая прибыль без резерва: <strong>${expWithout.toFixed(2)} млн. руб.</strong></p>
                <p>Ожидаемая прибыль с резервом: <strong>${expWith.toFixed(2)} млн. руб.</strong></p>
                <div class="recommendation ${expWith > expWithout ? 'positive' : 'negative'}">
                    <strong>Рекомендация:</strong> ${expWith > expWithout ? 
                    'Использовать резервные средства' : 'Не использовать резервные средства'}
                </div>
            </div>
            
            <div class="result-section">
                <h4>3. Принцип гарантированных оценок (минимальный риск)</h4>
                <div class="calculation-details">
                    <p><strong>Расчет:</strong> Выбирается наихудший сценарий для каждого варианта</p>
                    <p>Без резерва: минимальная прибыль ${minWithout} млн. руб.</p>
                    <p>С резервом: минимальная прибыль ${minWith} млн. руб.</p>
                    <p>Разница: ${minWith - minWithout} млн. руб.</p>
                </div>
                <p>Минимальная гарантированная прибыль без резерва: <strong>${minWithout} млн. руб.</strong></p>
                <p>Минимальная гарантированная прибыль с резервом: <strong>${minWith} млн. руб.</strong></p>
                <div class="recommendation ${minWith > minWithout ? 'positive' : 'negative'}">
                    <strong>Рекомендация:</strong> ${minWith > minWithout ? 
                    'Использовать резервные средства' : 'Не использовать резервные средства'}
                </div>
            </div>
        `;
    },
    
    // Генерация рекомендации
    generateRecommendation: function(mlWithout, mlWith, expWithout, expWith, minWithout, minWith) {
        const principlesForReserve = [
            parseFloat(mlWith.avgProfit) > parseFloat(mlWithout.avgProfit),
            expWith > expWithout,
            minWith > minWithout
        ].filter(Boolean).length;
        
        const finalRecommendation = principlesForReserve >= 2 ? 
            'Использовать резервные средства' : 'Не использовать резервные средства';
        
        return `
            <div class="recommendation ${principlesForReserve >= 2 ? 'positive' : 'negative'}">
                <strong>Итоговая рекомендация:</strong> ${finalRecommendation} 
                (${principlesForReserve} из 3 принципов поддерживают это решение)
            </div>
        `;
    },
    
    // Вспомогательные функции для анализа
    findMostLikelyTime: function(scenarios) {
        const timeCounts = {};
        const timeProfits = {};
        
        scenarios.forEach(scenario => {
            if (!timeCounts[scenario.time]) {
                timeCounts[scenario.time] = 0;
                timeProfits[scenario.time] = 0;
            }
            timeCounts[scenario.time]++;
            timeProfits[scenario.time] += scenario.profit;
        });
        
        let mostLikelyTime = null;
        let maxCount = 0;
        
        for (const time in timeCounts) {
            if (timeCounts[time] > maxCount) {
                maxCount = timeCounts[time];
                mostLikelyTime = time;
            }
        }
        
        return {
            time: mostLikelyTime,
            probability: (maxCount / scenarios.length * 100).toFixed(2),
            avgProfit: (timeProfits[mostLikelyTime] / maxCount)
        };
    },
    
    calculateExpectedProfit: function(scenarios) {
        const total = scenarios.reduce((sum, scenario) => sum + scenario.profit, 0);
        return total / scenarios.length;
    },
    
    calculateMinProfit: function(scenarios) {
        return Math.min(...scenarios.map(s => s.profit));
    },
    
    // Моделирование случайного сценария
    simulateRandomScenario: function() {
        const useReserve = Math.random() > 0.5;
        const scenarios = useReserve ? this.timeScenariosWithReserve : this.timeScenarios;
        const randomIndex = Math.floor(Math.random() * scenarios.length);
        const scenario = scenarios[randomIndex];
        
        const resultDiv = document.getElementById('simulation-result');
        resultDiv.classList.remove('hidden');
        
        resultDiv.innerHTML = `
            <div class="scenario-result">
                <h4>Результаты случайного моделирования</h4>
                <p>Было принято решение: <strong>${useReserve ? 'Использовать' : 'Не использовать'} резервные средства</strong></p>
                <p>Реализованные значения:</p>
                <ul>
                    <li>Этап C: ${scenario.c} лет</li>
                    <li>Этап D: ${scenario.d} лет</li>
                    <li>Этап E: ${scenario.e} лет</li>
                    ${useReserve ? `<li>Ускорен этап: ${scenario.accelerated}</li>` : ''}
                </ul>
                <p>Общее время строительства: <strong>${scenario.time} лет</strong></p>
                <p>Полученная прибыль: <strong>${scenario.profit} млн. руб.</strong></p>
            </div>
        `;
    },
    
    // Экспорт данных
    exportData: function(format) {
        const a = parseInt(document.getElementById('a').value);
        const b = parseInt(document.getElementById('b').value);
        const n = parseInt(document.getElementById('n').value);
        const r = parseInt(document.getElementById('r').value);
        
        let content = `Расчет использования резервных средств для ускорения строительства завода\n\n`;
        content += `Исходные данные:\n`;
        content += `- Этап A (Строительство корпусов): ${a} лет\n`;
        content += `- Этап B (Разработка модели изделия): ${b} лет\n`;
        content += `- Базовое время для этапов C, D, E (n): ${n}\n`;
        content += `- Резервные средства R: ${r} млн. руб.\n\n`;
        
        content += `Таблица прибыли:\n`;
        for (let i = 0; i < 5; i++) {
            const time = this.minTime + i;
            content += `- ${time} лет: ${this.profitTable[time]} млн. руб.\n`;
        }
        
        content += `\nАнализ по принципам принятия решений:\n`;
        
        const mostLikelyTimeWithout = this.findMostLikelyTime(this.timeScenarios);
        const mostLikelyTimeWith = this.findMostLikelyTime(this.timeScenariosWithReserve);
        const expectedProfitWithout = this.calculateExpectedProfit(this.timeScenarios);
        const expectedProfitWith = this.calculateExpectedProfit(this.timeScenariosWithReserve);
        const minProfitWithout = this.calculateMinProfit(this.timeScenarios);
        const minProfitWith = this.calculateMinProfit(this.timeScenariosWithReserve);
        
        content += this.generateExportContent(
            mostLikelyTimeWithout, mostLikelyTimeWith,
            expectedProfitWithout, expectedProfitWith,
            minProfitWithout, minProfitWith,
            format
        );
        
        const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'text/plain' });
        const url = URL.createObjectURL(blob);
        const aElement = document.createElement('a');
        aElement.href = url;
        aElement.download = `расчет_резервных_средств.${format}`;
        aElement.click();
        URL.revokeObjectURL(url);
    },
    
    // Генерация содержимого для экспорта
    generateExportContent: function(mlWithout, mlWith, expWithout, expWith, minWithout, minWith, format) {
        let content = `1. Принцип максимального правдоподобия:\n`;
        content += `   Без резерва: ${mlWithout.time} лет (${mlWithout.probability}%, ${mlWithout.avgProfit} млн. руб.)\n`;
        content += `   С резервом: ${mlWith.time} лет (${mlWith.probability}%, ${mlWith.avgProfit} млн. руб.)\n`;
        content += `   Рекомендация: ${mlWith.avgProfit > mlWithout.avgProfit ? 'Использовать' : 'Не использовать'}\n\n`;
        
        content += `2. Принцип среднего:\n`;
        content += `   Без резерва: ${expWithout.toFixed(2)} млн. руб.\n`;
        content += `   С резервом: ${expWith.toFixed(2)} млн. руб.\n`;
        content += `   Рекомендация: ${expWith > expWithout ? 'Использовать' : 'Не использовать'}\n\n`;
        
        content += `3. Принцип гарантированных оценок:\n`;
        content += `   Без резерва: ${minWithout} млн. руб.\n`;
        content += `   С резервом: ${minWith} млн. руб.\n`;
        content += `   Рекомендация: ${minWith > minWithout ? 'Использовать' : 'Не использовать'}\n`;
        
        if (format === 'csv') {
            content = content.replace(/:/g, ',').replace(/- /g, '');
        }
        
        return content;
    },
    
    // Сохранение данных в data.json
    saveData: function() {
        const data = {
            defaultValues: {
                a: parseInt(document.getElementById('a').value),
                b: parseInt(document.getElementById('b').value),
                n: parseInt(document.getElementById('n').value),
                r: parseInt(document.getElementById('r').value),
                profits: []
            },
            calculations: {
                totalScenarios: this.timeScenarios.length || 27,
                timeRange: this.minTime ? [this.minTime, this.minTime + 4] : [5, 9]
            }
        };
        
        // Сохранение таблицы прибыли
        for (let i = 0; i < 5; i++) {
            const time = this.minTime + i;
            const profit = parseInt(document.getElementById(`profit-${time}`).value);
            data.defaultValues.profits.push(profit);
        }
        
        // Отправка данных на сервер (в реальном проекте)
        // Для демонстрации просто выводим в консоль
        console.log('Данные для сохранения:', JSON.stringify(data, null, 2));
        
        // В реальном проекте здесь был бы fetch запрос к серверу
        // fetch('/api/save-data', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(data)
        // });
    },
    
    // Загрузка данных из data.json
    loadData: function() {
        // В реальном проекте здесь был бы fetch запрос
        // fetch('/api/load-data')
        //     .then(response => response.json())
        //     .then(data => this.applyLoadedData(data));
        
        // Для демонстрации используем данные из файла
        fetch('./data.json')
            .then(response => response.json())
            .then(data => this.applyLoadedData(data))
            .catch(error => {
                console.log('Не удалось загрузить данные, используются значения по умолчанию');
                this.applyLoadedData({
                    defaultValues: {
                        a: 3, b: 1, n: 2, r: 20,
                        profits: [150, 130, 100, 70, 40]
                    }
                });
            });
    },
    
    // Применение загруженных данных
    applyLoadedData: function(data) {
        if (data.defaultValues) {
            document.getElementById('a').value = data.defaultValues.a || 3;
            document.getElementById('b').value = data.defaultValues.b || 1;
            document.getElementById('n').value = data.defaultValues.n || 2;
            document.getElementById('r').value = data.defaultValues.r || 20;
            
            // Сохраняем данные о прибыли для последующего использования
            this.savedProfits = data.defaultValues.profits || [150, 130, 100, 70, 40];
        }
    },
    
    // Создание диаграмм
    createCharts: function() {
        this.createTimeDistributionChart();
        //this.createProfitComparisonChart();
        this.createPrinciplesChart();
    },
    
    // Диаграмма распределения времени
    createTimeDistributionChart: function() {
        const ctx = document.getElementById('timeDistributionChart').getContext('2d');
        
        const timeStats = this.calculateTimeStats(this.timeScenarios);
        const timeStatsWithReserve = this.calculateTimeStats(this.timeScenariosWithReserve);
        
        const times = Object.keys(timeStats).sort((a, b) => parseInt(a) - parseInt(b));
        const probabilitiesWithout = times.map(time => (timeStats[time].count / this.timeScenarios.length * 100).toFixed(2));
        const probabilitiesWith = times.map(time => (timeStatsWithReserve[time] ? timeStatsWithReserve[time].count / this.timeScenariosWithReserve.length * 100 : 0).toFixed(2));
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: times.map(t => `${t} лет`),
                datasets: [{
                    label: 'Без резерва (%)',
                    data: probabilitiesWithout,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }, {
                    label: 'С резервом (%)',
                    data: probabilitiesWith,
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Распределение вероятностей времени завершения'
                    },
                    legend: {
                        display: true
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Вероятность (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Время завершения'
                        }
                    }
                }
            }
        });
    },
    
    /*/ Диаграмма сравнения прибыли
    createProfitComparisonChart: function() {
        const ctx = document.getElementById('profitComparisonChart').getContext('2d');
        
        const timeStats = this.calculateTimeStats(this.timeScenarios);
        const timeStatsWithReserve = this.calculateTimeStats(this.timeScenariosWithReserve);
        
        const times = Object.keys(timeStats).sort((a, b) => parseInt(a) - parseInt(b));
        const avgProfitWithout = times.map(time => (timeStats[time].totalProfit / timeStats[time].count).toFixed(2));
        const avgProfitWith = times.map(time => (timeStatsWithReserve[time] ? timeStatsWithReserve[time].totalProfit / timeStatsWithReserve[time].count : 0).toFixed(2));
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: times.map(t => `${t} лет`),
                datasets: [{
                    label: 'Без резерва (млн. руб.)',
                    data: avgProfitWithout,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    tension: 0.1,
                    fill: false
                }, {
                    label: 'С резервом (млн. руб.)',
                    data: avgProfitWith,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    tension: 0.1,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Сравнение средней прибыли по времени'
                    },
                    legend: {
                        display: true
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Средняя прибыль (млн. руб.)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Время завершения'
                        }
                    }
                }
            }
        });
    },*/
    
    // Диаграмма принципов принятия решений
    createPrinciplesChart: function() {
        const ctx = document.getElementById('principlesChart').getContext('2d');
        
        const mostLikelyTimeWithout = this.findMostLikelyTime(this.timeScenarios);
        const mostLikelyTimeWith = this.findMostLikelyTime(this.timeScenariosWithReserve);
        const expectedProfitWithout = this.calculateExpectedProfit(this.timeScenarios);
        const expectedProfitWith = this.calculateExpectedProfit(this.timeScenariosWithReserve);
        const minProfitWithout = this.calculateMinProfit(this.timeScenarios);
        const minProfitWith = this.calculateMinProfit(this.timeScenariosWithReserve);
        
        new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Макс. правдоподобие', 'Ожидаемая прибыль', 'Минимальный риск'],
                datasets: [{
                    label: 'Без резерва',
                    data: [
                        parseFloat(mostLikelyTimeWithout.avgProfit),
                        expectedProfitWithout,
                        minProfitWithout
                    ],
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    pointBackgroundColor: 'rgba(54, 162, 235, 1)'
                }, {
                    label: 'С резервом',
                    data: [
                        parseFloat(mostLikelyTimeWith.avgProfit),
                        expectedProfitWith,
                        minProfitWith
                    ],
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    pointBackgroundColor: 'rgba(255, 99, 132, 1)'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Сравнение по принципам принятия решений'
                    },
                    legend: {
                        display: true
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Прибыль (млн. руб.)'
                        }
                    }
                }
            }
        });
    }
};

// Инициализация приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    app.init();
});