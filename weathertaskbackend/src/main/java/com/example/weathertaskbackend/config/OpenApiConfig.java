package com.example.weathertaskbackend.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI weatherTaskOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Weather Task Dashboard API")
                        .description("OpenAPI contract for the Weather Task Dashboard backend.")
                        .version("1.0.0"));
    }

    @Bean
    public GroupedOpenApi taskApi() {
        return GroupedOpenApi.builder()
                .group("task-api")
                .pathsToMatch("/api/tasks/**")
                .build();
    }

    @Bean
    public GroupedOpenApi authApi() {
        return GroupedOpenApi.builder()
                .group("auth-api")
                .pathsToMatch("/login", "/register", "/verify-email", "/forgot-password", "/reset-password")
                .build();
    }

    @Bean
    public GroupedOpenApi weatherApi() {
        return GroupedOpenApi.builder()
                .group("weather-api")
                .pathsToMatch("/api/weather/**")
                .build();
    }
}