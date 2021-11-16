package com.tencent.scfspringbootjava8.repository;

import com.tencent.scfspringbootjava8.model.TodoItem;

import java.util.Collection;
import java.util.HashMap;
import java.util.concurrent.atomic.AtomicLong;

public class TodoRepository {
    private static final HashMap<String, TodoItem> todos = new HashMap<>();
    private final AtomicLong counter = new AtomicLong();

    public TodoRepository() {
        TodoItem item = new TodoItem();
        item.setKey(Long.toString(counter.incrementAndGet()));
        item.setContent("First todo");
        add(item);
    }

    public void add(TodoItem item) {
        item.setKey(Long.toString(counter.incrementAndGet()));
        todos.put(item.getKey(), item);
    }

    public Collection<TodoItem> getAll() {
        return todos.values();
    }

    public TodoItem find(String key) {
        return todos.get(key);
    }

    public void remove(String key) {
        todos.remove(key);
    }

    public void update(String key, TodoItem item) {
        todos.remove(key);
        todos.put(key, item);
    }
}
