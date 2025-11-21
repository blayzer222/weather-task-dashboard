package com.example.weathertaskbackend.controller;

import com.example.weathertaskbackend.model.Task;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(
        origins = {
            "http://localhost:5173",
            "http://localhost:4173"
        },
        methods = {
            RequestMethod.GET,
            RequestMethod.POST,
            RequestMethod.PUT,
            RequestMethod.DELETE,
            RequestMethod.OPTIONS
        }
)
public class TaskController {

    private final List<Task> tasks = new ArrayList<>();
    private int nextId = 1;

    @GetMapping
    public List<Task> getTasks() {
        return tasks;
    }

    @PostMapping
    public Task addTask(@RequestBody Task task) {
        task.setId(nextId++);
        if (task.getStatus() == null || task.getStatus().isBlank()) {
            task.setStatus("NEW");
        }
        tasks.add(task);
        return task;
    }

    @DeleteMapping("/{id}")
    public void deleteTask(@PathVariable int id) {
        tasks.removeIf(t -> t.getId() == id);
    }

    @PutMapping("/{id}/status")
    public Task updateStatus(@PathVariable int id, @RequestBody Task updated) {
        for (Task t : tasks) {
            if (t.getId() == id) {
                t.setStatus(updated.getStatus());
                return t;
            }
        }
        return null;
    }
}
