import { createRoot, Root } from 'react-dom/client';
import { createElement } from 'react';
import HalFormsWidget from './components/HalFormsWidget';

const components: Record<string, React.ComponentType<Record<string, unknown>>> = {
  HalFormsWidget: HalFormsWidget as unknown as React.ComponentType<Record<string, unknown>>,
};

const mountedRoots = new Map<Element, Root>();

function mountIslands() {
  const islands = document.querySelectorAll('.react-island');

  islands.forEach((el) => {
    // Skip already-mounted islands
    if (mountedRoots.has(el)) return;

    const componentName = el.getAttribute('data-component');
    if (!componentName || !components[componentName]) {
      console.warn(`Unknown react-island component: ${componentName}`);
      return;
    }

    const Component = components[componentName];
    const props: Record<string, unknown> = {};

    // Map data attributes to props
    const halFormsUrl = el.getAttribute('data-hal-forms-url');
    if (halFormsUrl) props.halFormsUrl = halFormsUrl;

    const mode = el.getAttribute('data-mode');
    if (mode) props.mode = mode;

    const taskId = el.getAttribute('data-task-id');
    if (taskId) props.taskId = taskId;

    const root = createRoot(el);
    root.render(createElement(Component, props));
    mountedRoots.set(el, root);
  });
}

function unmountStaleIslands() {
  mountedRoots.forEach((root, el) => {
    if (!document.contains(el)) {
      root.unmount();
      mountedRoots.delete(el);
    }
  });
}

// Mount on initial load
document.addEventListener('DOMContentLoaded', mountIslands);

// Re-mount after HTMX swaps
document.addEventListener('htmx:afterSettle', () => {
  unmountStaleIslands();
  mountIslands();
});

// Handle custom navigation events from React components
document.addEventListener('navigate-fragment', ((e: CustomEvent<{ url: string }>) => {
  const htmx = (window as unknown as Record<string, unknown>).htmx as {
    ajax: (method: string, url: string, options: Record<string, unknown>) => void;
  };
  htmx.ajax('GET', e.detail.url, { target: '#content', swap: 'innerHTML' });
}) as EventListener);
