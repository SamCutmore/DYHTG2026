package xyz.negativeone.app.persistence;

import java.math.BigDecimal;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class MarketFillRepository {

	private final JdbcTemplate jdbc;

	public MarketFillRepository(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	public void insert(
			int typeId,
			int locationId,
			long buyOrderId,
			long sellOrderId,
			BigDecimal price,
			int quantity) {
		jdbc.update(
				"""
				INSERT INTO market_fills
				    (type_id, location_id, buy_order_id, sell_order_id, price, quantity)
				VALUES (?, ?, ?, ?, ?, ?)
				""",
				typeId,
				locationId,
				buyOrderId,
				sellOrderId,
				price,
				quantity);
	}
}
