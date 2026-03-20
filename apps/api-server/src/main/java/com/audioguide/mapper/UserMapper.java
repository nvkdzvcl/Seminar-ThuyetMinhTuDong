package com.audioguide.mapper;


import com.audioguide.dto.userDTO.UserCreationRequest;
import com.audioguide.dto.userDTO.UserRegister;
import com.audioguide.dto.userDTO.UserResponse;
import com.audioguide.dto.userDTO.UserUpdateRequest;
import com.audioguide.entity.User;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface UserMapper {

    User toUserFromUserCreateRequest(UserCreationRequest request);
    User toUserFromUserRegister(UserRegister request);
    UserResponse toUserResponseFromUser(User user);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateUserInfo(@MappingTarget User user, UserUpdateRequest request);
}
