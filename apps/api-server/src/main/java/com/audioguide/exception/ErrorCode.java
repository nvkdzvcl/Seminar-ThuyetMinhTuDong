package com.audioguide.exception;


import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;


@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION( "UNCATEGORIZED_EXCEPTION", HttpStatus.INTERNAL_SERVER_ERROR, "Uncategorized error"),

    ROLE_INVALID("ROLE_INVALID", HttpStatus.BAD_REQUEST, "Role is invalid"),
    STATUS_INVALID("STATUS_INVALID", HttpStatus.BAD_REQUEST, "Status is invalid"),
    REQUEST_BODY_INVALID("REQUEST_BODY_INVALID", HttpStatus.BAD_REQUEST, "Request body is invalid"),


    EMAIL_EXISTS( "EMAIL_EXISTS", HttpStatus.BAD_REQUEST, "Email is already existed"),
    PHONE_NUMBER_EXISTS( "PHONE_NUMBER_EXISTS", HttpStatus.BAD_REQUEST, "Phone number is already existed"),
    USER_NOT_FOUND( "USER_NOT_FOUND", HttpStatus.NOT_FOUND, "User not found"),
    INVALID_PAGE_NUMBER( "INVALID_PAGE_NUMBER", HttpStatus.BAD_REQUEST, "Page number must be greater than or equal to 1"),
    INVALID_PAGE_SIZE( "INVALID_PAGE_SIZE", HttpStatus.BAD_REQUEST, "Page size must be between 1 and 10"),

    EMAIL_NOT_BLANK( "EMAIL_NOT_BLANK", HttpStatus.BAD_REQUEST, "Email is required"),
    PASSWORD_NOT_BLANK( "PASSWORD_NOT_BLANK", HttpStatus.BAD_REQUEST, "Password is required"),
    AUTHENTICATION_METHOD_NOT_SUPPORTED( "AUTHENTICATION_METHOD_NOT_SUPPORTED", HttpStatus.BAD_REQUEST, "Authentication method not supported"),
    ACCOUNT_DISABLED( "ACCOUNT_DISABLED", HttpStatus.FORBIDDEN, "Account is disabled"),

    SHOP_NOT_FOUND( "SHOP_NOT_FOUND", HttpStatus.NOT_FOUND, "Shop not found"),
    SHOP_TYPE_NOT_FOUND( "SHOP_TYPE_NOT_FOUND", HttpStatus.NOT_FOUND, "Shop type not found"),
    POI_NOT_FOUND( "POI_NOT_FOUND", HttpStatus.NOT_FOUND, "POI not found"),
    SHOP_CONTENT_BLOCKED_BY_AI("SHOP_CONTENT_BLOCKED_BY_AI", HttpStatus.BAD_REQUEST, "Mo ta co noi dung nhay cam/khong phu hop, vui long chinh sua truoc khi luu"),
    POI_APPROVAL_BLOCKED_BY_AI("POI_APPROVAL_BLOCKED_BY_AI", HttpStatus.BAD_REQUEST, "POI dang bi AI gan co rui ro cao, khong the duyet"),

    FORBIDDEN( "FORBIDDEN", HttpStatus.FORBIDDEN, "You do not have permission to access this resource"),
    USER_ALREADY_HAS_SHOP( "USER_ALREADY_HAS_SHOP", HttpStatus.BAD_REQUEST, "User already has a shop"),



    LANGUAGE_NAME_BLANK( "LANGUAGE_NAME_BLANK", HttpStatus.BAD_REQUEST, "Language name is required"),
    LANGUAGE_CODE_BLANK( "LANGUAGE_CODE_BLANK", HttpStatus.BAD_REQUEST, "Language code is required"),
    LANGUAGE_CODE_EXISTS( "LANGUAGE_CODE_EXISTS", HttpStatus.BAD_REQUEST, "Language code already exists"),
    LANGUAGE_NOT_FOUND( "LANGUAGE_NOT_FOUND", HttpStatus.NOT_FOUND, "Language not found"),
    AUTHORIZATION_DENIED ( "AUTHORIZATION_DENIED", HttpStatus.FORBIDDEN, "You do not have permission to perform this action"),
    AUDIO_DISH_ID_BLANK( "AUDIO_DISH_ID_BLANK", HttpStatus.BAD_REQUEST, "Dish ID is required for audio upload"),
    AUDIO_LANGUAGE_ID_BLANK( "AUDIO_LANGUAGE_ID_BLANK", HttpStatus.BAD_REQUEST, "Language ID is required for audio upload"),

    AUDIO_ALREADY_EXISTS( "AUDIO_ALREADY_EXISTS", HttpStatus.BAD_REQUEST, "Audio for this dish and language already exists"),
    AZURE_CONFIG_MISSING("AZURE_CONFIG_MISSING", HttpStatus.INTERNAL_SERVER_ERROR, "Azure configuration is missing"),
    AZURE_TTS_FAILED("AZURE_TTS_FAILED", HttpStatus.BAD_GATEWAY, "Cannot generate narration audio right now"),
    DISH_NOT_FOUND( "DISH_NOT_FOUND", HttpStatus.NOT_FOUND, "Dish not found"),
    DISH_NOT_AVAILABLE("DISH_NOT_AVAILABLE", HttpStatus.BAD_REQUEST, "Dish is unavailable or out of stock"),
    DISH_ID_NOT_BLANK("DISH_ID_NOT_BLANK", HttpStatus.BAD_REQUEST, "Dish ID is required"),
    ORDER_ITEM_QUANTITY_INVALID("ORDER_ITEM_QUANTITY_INVALID", HttpStatus.BAD_REQUEST, "Quantity must be at least 1"),
    DISH_IDS_EMPTY( "DISH_IDS_EMPTY", HttpStatus.BAD_REQUEST, "Dish IDs list cannot be empty"),
    SHOP_ID_NOT_BLANK( "SHOP_ID_NOT_BLANK", HttpStatus.BAD_REQUEST, "Shop ID is required for dish creation"),
    SHOP_NOT_ACTIVE("SHOP_NOT_ACTIVE", HttpStatus.BAD_REQUEST, "Shop is not active"),
    ORDER_NOT_FOUND( "ORDER_NOT_FOUND", HttpStatus.NOT_FOUND, "Order not found"),
    ORDER_STATUS_INVALID_TRANSITION("ORDER_STATUS_INVALID_TRANSITION", HttpStatus.BAD_REQUEST, "Order status transition is invalid"),
    ORDER_CUSTOMER_CANNOT_CANCEL_PREPARING("ORDER_CUSTOMER_CANNOT_CANCEL_PREPARING", HttpStatus.BAD_REQUEST, "Customer cannot cancel while order is preparing"),


    INVALID_LAT_LNG("INVALID_LAT_LNG", HttpStatus.BAD_REQUEST, "Latitude hoặc longitude không hợp lệ"),
    INVALID_RADIUS("INVALID_RADIUS", HttpStatus.BAD_REQUEST, "Radius phải lớn hơn 0"),

    TOUR_PLAN_NOT_FOUND( "TOUR_PLAN_NOT_FOUND", HttpStatus.NOT_FOUND, "Tour plan not found"),



    // authentication/authorization
    UNAUTHENTICATED( "UNAUTHENTICATED", HttpStatus.UNAUTHORIZED, "Unauthenticated"),
    UNAUTHORIZED( "UNAUTHORIZED", HttpStatus.FORBIDDEN, "You do not have permission"),
    TOKEN_INVALID( "TOKEN_INVALID", HttpStatus.BAD_REQUEST, "Token is invalid"),
    INVALID_CREDENTIALS( "INVALID_CREDENTIALS", HttpStatus.UNAUTHORIZED, "Invalid username or password"),
    ADMIN_PERMISSION_REQUIRED("ADMIN_PERMISSION_REQUIRED", HttpStatus.FORBIDDEN, "Admin permission required"),
    TOO_MANY_LOGIN_ATTEMPTS("TOO_MANY_LOGIN_ATTEMPTS", HttpStatus.TOO_MANY_REQUESTS, "Too many login attempts, please try again later"),
    METHOD_NOT_ALLOWED( "METHOD_NOT_ALLOWED", HttpStatus.METHOD_NOT_ALLOWED, "Method or endpoint not allowed"),
    NO_RESOURCE_FOUND("NO_RESOURCE_FOUND", HttpStatus.NOT_FOUND, "No resource found matching the request"),;



    ErrorCode( String code, HttpStatusCode httpStatusCode , String message) {
        this.code = code;
        this.statusCode = httpStatusCode;
        this.message = message;
    }

    private String code;
    private HttpStatusCode statusCode;
    private String message;

}
