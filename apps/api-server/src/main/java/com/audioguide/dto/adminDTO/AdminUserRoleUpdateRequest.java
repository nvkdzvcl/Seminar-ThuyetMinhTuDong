package com.audioguide.dto.adminDTO;

import com.audioguide.enums.UserRole;
import jakarta.validation.constraints.NotNull;
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
public class AdminUserRoleUpdateRequest {
    @NotNull(message = "ROLE_INVALID")
    UserRole role;
}
