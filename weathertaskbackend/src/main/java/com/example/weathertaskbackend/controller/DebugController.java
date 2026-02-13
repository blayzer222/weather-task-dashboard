package com.example.weathertaskbackend.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DebugController {

  @GetMapping("/debug-path")
  public String debugPath(HttpServletRequest req) {
    return "requestURI=" + req.getRequestURI()
        + "\nservletPath=" + req.getServletPath()
        + "\ncontextPath=" + req.getContextPath();
  }
}
