package com.audioguide.dto.userDTO;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {

    Integer id;

    String fullName;

    String phoneNumber;

    String email;

    String language;

    String role;

    LocalDate createdAt;

    String status;

}
