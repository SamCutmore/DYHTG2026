
package xyz.negativeone.app.solver.solvers;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import xyz.negativeone.app.persistence.PriceRecord;
import xyz.negativeone.app.persistence.PriceRepository;
import xyz.negativeone.app.solver.Query;

public class ComparePriceSolver implements ISolver {

    private final PriceRepository repository;

    public ComparePriceSolver(PriceRepository repository) {
        this.repository = repository;
    }

    @Override
    public Matcher match(Query query) {

        if (!query.token().equalsIgnoreCase("price")) {
            return null;
        }

        Pattern pattern = Pattern.compile(
            "compare price of (.+)",
            Pattern.CASE_INSENSITIVE
        );

        Matcher matcher = pattern.matcher(query.question());

        return matcher.matches() ? matcher : null;
    }

    @Override
    public String solve(Matcher matcher) {
        repository.checkDatabase();
        String productName = matcher.group(1).trim();

        List<PriceRecord> results =
            repository.findCheapest(productName);

        if (results.isEmpty()) {
            return "Product not found";
        }

        PriceRecord cheapest = results.get(0);

        return String.format(
            "Cheapest %s: %s at £%s (ID: %d)",
            cheapest.name(),
            cheapest.site(),
            cheapest.price(),
            cheapest.id()
        );
    }
}
