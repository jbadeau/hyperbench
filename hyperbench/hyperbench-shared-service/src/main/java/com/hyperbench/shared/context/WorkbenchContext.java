package com.hyperbench.shared.context;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

public class WorkbenchContext {
    private static final ThreadLocal<WorkbenchContext> CURRENT = new ThreadLocal<>();

    private final Map<String, String> properties;

    public WorkbenchContext(Map<String, String> properties) {
        this.properties = Collections.unmodifiableMap(new HashMap<>(properties));
    }

    public static WorkbenchContext current() {
        WorkbenchContext ctx = CURRENT.get();
        return ctx != null ? ctx : new WorkbenchContext(Map.of());
    }

    public static void set(WorkbenchContext ctx) {
        CURRENT.set(ctx);
    }

    public static void clear() {
        CURRENT.remove();
    }

    public String get(String key) {
        return properties.get(key);
    }

    public String getClientId() {
        return get("ClientId");
    }

    public String getClientName() {
        return get("ClientName");
    }

    public Map<String, String> getAll() {
        return properties;
    }

    @Override
    public String toString() {
        return "WorkbenchContext" + properties;
    }
}
