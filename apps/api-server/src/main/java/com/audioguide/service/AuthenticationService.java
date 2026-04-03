package com.audioguide.service;


import com.audioguide.dto.authDTO.LoginRequest;
import com.audioguide.dto.authDTO.LoginResponse;
import com.audioguide.dto.authDTO.RefreshTokenRequest;
import com.audioguide.dto.userDTO.UserResponse;
import com.audioguide.entity.User;
import com.audioguide.enums.UserRole;
import com.audioguide.enums.UserStatus;
import com.audioguide.exception.AppException;
import com.audioguide.exception.ErrorCode;
import com.audioguide.mapper.UserMapper;
import com.audioguide.repository.UserRepository;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationService {

    @NonFinal
    @Value("${jwt.signerKey}")
    protected  String SIGNER_KEY ;

    UserMapper userMapper;
    UserRepository userRepository;
    TokenBlocklistService tokenBlocklistService;



    public boolean introspect (String token)
            throws JOSEException, ParseException {

        boolean isValid = true;
        try {
            verifyToken(token);
        } catch (AppException e) {
            isValid = false;
        }
        return isValid;
    }


    public UserResponse getUserFromToken() throws JOSEException, ParseException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Jwt jwt = (Jwt) authentication.getPrincipal();
        String userId = jwt.getSubject();
        User user = userRepository.findById(Integer.valueOf(userId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return userMapper.toUserResponseFromUser(user);
    }

    public UserResponse updateCurrentUserLanguage(String language) {
        if (language == null || language.trim().isEmpty()) {
            throw new AppException(ErrorCode.REQUEST_BODY_INVALID);
        }

        Integer userId = getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        user.setLanguage(language.trim());
        User savedUser = userRepository.save(user);
        return userMapper.toUserResponseFromUser(savedUser);
    }


    public SignedJWT verifyToken(String token) throws JOSEException, ParseException {
        JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes());

        SignedJWT signedJWT = SignedJWT.parse(token);

        Date expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();
        String jwtId = signedJWT.getJWTClaimsSet().getJWTID();

        var verified = signedJWT.verify(verifier);
        if (!(verified && expiryTime.after(new Date()))){
            log.error("token invalid or expired");
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        if (tokenBlocklistService.isRevoked(jwtId)) {
            log.error("token is revoked");
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        log.info("token verified for user: {}", signedJWT.getJWTClaimsSet().getSubject());
        return signedJWT;
    }


    public LoginResponse authenticate(LoginRequest request){
        User
            user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        if(user.getStatus() != UserStatus.ACTIVE){
            log.error("User with email {} is not active", request.getEmail());
            throw new AppException(ErrorCode.ACCOUNT_DISABLED);
        }


        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
        boolean authenticated = passwordEncoder.matches(request.getPassword(), user.getPassword());

        if(!authenticated){
            log.error("Password mismatch for user: {}", request.getEmail());;
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        log.info("check id = {} and createdAt = {} ", user.getId(), user.getCreatedAt());

        var accessToken = generateToken(user, 24 * 7, "ACCESS");
        var refreshToken = generateToken(user, 24 * 30, "REFRESH");
        UserResponse userResponse = userMapper.toUserResponseFromUser(user);
        log.info("check id = {} and createdAt = {} ", userResponse.getId(), userResponse.getCreatedAt());

        log.info("user {} authenticated successfully", user.getEmail());
        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(userResponse)
                .authenticated(true)
                .build();

    }

    public LoginResponse authenticateAdmin(LoginRequest request){
        LoginResponse response = authenticate(request);
        assertAdminRole(response.getUser().getRole());
        return response;
    }

    public LoginResponse refreshAdminToken(RefreshTokenRequest request) throws ParseException, JOSEException {
        SignedJWT signedRefreshToken = verifyToken(request.getRefreshToken());
        String tokenType = signedRefreshToken.getJWTClaimsSet().getStringClaim("tokenType");
        if (!"REFRESH".equals(tokenType)) {
            throw new AppException(ErrorCode.TOKEN_INVALID);
        }
        Integer userId = Integer.valueOf(signedRefreshToken.getJWTClaimsSet().getSubject());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        assertAdminRole(user.getRole().name());

        tokenBlocklistService.revoke(signedRefreshToken);

        return LoginResponse.builder()
                .accessToken(generateToken(user, 24 * 7, "ACCESS"))
                .refreshToken(generateToken(user, 24 * 30, "REFRESH"))
                .user(userMapper.toUserResponseFromUser(user))
                .authenticated(true)
                .build();
    }

    public void logout(String bearerToken) throws ParseException, JOSEException {
        if (bearerToken == null || bearerToken.isBlank()) {
            return;
        }

        String token = bearerToken.replace("Bearer ", "").trim();
        if (token.isBlank()) {
            return;
        }

        SignedJWT signedJWT = verifyToken(token);
        tokenBlocklistService.revoke(signedJWT);
    }

    public UserResponse getCurrentAdminUser() throws JOSEException, ParseException {
        UserResponse user = getUserFromToken();
        assertAdminRole(user.getRole());
        return user;
    }

    private Integer getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        try {
            return Integer.parseInt(authentication.getName());
        } catch (NumberFormatException exception) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
    }

    private void assertAdminRole(String role) {
        boolean isAdmin = UserRole.ADMIN.name().equals(role) || UserRole.SUPER_ADMIN.name().equals(role);
        if (!isAdmin) {
            throw new AppException(ErrorCode.ADMIN_PERMISSION_REQUIRED);
        }
    }



    public String generateToken(User user, int hours){
        return generateToken(user, hours, "ACCESS");
    }

    public String generateToken(User user, int hours, String tokenType){
        JWSHeader jwsHeader = new JWSHeader(JWSAlgorithm.HS512);
        JWTClaimsSet jwtClaimSet = new JWTClaimsSet.Builder()
                .subject(user.getId().toString())
                .issueTime(new Date())
                .issuer("vinhkhanhfoodtour.com")
                .expirationTime(new Date(
                        Instant.now().plus(hours, ChronoUnit.HOURS).toEpochMilli()
                ))
                .jwtID(UUID.randomUUID().toString())
                .claim("scope", user.getRole().name())
                .claim("email", user.getEmail())
                .claim("tokenType", tokenType)
//                .claim("scope", buildScope(user))
                .build();

        Payload payload = new Payload(jwtClaimSet.toJSONObject());

        JWSObject jwsObject = new JWSObject(jwsHeader, payload);

        try {
            jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
            log.info("JWT token created successfully");
            return jwsObject.serialize();
        } catch (JOSEException e) {
            log.error("cannot create token");
            throw new RuntimeException(e);
        }
    }

}
