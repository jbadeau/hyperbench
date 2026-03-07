package com.hyperbench.halschemaforms.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.LinkedHashMap;
import java.util.Map;

public class FormDefinition {

    private String targetHref;
    private boolean templatedTarget;
    private String method;
    private String contentType;
    private Map<String, Object> schema;

    public FormDefinition() {}

    public FormDefinition(String targetHref, String method, String contentType, Map<String, Object> schema) {
        this.targetHref = targetHref;
        this.method = method;
        this.contentType = contentType;
        this.schema = schema;
    }

    @JsonIgnore
    public String getTargetHref() { return targetHref; }
    public void setTargetHref(String targetHref) { this.targetHref = targetHref; }

    @JsonIgnore
    public boolean isTemplatedTarget() { return templatedTarget; }
    public void setTemplatedTarget(boolean templatedTarget) { this.templatedTarget = templatedTarget; }

    @JsonProperty("_links")
    public Map<String, Object> getLinksMap() {
        Map<String, Object> target = new LinkedHashMap<>();
        target.put("href", targetHref);
        if (templatedTarget) {
            target.put("templated", true);
        }
        Map<String, Object> links = new LinkedHashMap<>();
        links.put("target", target);
        return links;
    }

    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public Map<String, Object> getSchema() { return schema; }
    public void setSchema(Map<String, Object> schema) { this.schema = schema; }
}
