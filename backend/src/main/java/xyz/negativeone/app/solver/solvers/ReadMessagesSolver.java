package xyz.negativeone.app.solver.solvers;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.regex.Matcher;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

import xyz.negativeone.app.persistence.MessageRecord;
import xyz.negativeone.app.persistence.MessageRepository;
import xyz.negativeone.app.solver.Query;

/**
 * @deprecated Early scaffold; not part of the market API.
 */
@Deprecated(since = "0.0.1", forRemoval = false)
public class ReadMessagesSolver extends RegexSolver {
	private static final Logger logger = LoggerFactory.getLogger(ReadMessagesSolver.class);

	private final MessageRepository messages;
	private final JsonMapper jsonMapper;

	public ReadMessagesSolver(MessageRepository messages, JsonMapper jsonMapper) {
		super("^(.+);(.+)$");
		this.messages = messages;
		this.jsonMapper = jsonMapper;
	}

	@Override
	public Matcher match(Query query) {
		if (!"readMessages".equalsIgnoreCase(query.token()))
			return null;
		return super.match(query);
	}

	@Override
	public String solve(Matcher m) {
		OffsetDateTime from = OffsetDateTime.parse(m.group(1).trim());
		OffsetDateTime to = OffsetDateTime.parse(m.group(2).trim());
		List<MessageRecord> rows = messages.findBetween(from, to);
		logger.info("Retrieved {} message(s) between {} and {}", rows.size(), from, to);
		try {
			return jsonMapper.writeValueAsString(rows);
		}
		catch (JacksonException e) {
			throw new IllegalArgumentException("Failed to serialize messages", e);
		}
	}
}
