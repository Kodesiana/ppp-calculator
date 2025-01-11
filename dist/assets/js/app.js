/*
   Copyright 2025 Fahmi Noor Fiqri

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

document.addEventListener('alpine:init', () => {
    Alpine.data('pppapp', () => ({
        years: [],
        ticks: {},

        selectionYears: [],
        selectionCountries: [],

        originCountry: '',
        targetCountry: '',
        salary: 0,
        year: 2023,
        salaryInput: '',

        chart: null,

        get originSalary() {
            const originData = this.ticks[this.originCountry];
            const formatter = new Intl.NumberFormat(originData.locale, {
                style: 'currency',
                currency: originData.currency,
            });

            return formatter.format(this.salary);
        },

        get computedSalary() {
            if (this.salary == 0) return '';

            const originData = this.ticks[this.originCountry];
            const targetData = this.ticks[this.targetCountry];

            const yearIndex = this.years.indexOf(this.year);
            const equivalentSalary =
                (this.salary / originData.ppp[yearIndex]) *
                targetData.ppp[yearIndex];

            const formatter = new Intl.NumberFormat(targetData.locale, {
                style: 'currency',
                currency: targetData.currency,
            });
            return formatter.format(equivalentSalary);
        },

        async init() {
            const res = await fetch('./assets/data/data.json');
            const dataset = await res.json();

            this.years = dataset.years;
            this.ticks = dataset.ticks;
            this.selectionYears = [...this.years]
                .reverse()
                .map((x) => ({ value: x, label: x }));
            this.selectionCountries = Object.entries(this.ticks)
                .map(([k, v]) => ({ value: k, label: v.country }))
                .sort((a, b) => a.label.localeCompare(b.label));

            this.originCountry = this.selectionCountries[0].value;
            this.targetCountry = this.selectionCountries[0].value;

            const systemSettingDark = window.matchMedia(
                '(prefers-color-scheme: dark)'
            ).matches;
            document.documentElement.setAttribute(
                'data-theme',
                systemSettingDark ? 'dark' : 'light'
            );

            this.renderChart();
            this.$watch('originCountry', () => this.updateChart());
            this.$watch('targetCountry', () => this.updateChart());

            this.$watch('salaryInput', (value) => {
                this.salary = Number(value.replaceAll(' ', ''));
            });
        },

        toggleDarkMode() {
            const currentTheme =
                document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            document.documentElement.setAttribute('data-theme', newTheme);
            this.chart.updateOptions({
                theme: {
                    mode: newTheme,
                },
            });
        },

        renderChart() {
            const currentTheme =
                document.documentElement.getAttribute('data-theme');
            const options = {
                labels: [...this.years],
                series: [
                    {
                        name: 'Negara Asal',
                        data: [...this.ticks[this.originCountry].ppp],
                    },
                    {
                        name: 'Negara Tujuan',
                        data: [...this.ticks[this.targetCountry].ppp],
                    },
                ],
                theme: {
                    mode: currentTheme,
                },
                dataLabels: {
                    enabled: false,
                },
                chart: {
                    type: 'area',
                    height: 350,
                },
                title: {
                    text: 'PPP conversion factor, GDP (LCU per international $)',
                    align: 'left',
                },
                subtitle: {
                    text: 'International Comparison Program, World Bank | World Development Indicators database, World Bank | Eurostat-OECD PPP Programme.',
                    align: 'left',
                },
                xaxis: {
                    type: 'datetime',
                    labels: {
                        formatter: (val) => Math.round(val).toString(),
                    },
                },
                yaxis: {
                    opposite: true,
                    labels: {
                        formatter: (val) => val.toFixed(2),
                    },
                },
                legend: {
                    horizontalAlign: 'left',
                },
            };

            this.chart = new ApexCharts(
                document.querySelector('#ppp-history-chart'),
                options
            );
            this.chart.render();
        },

        updateChart() {
            const origin = [...this.ticks[this.originCountry].ppp];
            const target = [...this.ticks[this.targetCountry].ppp];

            this.chart.updateSeries([
                {
                    name: 'Negara Asal',
                    data: origin,
                },
                {
                    name: 'Negara Tujuan',
                    data: target,
                },
            ]);
        },
    }));
});
