
package xyz.negativeone.app.persistence;

import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class PriceRepository {

    private final JdbcTemplate jdbc;

    public PriceRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<PriceRecord> findCheapest(String name) {
        String sql = """
            SELECT id, name, site, price, location
            FROM prices
            WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))
            ORDER BY price ASC, id ASC
            LIMIT 1
            """;

        return jdbc.query(sql, (rs, rowNum) ->
            new PriceRecord(
                rs.getLong("id"),
                rs.getString("name"),
                rs.getString("site"),
                rs.getBigDecimal("price"),
                rs.getString("location")
            ), name);
    }
    public void checkDatabase() {
        Integer count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM prices",
            Integer.class
        );

        System.out.println("Number of records: " + count);
    }
}