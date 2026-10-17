package xyz.negativeone.app.persistence;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

@Repository
public class MarketOrderRepository {

	/** App-originated orders (user buys placed through the API). */
	public static final int SOURCE_APP = 6;

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

	public long insertBuy(int typeId, int locationId, BigDecimal price, int quantity, String ownerRef) {
		KeyHolder keys = new GeneratedKeyHolder();
		jdbc.update(con -> {
			var ps = con.prepareStatement(
					"""
					INSERT INTO market_orders (
					    type_id, location_id, source_id, side, price, quantity, quantity_initial,
					    status, external_url, external_listing_id, owner_kind, owner_ref)
					VALUES (?, ?, ?, 'buy', ?, ?, ?, 'open', NULL, NULL, 'user', ?)
					""",
					new String[] { "order_id" });
			ps.setInt(1, typeId);
			ps.setInt(2, locationId);
			ps.setInt(3, SOURCE_APP);
			ps.setBigDecimal(4, price);
			ps.setInt(5, quantity);
			ps.setInt(6, quantity);
			ps.setString(7, ownerRef);
			return ps;
		}, keys);
		Number id = keys.getKey();
		if (id == null) {
			throw new IllegalStateException("Failed to insert buy order");
		}
		return id.longValue();
	}

	public void updateRemaining(long orderId, int quantity, String status) {
		jdbc.update(
				"""
				UPDATE market_orders
				SET quantity = ?, status = ?, updated_at = CURRENT_TIMESTAMP
				WHERE order_id = ?
				""",
				quantity,
				status,
				orderId);
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
