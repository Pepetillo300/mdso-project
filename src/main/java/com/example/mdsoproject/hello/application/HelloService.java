package com.example.mdsoproject.hello.application;

import org.springframework.stereotype.Service;

import com.example.mdsoproject.hello.infrastructure.repository.HelloRepository;

@Service
public class HelloService {

    private final HelloRepository repository;

    public HelloService(HelloRepository repository) {
        this.repository = repository;
    }

    public String getHello() {
        return repository.findHello();
    }
}
