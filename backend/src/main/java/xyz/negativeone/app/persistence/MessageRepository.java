package xyz.negativeone.app.persistence;

import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class MessageRepository {

	private final JdbcTemplate jdbc;

	public MessageRepository(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	public void insert(String body) {
		jdbc.update("INSERT INTO messages (body) VALUES (?)", body);
	}

	public List<MessageRecord> findBetween(OffsetDateTime from, OffsetDateTime to) {
		return jdbc.query(
				"SELECT created_at, body FROM messages WHERE created_at >= ? AND created_at <= ? ORDER BY created_at",
				(rs, rowNum) -> {
					Timestamp ts = rs.getTimestamp("created_at");
					OffsetDateTime date = ts.toInstant().atOffset(ZoneOffset.UTC);
					return new MessageRecord(date, rs.getString("body"));
				},
				Timestamp.from(from.toInstant()),
				Timestamp.from(to.toInstant()));
	}
}
