package com.atm.registry;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Import;
import com.atm.common.exception.GlobalExceptionHandler;

@SpringBootApplication
@Import(GlobalExceptionHandler.class)
public class ServiceRegistryApplication {
    public static void main(String[] args) { SpringApplication.run(ServiceRegistryApplication.class, args); }
}