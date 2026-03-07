package com.hyperbench.halschemaforms.mediatype;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Configuration;
import org.springframework.hateoas.MediaTypes;
import org.springframework.hateoas.config.HypermediaMappingInformation;
import org.springframework.http.MediaType;

import java.util.List;

@Configuration
public class HalSchemaFormsConfiguration implements HypermediaMappingInformation {

    @Override
    public List<MediaType> getMediaTypes() {
        return List.of(HalSchemaFormsMediaType.MEDIA_TYPE, MediaTypes.HAL_JSON);
    }

    @Override
    public ObjectMapper configureObjectMapper(ObjectMapper mapper) {
        mapper.registerModule(new HalSchemaFormsJacksonModule());
        return mapper;
    }
}
