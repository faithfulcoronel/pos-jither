(function () {
    const COMPONENT_EVENT = 'componentsLoaded';

    const FALLBACK_TEMPLATES = window.COMPONENT_TEMPLATES || {};
    const IS_FILE_PROTOCOL = window.location.protocol === 'file:';

    function injectMarkup(target, markup) {
        target.innerHTML = markup;
    }

    function renderError(target, componentName, error) {
        console.error(`Failed to load component "${componentName}":`, error);
        target.innerHTML = `<div class="component-error">Unable to load component: ${componentName}</div>`;
    }
  
    function getFallbackMarkup(componentName) {
        return FALLBACK_TEMPLATES[componentName] || null;
    }

    async function fetchComponentMarkup(componentName) {
        if (IS_FILE_PROTOCOL) {
            return getFallbackMarkup(componentName);
        }

        const response = await fetch(`components/${componentName}.html`, { cache: 'no-cache' });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return response.text();
    }

    async function loadComponent(target) {
        const componentName = target.getAttribute('data-component');
        if (!componentName) {
            return;
        }

        try {
            const markup = await fetchComponentMarkup(componentName);
            if (markup) {
                injectMarkup(target, markup);
                return;
            }

            const fallbackMarkup = getFallbackMarkup(componentName);
            if (fallbackMarkup) {
                injectMarkup(target, fallbackMarkup);
                return;
            }

            throw new Error('No markup available');
        } catch (error) {
            const fallbackMarkup = getFallbackMarkup(componentName);
            if (fallbackMarkup) {
                injectMarkup(target, fallbackMarkup);
                return;
            }

            renderError(target, componentName, error);
        }
    }

    document.addEventListener('DOMContentLoaded', async () => {
        const placeholders = Array.from(document.querySelectorAll('[data-component]'));
        await Promise.all(placeholders.map(loadComponent));
        document.dispatchEvent(new Event(COMPONENT_EVENT));
    });
})();
