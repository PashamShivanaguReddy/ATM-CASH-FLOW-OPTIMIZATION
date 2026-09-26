package com.atm.bank;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Import;
import com.atm.common.exception.GlobalExceptionHandler;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EntityScan("com.atm.domain.entity")
@EnableJpaRepositories("com.atm.domain.repository")
@Import(GlobalExceptionHandler.class)
public class BankServiceApplication {
    public static void main(String[] args) { SpringApplication.run(BankServiceApplication.class, args); }
}