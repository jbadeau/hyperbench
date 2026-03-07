package com.hyperbench.todos.controller;

import com.hyperbench.halschemaforms.model.FormsRepresentationModel;
import com.hyperbench.halschemaforms.schema.FormBuilder;
import com.hyperbench.halschemaforms.schema.JsonSchemaBuilder;
import com.hyperbench.todos.domain.Task;
import com.hyperbench.todos.repository.TaskRepository;
import org.springframework.hateoas.Link;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;

import static com.hyperbench.halschemaforms.schema.JsonSchemaBuilder.option;

@RestController
@RequestMapping("/ui")
public class UiSpecController {

    private final TaskRepository taskRepository;

    public UiSpecController(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    @GetMapping("/tasks")
    public FormsRepresentationModel taskList() {
        List<Task> tasks = taskRepository.findAll();

        List<Map<String, Object>> items = new ArrayList<>();
        for (Task task : tasks) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", task.getId());
            item.put("title", nullSafe(task.getTitle()));
            item.put("status", task.getStatus() != null ? task.getStatus().name() : "");
            item.put("priority", task.getPriority() != null ? task.getPriority().toString() : "");
            item.put("category", nullSafe(task.getCategory()));
            item.put("clientName", nullSafe(task.getClientName()));
            item.put("dueDate", nullSafe(task.getDueDate()));
            item.put("assignedTo", nullSafe(task.getAssignedTo()));
            item.put("editUrl", "/fragments/todos/" + task.getId() + "/edit");
            item.put("deleteUrl", "/api/tasks/" + task.getId());
            items.add(item);
        }

        FormsRepresentationModel model = new FormsRepresentationModel();
        model.add(Link.of("/ui/tasks", "self"));
        model.add(Link.of("/ui/tasks/form").withRel("create").withTitle("New Action Item"));
        model.addProperty("items", items);
        return model;
    }

    @GetMapping("/tasks/form")
    public FormsRepresentationModel taskForm() {
        return buildTaskForm(null);
    }

    @GetMapping("/tasks/{id}/form")
    public ResponseEntity<FormsRepresentationModel> taskFormEdit(@PathVariable Long id) {
        return taskRepository.findById(id)
                .map(task -> ResponseEntity.ok(buildTaskForm(task)))
                .orElse(ResponseEntity.notFound().build());
    }

    private FormsRepresentationModel buildTaskForm(Task task) {
        boolean isEdit = task != null && task.getId() != null;
        String action = isEdit ? "/api/tasks/" + task.getId() : "/api/tasks";
        String method = isEdit ? "PUT" : "POST";

        JsonSchemaBuilder schema = new JsonSchemaBuilder()
                .stringPropertyWithPlaceholder("title", "Action Item", "e.g. Follow up on portfolio review")
                .enumProperty("category", "Category", List.of(
                        option("FOLLOW_UP", "Follow Up"),
                        option("DOCUMENT_REQUEST", "Document Request"),
                        option("REVIEW", "Review"),
                        option("MEETING", "Meeting"),
                        option("COMPLIANCE", "Compliance")))
                .stringPropertyWithPlaceholder("clientName", "Client Name", "e.g. Chen Wei")
                .textareaProperty("description", "Notes", 2000)
                .enumProperty("status", "Status", List.of(
                        option("OPEN", "Open"),
                        option("IN_PROGRESS", "In Progress"),
                        option("COMPLETED", "Completed"),
                        option("OVERDUE", "Overdue")))
                .integerProperty("priority", "Priority", 1, 5)
                .stringProperty("dueDate", "Due Date", "date")
                .stringPropertyWithPlaceholder("assignedTo", "Assigned To", "e.g. John Doe")
                .required("title", "category");

        // Pre-fill for edit
        if (task != null) {
            if (task.getTitle() != null) schema.defaultValue("title", task.getTitle());
            if (task.getCategory() != null) schema.defaultValue("category", task.getCategory());
            if (task.getClientName() != null) schema.defaultValue("clientName", task.getClientName());
            if (task.getDescription() != null) schema.defaultValue("description", task.getDescription());
            if (task.getStatus() != null) schema.defaultValue("status", task.getStatus().name());
            if (task.getPriority() != null) schema.defaultValue("priority", task.getPriority());
            if (task.getDueDate() != null) schema.defaultValue("dueDate", task.getDueDate());
            if (task.getAssignedTo() != null) schema.defaultValue("assignedTo", task.getAssignedTo());
        } else {
            schema.defaultValue("status", "OPEN");
            schema.defaultValue("priority", 3);
        }

        FormsRepresentationModel model = new FormsRepresentationModel();
        model.add(Link.of(isEdit ? "/ui/tasks/" + task.getId() + "/form" : "/ui/tasks/form", "self"));
        model.addForm("default", new FormBuilder()
                .target(action)
                .method(method)
                .schema(schema)
                .build());
        return model;
    }

    private static String nullSafe(String value) {
        return value != null ? value : "";
    }
}
