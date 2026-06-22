package com.producttracker.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.postgresql.util.PGobject;

@Configuration
public class JacksonConfig {

    @Bean
    public Jackson2ObjectMapperBuilderCustomizer pgObjectCustomizer() {
        return builder -> builder.serializerByType(PGobject.class,
            new com.fasterxml.jackson.databind.JsonSerializer<Object>() {
                @Override
                public void serialize(Object value,
                                      com.fasterxml.jackson.core.JsonGenerator gen,
                                      com.fasterxml.jackson.databind.SerializerProvider serializers)
                        throws java.io.IOException {
                    if (value instanceof PGobject) {
                        PGobject pg = (PGobject) value;
                        String v = pg.getValue();
                        if (v == null) {
                            gen.writeNull();
                        } else {
                            gen.writeRawValue(v);
                        }
                    } else {
                        gen.writeNull();
                    }
                }
            });
    }
}
