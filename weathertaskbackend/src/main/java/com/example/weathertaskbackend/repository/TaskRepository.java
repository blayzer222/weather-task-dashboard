package com.example.weathertaskbackend.repository;

import com.example.weathertaskbackend.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Integer> {
    List<Task> findByAccountId(Integer accountId);
}
