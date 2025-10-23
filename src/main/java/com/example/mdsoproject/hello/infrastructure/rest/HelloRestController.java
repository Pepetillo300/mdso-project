package com.example.mdsoproject.hello.infrastructure.rest;

import com.example.mdsoproject.hello.application.HelloService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class HelloRestController {

    private final HelloService helloService;

    public HelloRestController(HelloService helloService) {
        this.helloService = helloService;
    }

    @GetMapping("/hello")
    public String hello() {
        return helloService.getHello();
    }
}
