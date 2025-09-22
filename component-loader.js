(function () {
    const COMPONENT_EVENT = 'componentsLoaded';
    const COMPONENTS_DIR = 'components';

    function injectMarkup(target, markup) {
        target.innerHTML = markup;
    }

    function renderError(target, componentName, error) {
        console.error(`Failed to load component "${componentName}":`, error);
        target.innerHTML = `<div class="component-error">Unable to load component: ${componentName}</div>`;
    }

    function buildComponentUrl(componentName) {
        return new URL(`${COMPONENTS_DIR}/${componentName}.html`, window.location.href).toString();
    }

    function fetchComponentViaXHR(url) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.overrideMimeType('text/html');
            xhr.onload = () => {
                if (xhr.status === 0 || (xhr.status >= 200 && xhr.status < 300)) {
                    resolve(xhr.responseText);
                } else {
                    reject(new Error(`HTTP ${xhr.status}`));
                }
            };
            xhr.onerror = () => reject(new Error('Network error'));
            xhr.send();
        });
    }

    async function fetchComponentMarkup(componentName) {
        const url = buildComponentUrl(componentName);

        try {
            const response = await fetch(url, { cache: 'no-cache' });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.text();
        } catch (error) {
            if (url.startsWith('file://')) {
                return fetchComponentViaXHR(url);
            }

            throw error;
        }
    }

    async function loadComponent(target) {
        const componentName = target.getAttribute('data-component');
        if (!componentName) {
            return;
        }

        try {
            const markup = await fetchComponentMarkup(componentName);
            injectMarkup(target, markup);
        } catch (error) {
            renderError(target, componentName, error);
        }
    }

    document.addEventListener('DOMContentLoaded', async () => {
        const placeholders = Array.from(document.querySelectorAll('[data-component]'));
        await Promise.all(placeholders.map(loadComponent));
        document.dispatchEvent(new Event(COMPONENT_EVENT));
    });
})();
