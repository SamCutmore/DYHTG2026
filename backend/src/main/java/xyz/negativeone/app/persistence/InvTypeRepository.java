package xyz.negativeone.app.persistence;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class InvTypeRepository {

	private static final RowMapper<InvTypeRecord> MAPPER = (rs, rowNum) -> {
		BigDecimal basePrice = rs.getBigDecimal("base_price");
		int groupId = rs.getInt("market_group_id");
		Integer marketGroupId = rs.wasNull() ? null : groupId;
		return new InvTypeRecord(
				rs.getInt("type_id"),
				rs.getString("type_name"),
				rs.getString("description"),
				basePrice,
				rs.getBoolean("published"),
				marketGroupId);
	};

	private final JdbcTemplate jdbc;

	public InvTypeRepository(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	public List<InvTypeRecord> findByMarketGroup(int marketGroupId) {
		return jdbc.query(
				"""
				SELECT type_id, type_name, description, base_price, published, market_group_id
				FROM inv_types
				WHERE market_group_id = ? AND published = TRUE
				ORDER BY type_name
				""",
				MAPPER,
				marketGroupId);
	}

	public Optional<InvTypeRecord> findById(int typeId) {
		List<InvTypeRecord> rows = jdbc.query(
				"""
				SELECT type_id, type_name, description, base_price, published, market_group_id
				FROM inv_types
				WHERE type_id = ?
				""",
				MAPPER,
				typeId);
		if (rows.isEmpty()) {
			return Optional.empty();
		}
		return Optional.of(rows.get(0));
	}
}
