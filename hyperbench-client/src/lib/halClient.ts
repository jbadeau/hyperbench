import { HalResource } from './types';

const HAL_FORMS_MEDIA_TYPE = 'application/prs.hal-forms+json';

export async function fetchHalResource(url: string): Promise<HalResource> {
  const response = await fetch(url, {
    headers: {
      Accept: HAL_FORMS_MEDIA_TYPE,
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function submitHalForm(
  url: string,
  method: string,
  data: Record<string, unknown>
): Promise<Response> {
  return fetch(url, {
    method: method.toUpperCase(),
    headers: {
      'Content-Type': 'application/json',
      Accept: HAL_FORMS_MEDIA_TYPE,
    },
    body: JSON.stringify(data),
  });
}
