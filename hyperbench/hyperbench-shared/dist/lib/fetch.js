const HAL_SCHEMA_FORMS_ACCEPT = 'application/hal+json;profile="https://github.com/jbadeau/hal-schema-forms"';
export async function fetchHalSchemaForms(url, extraHeaders) {
    const response = await fetch(url, {
        headers: { Accept: HAL_SCHEMA_FORMS_ACCEPT, ...extraHeaders },
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch hal-schema-forms from ${url}: ${response.status}`);
    }
    return response.json();
}
export async function sendHalSchemaForms(url, method, body, extraHeaders) {
    const response = await fetch(url, {
        method,
        headers: {
            "Content-Type": "application/json",
            Accept: HAL_SCHEMA_FORMS_ACCEPT,
            ...extraHeaders,
        },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        throw new Error(`Failed to ${method} hal-schema-forms to ${url}: ${response.status}`);
    }
    return response.json();
}
export async function postHalSchemaForms(url, body, extraHeaders) {
    return sendHalSchemaForms(url, "POST", body, extraHeaders);
}
export function extractContextHeaders(req) {
    const result = {};
    for (const [key, value] of Object.entries(req.headers)) {
        if (key.toLowerCase().startsWith("x-context-") &&
            typeof value === "string") {
            const suffix = key.slice("x-context-".length);
            result["X-Context-" + suffix.charAt(0).toUpperCase() + suffix.slice(1)] =
                value;
        }
    }
    return result;
}
export function esc(s) {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
