package xyz.negativeone.app.persistence;

import java.time.OffsetDateTime;

public record MessageRecord(OffsetDateTime date, String message) {
}
