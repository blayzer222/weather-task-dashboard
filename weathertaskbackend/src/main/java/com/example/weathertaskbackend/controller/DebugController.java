package com.example.weathertaskbackend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Debug", description = "Debug endpoints for testing")
@RestController
public class DebugController {

  @Operation(summary = "Debug request path", description = "Returns request path information")
  @GetMapping("/debug-path")
  public String debugPath(HttpServletRequest req) {
    return "requestURI=" + req.getRequestURI()
        + "\nservletPath=" + req.getServletPath()
        + "\ncontextPath=" + req.getContextPath();
  }
}
