package com.audioguide.entity;


import com.audioguide.enums.UserStatus;
import com.audioguide.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Integer id;

    String fullName;

    String phoneNumber;

    String email;

    String password;

    String language;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    UserRole role;

    LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    UserStatus status;

}
