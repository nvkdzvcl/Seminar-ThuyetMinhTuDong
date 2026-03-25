package com.audioguide.utils;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class CoordinateParserUtil {

    private static final Pattern DMS_PATTERN = Pattern.compile(
            "(\\d+(?:[.,]\\d+)?)\\s*°\\s*(\\d+(?:[.,]\\d+)?)?\\s*['’′]?\\s*(\\d+(?:[.,]\\d+)?)?\\s*(?:[\"”″])?\\s*([NSEW])",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern NUMBER_PATTERN = Pattern.compile("-?\\d+(?:[.,]\\d+)?");

    private CoordinateParserUtil() {
    }

    public static Optional<ParsedCoordinate> parseFlexible(String input) {
        if (input == null || input.trim().isEmpty()) {
            return Optional.empty();
        }

        String normalized = input.trim();
        Optional<ParsedCoordinate> dmsResult = parseDms(normalized);
        if (dmsResult.isPresent()) {
            return dmsResult;
        }

        return parseDecimal(normalized);
    }

    private static Optional<ParsedCoordinate> parseDms(String input) {
        Matcher matcher = DMS_PATTERN.matcher(input);
        Double lat = null;
        Double lng = null;

        while (matcher.find()) {
            double decimal = toDecimal(matcher.group(1), matcher.group(2), matcher.group(3));
            String direction = matcher.group(4).toUpperCase(Locale.ROOT);

            if ("N".equals(direction) || "S".equals(direction)) {
                lat = "S".equals(direction) ? -decimal : decimal;
            }
            if ("E".equals(direction) || "W".equals(direction)) {
                lng = "W".equals(direction) ? -decimal : decimal;
            }
        }

        if (lat == null || lng == null || !isValidRange(lat, lng)) {
            return Optional.empty();
        }
        return Optional.of(new ParsedCoordinate(lat, lng));
    }

    private static Optional<ParsedCoordinate> parseDecimal(String input) {
        String normalized = input.replace(';', ',');
        Matcher matcher = NUMBER_PATTERN.matcher(normalized);
        List<Double> values = new ArrayList<>();

        while (matcher.find() && values.size() < 2) {
            values.add(parseNumber(matcher.group()));
        }

        if (values.size() < 2) {
            return Optional.empty();
        }

        double lat = values.get(0);
        double lng = values.get(1);
        if (!isValidRange(lat, lng)) {
            return Optional.empty();
        }
        return Optional.of(new ParsedCoordinate(lat, lng));
    }

    private static double toDecimal(String degrees, String minutes, String seconds) {
        double deg = parseNumber(degrees);
        double min = minutes != null ? parseNumber(minutes) : 0.0;
        double sec = seconds != null ? parseNumber(seconds) : 0.0;
        return deg + (min / 60.0) + (sec / 3600.0);
    }

    private static double parseNumber(String value) {
        return Double.parseDouble(value.replace(',', '.'));
    }

    private static boolean isValidRange(double lat, double lng) {
        return lat >= -90.0 && lat <= 90.0 && lng >= -180.0 && lng <= 180.0;
    }

    public record ParsedCoordinate(double lat, double lng) {
    }
}

