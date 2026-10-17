package xyz.negativeone.app.solver.solvers;

import java.util.regex.Matcher;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import xyz.negativeone.app.persistence.MessageRepository;
import xyz.negativeone.app.solver.Query;

public class SendMessageSolver extends RegexSolver {
	private static final Logger logger = LoggerFactory.getLogger(SendMessageSolver.class);

	private final MessageRepository messages;

	public SendMessageSolver(MessageRepository messages) {
		super("(?s)^(.+)$");
		this.messages = messages;
	}

	@Override
	public Matcher match(Query query) {
		if (!"sendMessage".equalsIgnoreCase(query.token()))
			return null;
		return super.match(query);
	}

	@Override
	public String solve(Matcher m) {
		String body = m.group(1);
		messages.insert(body);
		logger.info("Stored message: {}", body);
		return "OK";
	}
}
