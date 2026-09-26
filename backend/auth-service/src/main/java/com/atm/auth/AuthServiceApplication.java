package com.atm.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Import;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import com.atm.common.exception.GlobalExceptionHandler;

@SpringBootApplication
@EntityScan({"com.atm.domain.entity", "com.atm.auth.entity"})
@EnableJpaRepositories({"com.atm.domain.repository", "com.atm.auth.repository"})
@Import(GlobalExceptionHandler.class)
public class AuthServiceApplication {
    public static void main(String[] args) { SpringApplication.run(AuthServiceApplication.class, args); }
}