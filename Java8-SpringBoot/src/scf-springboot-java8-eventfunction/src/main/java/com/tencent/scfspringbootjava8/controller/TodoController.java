package com.tencent.scfspringbootjava8.controller;

import com.tencent.scfspringbootjava8.model.TodoItem;
import com.tencent.scfspringbootjava8.repository.TodoRepository;
import org.springframework.web.bind.annotation.*;

import java.util.Collection;

@RestController
@RequestMapping("/todos")
public class TodoController {
    private final TodoRepository todoRepository;

    public TodoController() {
        todoRepository = new TodoRepository();
    }

    @GetMapping
    public Collection<TodoItem> getAllTodos() {
        return todoRepository.getAll();
    }

    @GetMapping("/{key}")
    public TodoItem getByKey(@PathVariable("key") String key) {
        return todoRepository.find(key);
    }

    @PostMapping
    public TodoItem create(@RequestBody TodoItem item) {
        todoRepository.add(item);
        return item;
    }

    @PutMapping("/{key}")
    public TodoItem update(@PathVariable("key") String key, @RequestBody TodoItem item) {
        if (item == null || !item.getKey().equals(key)) {
            return null;
        }

        todoRepository.update(key, item);
        return item;
    }

    @DeleteMapping("/{key}")
    public void delete(@PathVariable("key") String key) {
        todoRepository.remove(key);
    }
}
