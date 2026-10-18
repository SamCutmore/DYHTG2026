package xyz.negativeone.app.persistence;

import java.time.OffsetDateTime;

/**
 * @deprecated Used only by deprecated message solvers; not part of the market API.
 */
@Deprecated(since = "0.0.1", forRemoval = false)
public record MessageRecord(OffsetDateTime date, String message) {}
