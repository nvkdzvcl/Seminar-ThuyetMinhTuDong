package com.audioguide.configuration.security;

import com.audioguide.entity.AdminAuditLog;
import com.audioguide.service.AdminAuditLogService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AdminAuditLogFilter extends OncePerRequestFilter {

    AdminAuditLogService adminAuditLogService;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return !path.startsWith("/admin/");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        filterChain.doFilter(request, response);

        try {
            adminAuditLogService.write(
                    AdminAuditLog.builder()
                            .actorId(resolveActorId())
                            .actorEmail(resolveActorEmail())
                            .actorRole(resolveActorRole())
                            .method(request.getMethod())
                            .path(request.getRequestURI())
                            .statusCode(response.getStatus())
                            .ipAddress(resolveClientIp(request))
                            .userAgent(request.getHeader("User-Agent"))
                            .action(resolveAction(request))
                            .detail(request.getQueryString())
                            .createdAt(LocalDateTime.now())
                            .build()
            );
        } catch (Exception ex) {
            log.warn("Cannot write admin audit log", ex);
        }
    }

    private Integer resolveActorId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
            return null;
        }
        try {
            return Integer.parseInt(jwt.getSubject());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private String resolveActorEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
            return null;
        }
        return jwt.getClaimAsString("email");
    }

    private String resolveActorRole() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
            return null;
        }
        return jwt.getClaimAsString("scope");
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String resolveAction(HttpServletRequest request) {
        String path = request.getServletPath();
        if (path.endsWith("/login")) {
            return "login";
        }
        if (path.endsWith("/logout")) {
            return "logout";
        }
        if (path.endsWith("/refresh")) {
            return "refresh";
        }
        if (path.endsWith("/me")) {
            return "me";
        }
        return "admin_api";
    }
}
