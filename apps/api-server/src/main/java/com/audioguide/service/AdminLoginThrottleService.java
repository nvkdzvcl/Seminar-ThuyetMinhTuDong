package com.audioguide.service;

import com.audioguide.exception.AppException;
import com.audioguide.exception.ErrorCode;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.stereotype.Service;

@Service
public class AdminLoginThrottleService {
    private static final int MAX_ATTEMPTS = 5;
    private static final Duration WINDOW = Duration.ofMinutes(10);
    private static final Duration LOCK_DURATION = Duration.ofMinutes(15);

    private final Map<String, AttemptState> attempts = new ConcurrentHashMap<>();

    public void assertAllowed(String key) {
        AttemptState state = attempts.get(key);
        if (state == null) {
            return;
        }

        Instant now = Instant.now();
        if (state.lockedUntil != null && now.isBefore(state.lockedUntil)) {
            throw new AppException(ErrorCode.TOO_MANY_LOGIN_ATTEMPTS);
        }

        if (state.lockedUntil != null && now.isAfter(state.lockedUntil)) {
            attempts.remove(key);
        }
    }

    public void recordFailure(String key) {
        Instant now = Instant.now();

        attempts.compute(key, (ignoredKey, previous) -> {
            AttemptState state = previous;
            if (state == null || Duration.between(state.windowStart, now).compareTo(WINDOW) > 0) {
                state = new AttemptState(0, now, null);
            }

            int next = state.failedAttempts + 1;
            Instant lockedUntil = next >= MAX_ATTEMPTS ? now.plus(LOCK_DURATION) : state.lockedUntil;
            return new AttemptState(next, state.windowStart, lockedUntil);
        });
    }

    public void recordSuccess(String key) {
        attempts.remove(key);
    }

    @Data
    @AllArgsConstructor
    private static class AttemptState {
        int failedAttempts;
        Instant windowStart;
        Instant lockedUntil;
    }
}
