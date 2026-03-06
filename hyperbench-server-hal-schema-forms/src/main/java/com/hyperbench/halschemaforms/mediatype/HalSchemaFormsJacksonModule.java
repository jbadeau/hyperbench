package com.hyperbench.halschemaforms.mediatype;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.databind.ser.std.StdSerializer;
import com.hyperbench.halschemaforms.model.FormDefinition;
import com.hyperbench.halschemaforms.model.FormsRepresentationModel;
import org.springframework.hateoas.Link;

import java.io.IOException;
import java.util.Map;

public class HalSchemaFormsJacksonModule extends SimpleModule {

    public HalSchemaFormsJacksonModule() {
        super("HalSchemaFormsModule");
        addSerializer(FormsRepresentationModel.class, new FormsRepresentationModelSerializer());
    }

    private static class FormsRepresentationModelSerializer extends StdSerializer<FormsRepresentationModel> {

        FormsRepresentationModelSerializer() {
            super(FormsRepresentationModel.class);
        }

        @Override
        public void serialize(FormsRepresentationModel model, JsonGenerator gen, SerializerProvider provider) throws IOException {
            gen.writeStartObject();

            // _links
            if (model.hasLinks()) {
                gen.writeObjectFieldStart("_links");
                for (Link link : model.getLinks()) {
                    gen.writeObjectFieldStart(link.getRel().value());
                    gen.writeStringField("href", link.getHref());
                    if (link.isTemplated()) {
                        gen.writeBooleanField("templated", true);
                    }
                    if (link.getTitle() != null) {
                        gen.writeStringField("title", link.getTitle());
                    }
                    gen.writeEndObject();
                }
                gen.writeEndObject();
            }

            // Resource properties
            for (Map.Entry<String, Object> entry : model.getProperties().entrySet()) {
                gen.writeObjectField(entry.getKey(), entry.getValue());
            }

            // _forms
            if (!model.getForms().isEmpty()) {
                gen.writeObjectFieldStart("_forms");
                for (Map.Entry<String, FormDefinition> entry : model.getForms().entrySet()) {
                    FormDefinition form = entry.getValue();
                    gen.writeObjectFieldStart(entry.getKey());

                    // _links within form
                    gen.writeObjectFieldStart("_links");
                    gen.writeObjectFieldStart("target");
                    gen.writeStringField("href", form.getTargetHref());
                    if (form.isTemplatedTarget()) {
                        gen.writeBooleanField("templated", true);
                    }
                    gen.writeEndObject();
                    gen.writeEndObject();

                    gen.writeStringField("method", form.getMethod());
                    gen.writeStringField("contentType", form.getContentType());

                    if (form.getSchema() != null) {
                        gen.writeObjectField("schema", form.getSchema());
                    }

                    gen.writeEndObject();
                }
                gen.writeEndObject();
            }

            gen.writeEndObject();
        }
    }
}
