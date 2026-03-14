package com.audioguide.configuration.openApi;


import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiGroupConfig {
    @Bean
    public GroupedOpenApi userGroup() {
        return GroupedOpenApi.builder()
                .group("user")
                .pathsToMatch("/user/**")
                .build();
    }

    @Bean
    public GroupedOpenApi authGroup() {
        return GroupedOpenApi.builder()
                .group("auth")
                .pathsToMatch("/auth/**")
                .build();
    }

    @Bean
    public GroupedOpenApi shopGroup() {
        return GroupedOpenApi.builder()
                .group("shop")
                .pathsToMatch("/shop/**")
                .build();
    }

    @Bean
    public GroupedOpenApi dishGroup() {
        return GroupedOpenApi.builder()
                .group("dish")
                .pathsToMatch("/dish/**")
                .build();
    }


    @Bean
    public GroupedOpenApi languageGroup() {
        return GroupedOpenApi.builder()
                .group("language")
                .pathsToMatch("/language/**")
                .build();
    }

    @Bean
    public GroupedOpenApi audioGroup() {
        return GroupedOpenApi.builder()
                .group("audio")
                .pathsToMatch("/audio/**")
                .build();
    }

    @Bean
    public GroupedOpenApi orderGroup() {
        return GroupedOpenApi.builder()
                .group("order")
                .pathsToMatch("/order/**")
                .build();
    }

    @Bean
    public GroupedOpenApi tourplanGroup() {
        return GroupedOpenApi.builder()
                .group("tour-plan")
                .pathsToMatch("/tour-plan/**")
                .build();
    }



}

