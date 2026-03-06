const HAL_SCHEMA_FORMS_ACCEPT = 'application/hal+json;profile="https://github.com/jbadeau/hal-schema-forms"';
export async function fetchHalSchemaForms(url) {
    const response = await fetch(url, {
        headers: { Accept: HAL_SCHEMA_FORMS_ACCEPT },
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch hal-schema-forms from ${url}: ${response.status}`);
    }
    return response.json();
}
export async function sendHalSchemaForms(url, method, body) {
    const response = await fetch(url, {
        method,
        headers: {
            "Content-Type": "application/json",
            Accept: HAL_SCHEMA_FORMS_ACCEPT,
        },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        throw new Error(`Failed to ${method} hal-schema-forms to ${url}: ${response.status}`);
    }
    return response.json();
}
export async function postHalSchemaForms(url, body) {
    return sendHalSchemaForms(url, "POST", body);
}
export function esc(s) {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
