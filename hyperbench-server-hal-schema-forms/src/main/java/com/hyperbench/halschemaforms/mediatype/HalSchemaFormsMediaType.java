package com.hyperbench.halschemaforms.mediatype;

import org.springframework.http.MediaType;

public final class HalSchemaFormsMediaType {

    public static final String VALUE = "application/hal+json;profile=\"https://github.com/jbadeau/hal-schema-forms\"";
    public static final MediaType MEDIA_TYPE = MediaType.parseMediaType(VALUE);

    private HalSchemaFormsMediaType() {}
}
