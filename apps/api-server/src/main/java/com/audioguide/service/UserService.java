package com.audioguide.service;


import com.audioguide.dto.apiDTO.PagingDto;
import com.audioguide.dto.userDTO.*;
import com.audioguide.entity.User;
import com.audioguide.enums.SortDirection;
import com.audioguide.enums.UserRole;
import com.audioguide.exception.AppException;
import com.audioguide.mapper.UserMapper;
import com.audioguide.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.audioguide.exception.ErrorCode;
import com.audioguide.enums.UserStatus;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserService {

    UserRepository userRepository;
    UserMapper userMapper;
    PasswordEncoder passwordEncoder;


    public UserResponse  createUser(UserCreationRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            log.error("Email {} is already in use", request.getEmail());
            throw new AppException(ErrorCode.EMAIL_EXISTS);
        }

        if (userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            log.error("Phone number {} is already in use", request.getPhoneNumber());
            throw new AppException(ErrorCode.PHONE_NUMBER_EXISTS);
        }

        var userEntity = userMapper.toUserFromUserCreateRequest(request);
        userEntity.setPassword(passwordEncoder.encode(request.getPassword()));
        userEntity.setStatus(UserStatus.ACTIVE);
        userEntity.setRole(UserRole.CUSTOMER);
        userEntity.setCreatedAt(LocalDate.now());
        var savedUser = userRepository.save(userEntity);
        log.info("User with email {} created successfully", request.getEmail());
        return userMapper.toUserResponseFromUser(savedUser);
    }

    public UserResponse getUserById(Integer userId){
        User user = userRepository.findById(userId).orElseThrow(()->{
            log.error("User with id {} not found", userId);
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        });
        log.info("Fetched user with id {}, username {}", userId, user.getFullName());
        return userMapper.toUserResponseFromUser(user);
    }




    public PagingDto<UserResponse> getAllUsers(
            int page,
            int size,
            UserStatus status,
            String sortBy,
            SortDirection direction
    ) {
        if (page < 1) throw new AppException(ErrorCode.INVALID_PAGE_NUMBER);
        if (size < 1 || size > 10) throw new AppException(ErrorCode.INVALID_PAGE_SIZE);

        // default
        if (sortBy == null || sortBy.isBlank()) sortBy = "Id";
        if (direction == null) direction = SortDirection.DESC;

        Sort sort = direction == SortDirection.ASC
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page - 1, size, sort);

        Page<User> userPage = (status == null)
                ? userRepository.findAll(pageable)
                : userRepository.findByStatus(status, pageable);

        List<UserResponse> items = userPage.getContent()
                .stream()
                .map(userMapper::toUserResponseFromUser)
                .toList();

        return new PagingDto<>(
                items,
                userPage.getTotalElements(),
                userPage.getNumber() + 1,
                userPage.getSize(),
                userPage.getTotalPages()
        );
    }

    public UserResponse updateUserById(Integer userId, UserUpdateRequest request) {
        User user = userRepository.findById(userId).orElseThrow(()->{
            log.error("User with id {} not found", userId);
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        });
        log.info("Fetched user with id {} username {}", userId, user.getFullName());
        userMapper.updateUserInfo( user, request);
        return userMapper.toUserResponseFromUser(userRepository.save(user));
    }


    public boolean deleteUserById(Integer userId){
        User user = userRepository.findById(userId).orElseThrow(()->{
            log.error("User with id {} not found", userId);
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        });
        user.setStatus(UserStatus.DELETED);
        userRepository.save(user);
        log.info("Deleted user with id {}", userId);
        return true;
    }


    public UserRegisterResponse registerUser(UserRegister register){
        return registerWithRole(register, UserRole.CUSTOMER);
    }

    public UserRegisterResponse registerOwner(UserRegister register){
        return registerWithRole(register, UserRole.OWNER_SHOP);
    }

    private UserRegisterResponse registerWithRole(UserRegister register, UserRole role) {
        if (userRepository.existsByEmail(register.getEmail())) {
            log.error("Email {} is already in use", register.getEmail());
            throw new AppException(ErrorCode.EMAIL_EXISTS);
        }

        if (userRepository.existsByPhoneNumber(register.getPhoneNumber())) {
            log.error("Phone number {} is already in use", register.getPhoneNumber());
            throw new AppException(ErrorCode.PHONE_NUMBER_EXISTS);
        }

        var userEntity = userMapper.toUserFromUserRegister(register);
        userEntity.setPassword(passwordEncoder.encode(register.getPassword()));
        userEntity.setStatus(UserStatus.ACTIVE);
        userEntity.setRole(role);
        userEntity.setCreatedAt(LocalDate.now());
        userRepository.save(userEntity);
        log.info("User with email {} registered successfully as {}", register.getEmail(), role);
        return UserRegisterResponse.builder()
                .isRegistered(true)
                .build();
    }

}
