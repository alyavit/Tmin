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
        this.generateProfitTableInputs();
    },
    
    // Настройка обработчиков событий
    setupEventListeners: function() {
        document.getElementById('n').addEventListener('change', () => this.generateProfitTableInputs());
        document.getElementById('a').addEventListener('change', () => this.generateProfitTableInputs());
        document.getElementById('b').addEventListener('change', () => this.generateProfitTableInputs());
        
        document.getElementById('calculate-btn').addEventListener('click', () => this.calculate());
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
            
            // Установка значений по умолчанию
            const defaultValues = [150, 130, 100, 70, 40];
            input.value = defaultValues[i];
            
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
        for (let c = n; c <= n + 2; c++) {
            for (let d = n; d <= n + 2; d++) {
                for (let e = n; e <= n + 2; e++) {
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
        
        for (let c = n; c <= n + 2; c++) {
            for (let d = n; d <= n + 2; d++) {
                for (let e = n; e <= n + 2; e++) {
                    // Пробуем ускорить каждый из этапов
                    const scenarios = [];
                    
                    scenarios.push({
                        accelerated: 'C',
                        time: Math.max(a + d, Math.max(c - 1, n), b + e),
                        profit: (this.profitTable[Math.max(a + d, Math.max(c - 1, n), b + e)] || 0) - r
                    });
                    
                    scenarios.push({
                        accelerated: 'D',
                        time: Math.max(a + Math.max(d - 1, n), c, b + e),
                        profit: (this.profitTable[Math.max(a + Math.max(d - 1, n), c, b + e)] || 0) - r
                    });
                    
                    scenarios.push({
                        accelerated: 'E',
                        time: Math.max(a + d, c, b + Math.max(e - 1, n)),
                        profit: (this.profitTable[Math.max(a + d, c, b + Math.max(e - 1, n))] || 0) - r
                    });
                    
                    // Находим лучший вариант ускорения
                    const bestScenario = scenarios.reduce((best, current) => 
                        current.time < best.time ? current : best
                    );
                    
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
            avgProfit: (timeProfits[mostLikelyTime] / maxCount).toFixed(2)
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
    }
};

// Инициализация приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    app.init();
});