package xyz.negativeone.app.persistence;

import java.math.BigDecimal;
import java.time.Instant;

public record MarketOrderRecord(
		long orderId,
		int typeId,
		int locationId,
		int sourceId,
		String side,
		BigDecimal price,
		int quantity,
		int quantityInitial,
		String status,
		String externalUrl,
		String ownerKind,
		String ownerRef,
		Integer userId,
		Instant expiresAt,
		Instant createdAt,
		Instant updatedAt) {
}
