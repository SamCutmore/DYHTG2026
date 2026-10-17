package xyz.negativeone.app.solver;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;

import org.springframework.stereotype.Component;

import tools.jackson.databind.json.JsonMapper;

import xyz.negativeone.app.auth.SessionService;
import xyz.negativeone.app.password.PasswordCredentialService;
import xyz.negativeone.app.persistence.MessageRepository;
import xyz.negativeone.app.persistence.PriceRepository;
import xyz.negativeone.app.persistence.UserRepository;
import xyz.negativeone.app.solver.solvers.ComparePriceSolver;
import xyz.negativeone.app.solver.solvers.ISolver;
import xyz.negativeone.app.solver.solvers.LoginSolver;
import xyz.negativeone.app.solver.solvers.LogoutSolver;
import xyz.negativeone.app.solver.solvers.ReadMessagesSolver;
import xyz.negativeone.app.solver.solvers.RegisterSolver;
import xyz.negativeone.app.solver.solvers.SendMessageSolver;

@Component
public class SolverDispatcher extends QueryParser {
	private final List<ISolver> solvers = new ArrayList<>();

	public SolverDispatcher(
			MessageRepository messages,
			PriceRepository prices,
			UserRepository users,
			PasswordCredentialService credentials,
			SessionService sessions,
			JsonMapper jsonMapper) {

		solvers.add(new SendMessageSolver(messages));
		solvers.add(new ReadMessagesSolver(messages, jsonMapper));
		solvers.add(new ComparePriceSolver(prices));
		solvers.add(new RegisterSolver(users, credentials));
		solvers.add(new LoginSolver(users, credentials, sessions, jsonMapper));
		solvers.add(new LogoutSolver(sessions));
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
