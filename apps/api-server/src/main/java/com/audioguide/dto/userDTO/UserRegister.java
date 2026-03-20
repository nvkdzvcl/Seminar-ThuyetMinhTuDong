package com.audioguide.dto.userDTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserRegister {

    @NotBlank(message = "FULLNAME_BLANK")
    String fullName;

    @NotBlank(message = "PHONE_NUMBER_BLANK")
    @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "PHONE_NUMBER_INVALID")
    String phoneNumber;

    @NotBlank(message = "EMAIL_BLANK")
    @Email(message = "EMAIL_INVALID")
    String email;


    @NotBlank(message = "PASSWORD_BLANK")
    @Pattern( regexp = ".{8,}", message ="PASSWORD_INVALID")
    String password;

    String language;



}






