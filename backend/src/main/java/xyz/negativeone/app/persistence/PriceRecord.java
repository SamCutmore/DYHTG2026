package xyz.negativeone.app.persistence;

import java.math.BigDecimal;

/**
 * @deprecated Used only by deprecated price-compare code; not part of the market API.
 */
@Deprecated(since = "0.0.1", forRemoval = false)
public record PriceRecord(
		long id,
		String name,
		String site,
		BigDecimal price,
		String location) {
}
