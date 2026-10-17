package xyz.negativeone.app.persistence;

import java.math.BigDecimal;

public record PriceRecord(
    long id,
    String name,
    String site,
    BigDecimal price,
    String location
) {}
