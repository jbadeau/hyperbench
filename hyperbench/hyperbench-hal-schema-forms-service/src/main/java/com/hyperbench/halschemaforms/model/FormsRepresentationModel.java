package com.hyperbench.halschemaforms.model;

import com.fasterxml.jackson.annotation.JsonAnyGetter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.hateoas.RepresentationModel;

import java.util.LinkedHashMap;
import java.util.Map;

public class FormsRepresentationModel extends RepresentationModel<FormsRepresentationModel> {

    private final Map<String, FormDefinition> forms = new LinkedHashMap<>();
    private final Map<String, Object> properties = new LinkedHashMap<>();

    public FormsRepresentationModel addForm(String name, FormDefinition form) {
        this.forms.put(name, form);
        return this;
    }

    @JsonProperty("_forms")
    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    public Map<String, FormDefinition> getForms() {
        return forms;
    }

    public FormsRepresentationModel addProperty(String name, Object value) {
        this.properties.put(name, value);
        return this;
    }

    @JsonAnyGetter
    public Map<String, Object> getProperties() {
        return properties;
    }
}
