(function () {
    const COMPONENT_EVENT = 'componentsLoaded';

    function injectMarkup(target, markup) {
        target.innerHTML = markup;
    }

    function renderError(target, componentName, error) {
        console.error(`Failed to load component "${componentName}":`, error);
        target.innerHTML = `<div class="component-error">Unable to load component: ${componentName}</div>`;
    }

    async function loadComponent(target) {
        const componentName = target.getAttribute('data-component');
        if (!componentName) {
            return;
        }

        try {
            const response = await fetch(`components/${componentName}.html`, { cache: 'no-cache' });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const markup = await response.text();
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
