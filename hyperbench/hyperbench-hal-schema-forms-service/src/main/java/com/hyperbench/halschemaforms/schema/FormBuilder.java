package com.hyperbench.halschemaforms.schema;

import com.hyperbench.halschemaforms.model.FormDefinition;

import java.util.Map;

public class FormBuilder {

    private String targetHref;
    private boolean templatedTarget = false;
    private String method = "POST";
    private String contentType = "application/json";
    private Map<String, Object> schema;

    public FormBuilder target(String href) {
        this.targetHref = href;
        this.templatedTarget = false;
        return this;
    }

    public FormBuilder templatedTarget(String href) {
        this.targetHref = href;
        this.templatedTarget = true;
        return this;
    }

    public FormBuilder method(String method) {
        this.method = method;
        return this;
    }

    public FormBuilder contentType(String contentType) {
        this.contentType = contentType;
        return this;
    }

    public FormBuilder schema(JsonSchemaBuilder schemaBuilder) {
        this.schema = schemaBuilder.build();
        return this;
    }

    public FormBuilder schema(Map<String, Object> schema) {
        this.schema = schema;
        return this;
    }

    public FormDefinition build() {
        FormDefinition form = new FormDefinition(targetHref, method, contentType, schema);
        form.setTemplatedTarget(templatedTarget);
        return form;
    }
}
