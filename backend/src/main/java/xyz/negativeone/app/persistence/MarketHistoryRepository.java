package xyz.negativeone.app.persistence;

import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class MarketHistoryRepository {

	private static final RowMapper<MarketHistoryRecord> MAPPER = (rs, rowNum) -> new MarketHistoryRecord(
			rs.getInt("location_id"),
			rs.getInt("type_id"),
			rs.getDate("date").toLocalDate(),
			rs.getBigDecimal("low_price"),
			rs.getBigDecimal("high_price"),
			rs.getBigDecimal("avg_price"),
			rs.getLong("volume"),
			rs.getLong("orders"));

	private final JdbcTemplate jdbc;

	public MarketHistoryRepository(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	public List<MarketHistoryRecord> findByTypeAndLocation(int typeId, int locationId) {
		return jdbc.query(
				"""
				SELECT location_id, type_id, date, low_price, high_price, avg_price, volume, orders
				FROM market_history
				WHERE type_id = ? AND location_id = ?
				ORDER BY date ASC
				""",
				MAPPER,
				typeId,
				locationId);
	}
}
