package com.audioguide.configuration.openApi;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {

        final String schemeName = "bearerAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("Audio Guide API")
                        .version("v1")
                        .description("Backend APIs for frontend team"))
                .addSecurityItem(new SecurityRequirement().addList(schemeName))
                .components(
                        new Components().addSecuritySchemes(
                                schemeName,
                                new SecurityScheme()
                                        .name(schemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                        )
                );
    }


//    @Bean
//    public OpenAPI openAPI() {
//        return new OpenAPI()
//                .info(new Info()
//                        .title("Audio Guide API")
//                        .version("v1")
//                        .description("Backend APIs for frontend team"));
//    }
}