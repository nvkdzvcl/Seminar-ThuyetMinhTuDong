package com.audioguide.dto.authDTO;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LoginRequest {
    @NotBlank( message = "EMAIL_NOT_BLANK")
    String email;

    @NotBlank( message = "PASSWORD_NOT_BLANK")
    String password;
}
