package com.audioguide.exception;

import com.audioguide.dto.apiDTO.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import com.audioguide.enums.UserStatus;
import com.audioguide.enums.UserRole;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.security.Principal;
import java.util.Map;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    SimpMessagingTemplate messagingTemplate;

    @ExceptionHandler(value = Exception.class)
    ResponseEntity<ApiResponse> handlingRuntimeException(Exception  exception){
        ApiResponse apiResponse = new ApiResponse();
        log.info("===========");
        log.error("Unhandled exception caught: ", exception);
        apiResponse.setCode(ErrorCode.UNCATEGORIZED_EXCEPTION.getCode());
        apiResponse.setMessage(ErrorCode.UNCATEGORIZED_EXCEPTION.getMessage());

        return ResponseEntity.badRequest().body(apiResponse);
    }

    @ExceptionHandler(value = AppException.class)
    ResponseEntity<ApiResponse> handlingAppException(AppException exception){
        ErrorCode errorCode = exception.getErrorCode();
        ApiResponse apiResponse = new ApiResponse();
        log.info("=========" + errorCode.getCode() + "==========");
        apiResponse.setCode(errorCode.getCode());
        apiResponse.setMessage(errorCode.getMessage());

        return ResponseEntity
                .status(errorCode.getStatusCode())
                .body(apiResponse);
    }

    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    ResponseEntity<ApiResponse> handlingValidation(MethodArgumentNotValidException exception){
        String enumKey = exception.getFieldError().getDefaultMessage();
        log.info("=========" +enumKey + "==========");
        ErrorCode errorCode = ErrorCode.UNCATEGORIZED_EXCEPTION;

        try {
            errorCode = ErrorCode.valueOf(enumKey);
        } catch (IllegalArgumentException e){
            log.info("=========" +enumKey + errorCode.getCode() + "==========");

        }
        ApiResponse apiResponse = new ApiResponse();

        apiResponse.setCode(errorCode.getCode());
        apiResponse.setMessage(errorCode.getMessage());

        return ResponseEntity.badRequest().body(apiResponse);

    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse> handleMethodNotSupported(
            HttpRequestMethodNotSupportedException exception
    ) {
        log.error("HTTP Method Not Supported: {}", exception.getMessage());

        ApiResponse apiResponse = new ApiResponse();
        apiResponse.setCode(ErrorCode.METHOD_NOT_ALLOWED.getCode());
        apiResponse.setMessage(ErrorCode.METHOD_NOT_ALLOWED.getMessage());


        return ResponseEntity
                .status(ErrorCode.METHOD_NOT_ALLOWED.getStatusCode())
                .body(apiResponse);
    }

    /**
     * Handle NoResourceFoundException
     * @param exception
     * @return
     */
    @ExceptionHandler(value = NoResourceFoundException.class)
    ResponseEntity<ApiResponse> handlingNoResourceFoundException(NoResourceFoundException exception){
        ApiResponse apiResponse = new ApiResponse();
        log.info("===========");
        log.error("No resource found exception caught: ", exception);
        apiResponse.setCode(ErrorCode.NO_RESOURCE_FOUND.getCode());
        apiResponse.setMessage(ErrorCode.NO_RESOURCE_FOUND.getMessage());

        return ResponseEntity.badRequest().body(apiResponse);
    }


    private static final Map<Class<?>, ErrorCode> ENUM_ERROR_MAP = Map.of(
            UserRole.class, ErrorCode.ROLE_INVALID,
            UserStatus.class, ErrorCode.STATUS_INVALID
            // thêm enum khác ở đây:
            // Gender.class, ErrorCode.GENDER_INVALID,
            // PaymentStatus.class, ErrorCode.PAYMENT_STATUS_INVALID
    );


    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        Throwable root = NestedExceptionUtils.getMostSpecificCause(ex);

        ErrorCode errorCode = ErrorCode.REQUEST_BODY_INVALID;

        if (root instanceof InvalidFormatException ife) {
            Class<?> target = ife.getTargetType();
            errorCode = ENUM_ERROR_MAP.getOrDefault(target, ErrorCode.REQUEST_BODY_INVALID);
        }

        ApiResponse apiResponse = new ApiResponse();
        apiResponse.setCode(errorCode.getCode());
        apiResponse.setMessage(errorCode.getMessage());

        return ResponseEntity.status(errorCode.getStatusCode()).body(apiResponse);
    }


    @ExceptionHandler(AuthorizationDeniedException.class)
    public ResponseEntity<ApiResponse> handleAuthorizationDenied(
            AuthorizationDeniedException exception
    ) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        String username = "UNKNOWN";
        String authorities = "NONE";

        if (auth != null) {
            username = auth.getName();
            authorities = auth.getAuthorities().toString();
        }

        log.info("========== AUTHORIZATION DENIED ==========");
        log.error("User: {}", username);
        log.error("Authorities: {}", authorities);
        log.error("Reason: {}", exception.getMessage());

        ApiResponse apiResponse = new ApiResponse();
        apiResponse.setCode(ErrorCode.FORBIDDEN.getCode());
        apiResponse.setMessage(ErrorCode.FORBIDDEN.getMessage());

        return ResponseEntity
                .status(ErrorCode.FORBIDDEN.getStatusCode())
                .body(apiResponse);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse> handleAccessDenied(
            AccessDeniedException exception
    ) {
        log.error("Access denied: {}", exception.getMessage());

        ApiResponse apiResponse = new ApiResponse();
        apiResponse.setCode(ErrorCode.FORBIDDEN.getCode());
        apiResponse.setMessage(ErrorCode.FORBIDDEN.getMessage());

        return ResponseEntity
                .status(ErrorCode.FORBIDDEN.getStatusCode())
                .body(apiResponse);
    }


    @MessageExceptionHandler(IllegalArgumentException.class)
    public void handleIllegalArgumentException(IllegalArgumentException ex, Principal principal) {
        if (principal == null) {
            return;
        }

        ApiResponse<Object> response = ApiResponse.builder()
                .code(ErrorCode.REQUEST_BODY_INVALID.getCode())
                .message(ex.getMessage())
                .build();

        messagingTemplate.convertAndSendToUser(
                principal.getName(),
                "/queue/nearby-shops-error",
                response
        );
    }

    @MessageExceptionHandler(Exception.class)
    public void handleGeneralException(Exception ex, Principal principal) {
        if (principal == null) {
            return;
        }

        ApiResponse<Object> response = ApiResponse.builder()
                .code(ErrorCode.UNCATEGORIZED_EXCEPTION.getCode())
                .message(ErrorCode.UNCATEGORIZED_EXCEPTION.getMessage())
                .build();

        messagingTemplate.convertAndSendToUser(
                principal.getName(),
                "/queue/nearby-shops-error",
                response
        );
    }

}
