import type { HalSchemaFormsResource } from "../hal-schema-forms/types.js";

const HAL_SCHEMA_FORMS_ACCEPT =
  'application/hal+json;profile="https://github.com/jbadeau/hal-schema-forms"';

export async function fetchHalSchemaForms(
  url: string
): Promise<HalSchemaFormsResource> {
  const response = await fetch(url, {
    headers: { Accept: HAL_SCHEMA_FORMS_ACCEPT },
  });
  if (!response.ok) {
    throw new Error(
      `Failed to fetch hal-schema-forms from ${url}: ${response.status}`
    );
  }
  return response.json() as Promise<HalSchemaFormsResource>;
}

export async function sendHalSchemaForms(
  url: string,
  method: string,
  body: unknown
): Promise<HalSchemaFormsResource> {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: HAL_SCHEMA_FORMS_ACCEPT,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(
      `Failed to ${method} hal-schema-forms to ${url}: ${response.status}`
    );
  }
  return response.json() as Promise<HalSchemaFormsResource>;
}

export async function postHalSchemaForms(
  url: string,
  body: unknown
): Promise<HalSchemaFormsResource> {
  return sendHalSchemaForms(url, "POST", body);
}

export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
