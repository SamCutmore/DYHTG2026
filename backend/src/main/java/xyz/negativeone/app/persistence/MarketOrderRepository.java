package xyz.negativeone.app.persistence;

import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class MarketOrderRepository {

	private static final RowMapper<MarketOrderRecord> MAPPER = (rs, rowNum) -> new MarketOrderRecord(
			rs.getLong("order_id"),
			rs.getInt("type_id"),
			rs.getInt("location_id"),
			rs.getInt("source_id"),
			rs.getString("side"),
			rs.getBigDecimal("price"),
			rs.getInt("quantity"),
			rs.getInt("quantity_initial"),
			rs.getString("status"),
			rs.getString("external_url"),
			rs.getString("owner_kind"),
			rs.getString("owner_ref"));

	private final JdbcTemplate jdbc;

	public MarketOrderRepository(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	public List<MarketOrderRecord> findOpenBuys(int typeId, int locationId) {
		return jdbc.query(
				"""
				SELECT order_id, type_id, location_id, source_id, side, price, quantity,
				       quantity_initial, status, external_url, owner_kind, owner_ref
				FROM market_orders
				WHERE type_id = ? AND location_id = ?
				  AND side = 'buy' AND status IN ('open', 'partial') AND quantity > 0
				ORDER BY price DESC, created_at ASC
				""",
				MAPPER,
				typeId,
				locationId);
	}

	public List<MarketOrderRecord> findOpenSells(int typeId, int locationId) {
		return jdbc.query(
				"""
				SELECT order_id, type_id, location_id, source_id, side, price, quantity,
				       quantity_initial, status, external_url, owner_kind, owner_ref
				FROM market_orders
				WHERE type_id = ? AND location_id = ?
				  AND side = 'sell' AND status IN ('open', 'partial') AND quantity > 0
				ORDER BY price ASC, created_at ASC
				""",
				MAPPER,
				typeId,
				locationId);
	}

	public OrderBookRecord findOpenBook(int typeId, int locationId) {
		return new OrderBookRecord(
				typeId,
				locationId,
				findOpenBuys(typeId, locationId),
				findOpenSells(typeId, locationId));
	}
}
