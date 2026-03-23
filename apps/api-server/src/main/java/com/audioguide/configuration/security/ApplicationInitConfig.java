package com.audioguide.configuration.security;


import com.audioguide.entity.User;
import com.audioguide.enums.UserStatus;
import com.audioguide.enums.UserRole;
import com.audioguide.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;

@Configuration
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ApplicationInitConfig {

    PasswordEncoder passwordEncoder;

    @Bean
    ApplicationRunner applicationRunner(UserRepository userRepository){
        return args -> {
            User adminUser = userRepository.findByEmail("admin").orElseGet(() -> User.builder()
                    .email("admin")
                    .phoneNumber("0123456789")
                    .fullName("System Administrator")
                    .language("vi")
                    .createdAt(LocalDate.now())
                    .build());

            adminUser.setPassword(passwordEncoder.encode("admin123"));
            adminUser.setRole(UserRole.ADMIN);
            adminUser.setStatus(UserStatus.ACTIVE);
            userRepository.save(adminUser);
            log.info("admin account is ready with credentials admin/admin123");

            if(!userRepository.existsByEmail("user123@gmail.com") && !userRepository.existsByPhoneNumber("012345678910")){
                User user = User.builder()
                        .password(passwordEncoder.encode("user123"))
                        .role(UserRole.CUSTOMER)
                        .email("user123@gmail.com")
                        .fullName("user123")
                        .phoneNumber("012345678910")
                        .language("vi")
                        .createdAt(LocalDate.now())
                        .status(UserStatus.ACTIVE)
                        .build();
                userRepository.save(user);
                log.info(" user123 has been created with default password : user123 ");
            }

            if(!userRepository.existsByEmail("owner@gmail.com") && !userRepository.existsByPhoneNumber("01234567891011")){
                User user = User.builder()
                        .password(passwordEncoder.encode("owner"))
                        .role(UserRole.OWNER_SHOP)
                        .email("owner@gmail.com")
                        .fullName("owner")
                        .phoneNumber("012345678910")
                        .language("vi")
                        .createdAt(LocalDate.now())
                        .status(UserStatus.ACTIVE)
                        .build();
                userRepository.save(user);
                log.info(" owner has been created with default password : owner ");
            }




            log.info("Initialization of default users completed.");
        };
    }

}
