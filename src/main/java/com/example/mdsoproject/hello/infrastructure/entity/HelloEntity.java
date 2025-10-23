package com.example.mdsoproject.hello.infrastructure.entity;

public class HelloEntity {
    private final String message;

    public HelloEntity(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }
}
