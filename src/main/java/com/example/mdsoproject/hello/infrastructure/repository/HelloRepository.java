package com.example.mdsoproject.hello.infrastructure.repository;

import com.example.mdsoproject.hello.infrastructure.entity.HelloEntity;
import org.springframework.stereotype.Component;

@Component
public class HelloRepository {

    public String findHello() {
        HelloEntity e = new HelloEntity("Hola mundo ejecucion 3");
        return e.getMessage();
    }
}
