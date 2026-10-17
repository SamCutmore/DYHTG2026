package xyz.negativeone.app.solver;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;

import org.springframework.stereotype.Component;

import tools.jackson.databind.json.JsonMapper;

import xyz.negativeone.app.persistence.MessageRepository;
import xyz.negativeone.app.solver.solvers.ISolver;
import xyz.negativeone.app.solver.solvers.ReadMessagesSolver;
import xyz.negativeone.app.solver.solvers.SendMessageSolver;

@Component
public class SolverDispatcher extends QueryParser {
	private final List<ISolver> solvers = new ArrayList<>();

	public SolverDispatcher(MessageRepository messages, JsonMapper jsonMapper) {
		solvers.add(new SendMessageSolver(messages));
		solvers.add(new ReadMessagesSolver(messages, jsonMapper));
	}

	@Override
	public String solve(String question) throws IllegalArgumentException {
		Query q = super.parse(question);
		Matcher m;
		for (ISolver solver : solvers) {
			m = solver.match(q);
			if (null == m)
				continue;
			return solver.solve(m);
		}
		return null;
	}
}
