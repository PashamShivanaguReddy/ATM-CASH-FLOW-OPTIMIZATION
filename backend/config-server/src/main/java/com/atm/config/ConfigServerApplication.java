package com.atm.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Import;
import com.atm.common.exception.GlobalExceptionHandler;

@SpringBootApplication
@Import(GlobalExceptionHandler.class)
public class ConfigServerApplication {
    public static void main(String[] args) { SpringApplication.run(ConfigServerApplication.class, args); }
}