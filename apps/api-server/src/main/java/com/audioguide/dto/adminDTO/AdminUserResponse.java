package com.audioguide.dto.adminDTO;

import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminUserResponse {
    Integer id;
    String fullName;
    String phoneNumber;
    String email;
    String language;
    String role;
    String status;
    LocalDate createdAt;
}
