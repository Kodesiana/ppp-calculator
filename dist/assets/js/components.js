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

class SelectComponent extends HTMLElement {
    constructor() {
        super();
        this.label = '';
        this.valueKey = '';
        this.itemsKey = '';
        this.modelModifier = '';

        this.attributeMap = {
            label: 'label',
            'value-key': 'valueKey',
            'items-key': 'itemsKey',
            'model-modifier': 'modelModifier',
        };
    }

    static get observedAttributes() {
        return ['label', 'value-key', 'items-key', 'model-modifier'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        this[this.attributeMap[name]] = newValue;
        this.render();
    }

    connectedCallback() {
        this.render();
    }

    render() {
        if (this.label === '' || this.itemsKey === '' || this.valueKey === '') {
            return;
        }

        this.innerHTML = `
        <div class="field">
            <label class="label">${this.label}</label>
            <div class="control">
                <div class="select">
                    <select x-model${this.modelModifier}="${this.valueKey}">
                        <template x-for="item in ${this.itemsKey}" :key="item.value">
                            <option x-bind:value="item.value" x-bind:selected="item.value == ${this.valueKey}" x-text="item.label">
                            </option>
                        </template>
                    </select>
                </div>
            </div>
        </div>
        `;
    }
}

customElements.define('custom-select', SelectComponent);
