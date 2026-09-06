package com.bomcoffee.pos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BomCoffeePosApplication {
    public static void main(String[] args) {
        SpringApplication.run(BomCoffeePosApplication.class, args);
        System.out.println("Server running at: ");
    }
}
