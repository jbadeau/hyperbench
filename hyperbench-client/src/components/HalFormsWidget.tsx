import { useEffect, useState } from 'react';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import type { RJSFSchema } from '@rjsf/utils';
import { fetchHalResource, submitHalForm } from '../lib/halClient';
import { halFormsToJsonSchema } from '../lib/halFormsToJsonSchema';

interface HalFormsWidgetProps {
  halFormsUrl: string;
  mode: 'form' | 'list';
  taskId?: string;
}

interface TaskItem {
  id: number;
  title: string;
  status: string;
  priority: number;
  _links: { self: { href: string } };
}

function TaskList({ halFormsUrl }: { halFormsUrl: string }) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = async () => {
    try {
      const resource = await fetchHalResource(halFormsUrl);
      const embedded = resource._embedded?.tasks ?? [];
      setTasks(embedded as unknown as TaskItem[]);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [halFormsUrl]);

  const handleDelete = async (selfHref: string) => {
    if (!confirm('Delete this task?')) return;
    await fetch(selfHref, { method: 'DELETE' });
    loadTasks();
  };

  if (loading) return <p className="loading">Loading tasks...</p>;

  if (tasks.length === 0) {
    return <p className="empty-state">No tasks yet. Create one!</p>;
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <li key={task.id} className="task-item">
          <div>
            <span className="task-title">{task.title}</span>
            <div className="task-meta">
              <span className={`badge badge-${task.status.toLowerCase().replace('_', '-')}`}>
                {task.status}
              </span>
              <span>Priority: {task.priority}</span>
            </div>
          </div>
          <div className="actions">
            <button
              className="btn"
              onClick={() => {
                document.dispatchEvent(
                  new CustomEvent('navigate-fragment', {
                    detail: { url: `/fragments/task-form/${task.id}` },
                  })
                );
              }}
            >
              Edit
            </button>
            <button
              className="btn btn-danger"
              onClick={() => handleDelete(task._links.self.href)}
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function TaskForm({ halFormsUrl, taskId }: { halFormsUrl: string; taskId?: string }) {
  const [schema, setSchema] = useState<RJSFSchema | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [uiSchema, setUiSchema] = useState<Record<string, any>>({});
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resourceUrl = taskId ? `${halFormsUrl}/${taskId}` : halFormsUrl;

  useEffect(() => {
    const load = async () => {
      try {
        const resource = await fetchHalResource(resourceUrl);
        const templates = resource._templates;
        if (!templates) {
          setError('No _templates found in HAL-FORMS response');
          return;
        }

        const templateKey = taskId ? 'default' : 'default';
        const template = templates[templateKey];
        if (!template) {
          setError(`Template "${templateKey}" not found`);
          return;
        }

        const mapped = halFormsToJsonSchema(template);
        setSchema(mapped.schema);
        setUiSchema(mapped.uiSchema);

        // For edit mode, populate form data from resource
        if (taskId) {
          const data: Record<string, unknown> = {};
          for (const prop of template.properties) {
            if (resource[prop.name] !== undefined) {
              data[prop.name] = resource[prop.name];
            }
          }
          setFormData(data);
        } else {
          setFormData(mapped.formData);
        }
      } catch (err) {
        setError(String(err));
      }
    };
    load();
  }, [resourceUrl, taskId]);

  const handleSubmit = async ({ formData: data }: { formData?: Record<string, unknown> }) => {
    if (!data) return;
    setSubmitting(true);
    setError(null);
    try {
      const method = taskId ? 'PUT' : 'POST';
      const url = taskId ? `${halFormsUrl}/${taskId}` : halFormsUrl;
      const response = await submitHalForm(url, method, data);
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Submit failed: ${response.status} ${body}`);
      }
      // Navigate back to task list
      const content = document.getElementById('content');
      if (content) {
        const htmx = (window as unknown as Record<string, unknown>).htmx as {
          ajax: (method: string, url: string, options: Record<string, unknown>) => void;
        };
        htmx.ajax('GET', '/fragments/task-list', { target: '#content', swap: 'innerHTML' });
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (error) return <p className="text-danger">{error}</p>;
  if (!schema) return <p className="loading">Loading form...</p>;

  return (
    <Form
      schema={schema}
      uiSchema={uiSchema as any}
      formData={formData}
      validator={validator as any}
      onSubmit={handleSubmit as any}
      disabled={submitting}
    />
  );
}

export default function HalFormsWidget({ halFormsUrl, mode, taskId }: HalFormsWidgetProps) {
  if (mode === 'list') {
    return <TaskList halFormsUrl={halFormsUrl} />;
  }
  return <TaskForm halFormsUrl={halFormsUrl} taskId={taskId} />;
}
