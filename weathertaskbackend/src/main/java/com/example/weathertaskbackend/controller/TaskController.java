package com.example.weathertaskbackend.controller;

import org.springframework.web.bind.annotation.*;
import com.example.weathertaskbackend.model.Task;
import java.util.*;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "http://localhost:5173") // erlaubt React-Zugriff
public class TaskController {

    private List<Task> tasks = new ArrayList<>();
    private int nextId = 1;

    @GetMapping
    public List<Task> getTasks() {
        return tasks;
    }

    @PostMapping
    public Task addTask(@RequestBody Task task) {
        task.setId(nextId++);
        tasks.add(task);
        return task;
    }

    @DeleteMapping("/{id}")
    public void deleteTask(@PathVariable int id) {
        tasks.removeIf(t -> t.getId() == id);
    }
}
