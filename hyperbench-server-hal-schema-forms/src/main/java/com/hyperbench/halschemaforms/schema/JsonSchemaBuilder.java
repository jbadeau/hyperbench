package com.hyperbench.halschemaforms.schema;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class JsonSchemaBuilder {

    private final Map<String, Map<String, Object>> properties = new LinkedHashMap<>();
    private final List<String> required = new ArrayList<>();

    public JsonSchemaBuilder stringProperty(String name, String title) {
        Map<String, Object> prop = new LinkedHashMap<>();
        prop.put("type", "string");
        prop.put("title", title);
        properties.put(name, prop);
        return this;
    }

    public JsonSchemaBuilder stringProperty(String name, String title, String format) {
        Map<String, Object> prop = new LinkedHashMap<>();
        prop.put("type", "string");
        prop.put("title", title);
        prop.put("format", format);
        properties.put(name, prop);
        return this;
    }

    public JsonSchemaBuilder stringPropertyWithPlaceholder(String name, String title, String placeholder) {
        Map<String, Object> prop = new LinkedHashMap<>();
        prop.put("type", "string");
        prop.put("title", title);
        prop.put("placeholder", placeholder);
        properties.put(name, prop);
        return this;
    }

    public JsonSchemaBuilder stringPropertyWithPlaceholder(String name, String title, String format, String placeholder) {
        Map<String, Object> prop = new LinkedHashMap<>();
        prop.put("type", "string");
        prop.put("title", title);
        prop.put("format", format);
        prop.put("placeholder", placeholder);
        properties.put(name, prop);
        return this;
    }

    public JsonSchemaBuilder textareaProperty(String name, String title, int maxLength) {
        Map<String, Object> prop = new LinkedHashMap<>();
        prop.put("type", "string");
        prop.put("title", title);
        prop.put("maxLength", maxLength);
        properties.put(name, prop);
        return this;
    }

    public JsonSchemaBuilder enumProperty(String name, String title, List<Map<String, String>> options) {
        Map<String, Object> prop = new LinkedHashMap<>();
        prop.put("type", "string");
        prop.put("title", title);
        List<Map<String, String>> oneOf = new ArrayList<>();
        for (Map<String, String> opt : options) {
            Map<String, String> entry = new LinkedHashMap<>();
            entry.put("const", opt.get("value"));
            entry.put("title", opt.get("label"));
            oneOf.add(entry);
        }
        prop.put("oneOf", oneOf);
        properties.put(name, prop);
        return this;
    }

    public JsonSchemaBuilder integerProperty(String name, String title, Integer min, Integer max) {
        Map<String, Object> prop = new LinkedHashMap<>();
        prop.put("type", "integer");
        prop.put("title", title);
        if (min != null) prop.put("minimum", min);
        if (max != null) prop.put("maximum", max);
        properties.put(name, prop);
        return this;
    }

    public JsonSchemaBuilder numberProperty(String name, String title) {
        Map<String, Object> prop = new LinkedHashMap<>();
        prop.put("type", "number");
        prop.put("title", title);
        properties.put(name, prop);
        return this;
    }

    public JsonSchemaBuilder required(String... names) {
        for (String name : names) {
            if (!required.contains(name)) {
                required.add(name);
            }
        }
        return this;
    }

    public JsonSchemaBuilder defaultValue(String propertyName, Object value) {
        Map<String, Object> prop = properties.get(propertyName);
        if (prop != null) {
            prop.put("default", value);
        }
        return this;
    }

    public Map<String, Object> build() {
        Map<String, Object> schema = new LinkedHashMap<>();
        schema.put("type", "object");
        if (!required.isEmpty()) {
            schema.put("required", new ArrayList<>(required));
        }
        schema.put("properties", new LinkedHashMap<>(properties));
        return schema;
    }

    public static Map<String, String> option(String value, String label) {
        Map<String, String> opt = new LinkedHashMap<>();
        opt.put("value", value);
        opt.put("label", label);
        return opt;
    }
}
