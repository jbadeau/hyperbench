import type { RJSFSchema } from '@rjsf/utils';
import { HalFormsTemplate, HalFormsProperty } from './types';

export interface MappedForm {
  schema: RJSFSchema;
  uiSchema: Record<string, any>;
  formData: Record<string, unknown>;
}

function mapPropertyType(prop: HalFormsProperty): Partial<RJSFSchema> {
  const halType = (prop.type ?? 'text').toLowerCase();

  // If the property has inline options, it's an enum
  if (prop.options?.inline && prop.options.inline.length > 0) {
    return {
      type: 'string',
      oneOf: prop.options.inline.map((opt) => ({
        const: opt.value,
        title: opt.prompt,
      })),
    };
  }

  switch (halType) {
    case 'number':
    case 'integer':
      return { type: 'integer' };
    case 'range':
      return { type: 'number' };
    case 'email':
      return { type: 'string', format: 'email' };
    case 'url':
    case 'uri':
      return { type: 'string', format: 'uri' };
    case 'date':
      return { type: 'string', format: 'date' };
    case 'datetime-local':
      return { type: 'string', format: 'date-time' };
    case 'textarea':
      return { type: 'string' };
    case 'checkbox':
    case 'bool':
    case 'boolean':
      return { type: 'boolean' };
    case 'hidden':
    case 'text':
    default:
      return { type: 'string' };
  }
}

function mapPropertyConstraints(prop: HalFormsProperty): Partial<RJSFSchema> {
  const constraints: Partial<RJSFSchema> = {};

  if (prop.regex) {
    constraints.pattern = prop.regex;
  }
  if (prop.min !== undefined) {
    constraints.minimum = prop.min;
  }
  if (prop.max !== undefined) {
    constraints.maximum = prop.max;
  }
  if (prop.minLength !== undefined) {
    constraints.minLength = prop.minLength;
  }
  if (prop.maxLength !== undefined) {
    constraints.maxLength = prop.maxLength;
  }

  return constraints;
}

function mapPropertyUiSchema(prop: HalFormsProperty): Record<string, any> {
  const ui: Record<string, any> = {};
  const halType = (prop.type ?? 'text').toLowerCase();

  if (prop.placeholder) {
    ui['ui:placeholder'] = prop.placeholder;
  }

  if (prop.readOnly) {
    ui['ui:readonly'] = true;
  }

  if (halType === 'textarea') {
    ui['ui:widget'] = 'textarea';
  }

  if (halType === 'hidden') {
    ui['ui:widget'] = 'hidden';
  }

  if (halType === 'range') {
    ui['ui:widget'] = 'range';
  }

  return ui;
}

export function halFormsToJsonSchema(template: HalFormsTemplate): MappedForm {
  const properties: Record<string, RJSFSchema> = {};
  const required: string[] = [];
  const uiSchema: Record<string, any> = {};
  const formData: Record<string, unknown> = {};

  for (const prop of template.properties) {
    const typeDef = mapPropertyType(prop);
    const constraints = mapPropertyConstraints(prop);

    properties[prop.name] = {
      ...typeDef,
      ...constraints,
      ...(prop.prompt ? { title: prop.prompt } : {}),
    };

    if (prop.required) {
      required.push(prop.name);
    }

    const propUi = mapPropertyUiSchema(prop);
    if (Object.keys(propUi).length > 0) {
      uiSchema[prop.name] = propUi;
    }

    if (prop.value !== undefined) {
      formData[prop.name] = prop.value;
    }
  }

  const schema: RJSFSchema = {
    type: 'object',
    properties,
    ...(required.length > 0 ? { required } : {}),
    ...(template.title ? { title: template.title } : {}),
  };

  return { schema, uiSchema, formData };
}
