package com.chatflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ChatFlowApplication {

    public static void main(String[] args) {
        SpringApplication.run(ChatFlowApplication.class, args);
    }

}
