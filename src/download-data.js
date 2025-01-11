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

import fs from 'fs/promises';

import zip from 'jszip';
import Papa from 'papaparse';

// returns: {Alpha-3 Code: {country, currency_code}}
async function getWorldCurrency() {
    const contents = await fs.readFile('./country.txt', 'utf8');
    const parsed = Papa.parse(contents, {
        delimiter: '\t',
        header: true,
    });

    const transformed = parsed.data.reduce((prev, current) => {
        if (!current['Alpha-3 Code']) {
            return prev;
        }

        prev[current['Alpha-3 Code']] = {
            locale: current['Alpha-2 Code'],
            currency: current['Currency'],
        };

        return prev;
    }, {});

    return transformed;
}

// returns: Array{}
async function getWorldBankData() {
    const res = await fetch(
        'https://api.worldbank.org/v2/en/indicator/PA.NUS.PPP?downloadformat=csv'
    );

    if (!res.ok) {
        console.error(
            'Failed to fetch World Bank data! Status:',
            res.statusText
        );
        return null;
    }

    const body = await res.arrayBuffer();
    const zipFile = await zip.loadAsync(body);

    let contents = '';
    for (const zipEntry in zipFile.files) {
        if (zipEntry.startsWith('API')) {
            contents = await zipFile.files[zipEntry].async('string');
            break;
        }
    }

    if (!contents) {
        console.error('Failed to read API data!');
        return null;
    }

    const parsed = Papa.parse(contents, {
        skipEmptyLines: true,
        skipFirstNLines: 4,
        header: true,
        transform: (value, column) => {
            if (column.includes('Code') || column.includes('Name')) {
                return value;
            }

            const val = Number.parseFloat(value);
            if (Number.isNaN(val)) {
                return 0;
            }

            return val;
        },
    });

    return parsed.data;
}

(async () => {
    const currencyData = await getWorldCurrency();
    if (!currencyData) {
        return;
    }

    const pppData = await getWorldBankData();
    if (!pppData) {
        return;
    }

    const years = Object.keys(pppData[0])
        .filter((x) => !x.includes(' '))
        .map(Number)
        .filter((x) => x > 0);

    const ticks = pppData.reduce((prev, current) => {
        if (!currencyData[current['Country Code']]) {
            console.log(
                `SKIP: ${current['Country Code']} - ${current['Country Name']}`
            );
            return prev;
        }

        prev[current['Country Code']] = {
            country: current['Country Name'],
            locale: currencyData[current['Country Code']].locale,
            currency: currencyData[current['Country Code']].currency,
            ppp: years.map((year) => current[year]),
        };

        return prev;
    }, {});

    await fs.writeFile('./data.json', JSON.stringify({ years, ticks }));
})();
