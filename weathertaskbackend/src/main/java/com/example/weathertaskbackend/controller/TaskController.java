package com.example.weathertaskbackend.controller;

import com.example.weathertaskbackend.dto.TaskDto;
import com.example.weathertaskbackend.model.Account;
import com.example.weathertaskbackend.model.Task;
import com.example.weathertaskbackend.repository.AccountRepository;
import com.example.weathertaskbackend.repository.TaskRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

  private final TaskRepository taskRepo;
  private final AccountRepository accountRepo;

  public TaskController(TaskRepository taskRepo, AccountRepository accountRepo) {
    this.taskRepo = taskRepo;
    this.accountRepo = accountRepo;
  }

  private Integer accountId(HttpServletRequest req) {
    return (Integer) req.getAttribute("accountId");
  }

  private static TaskDto toDto(Task t) {
    return new TaskDto(
        t.getId(),
        t.getTitle(),
        t.getDescription(),
        t.getPriority(),
        t.getStatus()
    );
  }

  @GetMapping
  public List<TaskDto> getTasks(HttpServletRequest req) {
    Integer accountId = accountId(req);
    return taskRepo.findByAccountId(accountId).stream().map(TaskController::toDto).toList();
  }

  @PostMapping
  public TaskDto addTask(HttpServletRequest req, @RequestBody TaskDto body) {
    Integer accountId = accountId(req);
    Account acc = accountRepo.findById(accountId).orElseThrow();

    Task t = new Task();
    t.setTitle(body.title());
    t.setDescription(body.description());
    t.setPriority(
        body.priority() == null || body.priority().isBlank() ? "MEDIUM" : body.priority()
    );
    t.setStatus(
        body.status() == null || body.status().isBlank() ? "NEW" : body.status()
    );
    t.setAccount(acc);

    return toDto(taskRepo.save(t));
  }

  @PutMapping("/{taskId}")
  public TaskDto updateTask(
      HttpServletRequest req,
      @PathVariable Integer taskId,
      @RequestBody TaskDto body
  ) {
    Integer accountId = accountId(req);

    Task t = taskRepo.findByIdAndAccountId(taskId, accountId);
    if (t == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found");
    }

    t.setTitle(body.title());
    t.setDescription(body.description());
    t.setPriority(
        body.priority() == null || body.priority().isBlank() ? "MEDIUM" : body.priority()
    );
    t.setStatus(
        body.status() == null || body.status().isBlank() ? t.getStatus() : body.status()
    );

    return toDto(taskRepo.save(t));
  }

  @PutMapping("/{taskId}/status")
  public TaskDto updateStatus(
      HttpServletRequest req,
      @PathVariable Integer taskId,
      @RequestBody TaskDto body
  ) {
    Integer accountId = accountId(req);

    Task t = taskRepo.findByIdAndAccountId(taskId, accountId);
    if (t == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found");
    }

    t.setStatus(body.status());
    return toDto(taskRepo.save(t));
  }

  @DeleteMapping("/{taskId}")
  public void deleteTask(HttpServletRequest req, @PathVariable Integer taskId) {
    Integer accountId = accountId(req);

    Task t = taskRepo.findByIdAndAccountId(taskId, accountId);
    if (t == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found");
    }

    taskRepo.delete(t);
  }
}