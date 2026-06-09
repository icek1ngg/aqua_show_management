package com.asms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AsmsApplication {

    public static void main(String[] args) {
        SpringApplication.run(AsmsApplication.class, args);
    }
}
