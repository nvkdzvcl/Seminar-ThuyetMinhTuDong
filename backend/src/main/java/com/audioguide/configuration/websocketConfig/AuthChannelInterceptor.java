package com.audioguide.configuration.websocketConfig;

import com.audioguide.service.AuthenticationService;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jwt.SignedJWT;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.text.ParseException;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuthChannelInterceptor implements ChannelInterceptor {

    private final AuthenticationService authenticationService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            log.info("Authorization header = {}", authHeader);

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                log.error("Missing or invalid Authorization header");
                throw new IllegalArgumentException("Missing or invalid Authorization header");
            }

            try {
                String token = authHeader.substring(7).trim();

                SignedJWT signedJWT = authenticationService.verifyToken(token);
                String userId = signedJWT.getJWTClaimsSet().getSubject();

                log.info("Verified userId = {}", userId);

                accessor.setUser(new StompPrincipal(userId));
                log.info("WebSocket Principal set successfully for userId = {}", userId);

            } catch (JOSEException | ParseException e) {
                log.error("WebSocket authentication failed: {}", e.getMessage(), e);
                throw new IllegalArgumentException("WebSocket authentication failed");
            } catch (Exception e) {
                log.error("Unexpected error during WebSocket authentication: {}", e.getMessage(), e);
                throw new IllegalArgumentException("Unexpected WebSocket authentication error");
            }
        }

        if (accessor.getUser() != null) {
            log.info("Current WebSocket user = {}", accessor.getUser().getName());
        }

        return message;
    }

    public static class StompPrincipal implements Principal {
        private final String name;

        public StompPrincipal(String name) {
            this.name = name;
        }

        @Override
        public String getName() {
            return name;
        }
    }
}