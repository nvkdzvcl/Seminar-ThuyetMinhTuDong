package com.audioguide.service;

import com.nimbusds.jwt.SignedJWT;
import java.text.ParseException;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class TokenBlocklistService {
    private final Map<String, Instant> revokedTokenIds = new ConcurrentHashMap<>();

    public void revoke(SignedJWT signedJWT) throws ParseException {
        String jwtId = signedJWT.getJWTClaimsSet().getJWTID();
        Date exp = signedJWT.getJWTClaimsSet().getExpirationTime();

        if (jwtId == null || exp == null) {
            return;
        }
        cleanup();
        revokedTokenIds.put(jwtId, exp.toInstant());
    }

    public boolean isRevoked(String jwtId) {
        if (jwtId == null) {
            return false;
        }
        cleanup();
        return revokedTokenIds.containsKey(jwtId);
    }

    private void cleanup() {
        Instant now = Instant.now();
        revokedTokenIds.entrySet().removeIf(entry -> now.isAfter(entry.getValue()));
    }
}
