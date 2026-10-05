import java.nio.file.*;
import java.sql.*;
import java.util.*;

// Runs the real shop upsert twice and rolls back all verification rows.
class VerifyShop {
    public static void main(String[] args) throws Exception {
        Properties config = new Properties();
        Path local = Path.of("application-local.properties");
        if (Files.exists(local)) try(var in = Files.newInputStream(local)) { config.load(in); }
        Map<String,String> env = new HashMap<>(System.getenv());
        Path dotenv = Path.of(".env");
        if(Files.exists(dotenv)) for(String line:Files.readAllLines(dotenv)) {
            int i=line.indexOf('='); if(i>0 && !line.stripLeading().startsWith("#")) env.putIfAbsent(line.substring(0,i).trim(),line.substring(i+1).trim().replaceAll("^['\"]|['\"]$", ""));
        }
        String url = config.getProperty("spring.datasource.url",env.getOrDefault("DB_URL","jdbc:postgresql://localhost:5433/lootvault"));
        String user = config.getProperty("spring.datasource.username",env.getOrDefault("DB_USERNAME","lootvault"));
        String pass = config.getProperty("spring.datasource.password",env.getOrDefault("DB_PASSWORD",""));
        if(url.startsWith("${")) url=env.getOrDefault("DB_URL","jdbc:postgresql://localhost:5433/lootvault");
        if(user.startsWith("${")) user=env.getOrDefault("DB_USERNAME","lootvault");
        if(pass.startsWith("${")) pass=env.getOrDefault("DB_PASSWORD","");
        String source=Files.readString(Path.of("src/main/java/com/example/lootvaultproject/VaultRepository/ShopOfferRepository.java"));
        String sql=source.substring(source.indexOf("\"\"\"")+3,source.lastIndexOf("\"\"\"")).replace(":weekKey","'2099-W01'");
        try(Connection connection=DriverManager.getConnection(url,user,pass)) {
            connection.setAutoCommit(false);
            try(Statement statement=connection.createStatement()) {
                statement.executeUpdate(sql);
                int first=count(statement);
                statement.executeUpdate(sql);
                if(first<9 || first!=count(statement)) throw new AssertionError("Shop count or idempotency failed");
                try(ResultSet rows=statement.executeQuery("SELECT c.rarity,o.price_amount FROM shop_offers o JOIN item_catalog c ON c.id=o.item_catalog_id WHERE week_key='2099-W01' AND c.rarity IN ('EXTRAORDINARY','EXTRA_EXTRAORDINARY')")) {
                    int checked=0; while(rows.next()) { if(rows.getLong(2)!=(rows.getString(1).equals("EXTRAORDINARY")?12000:60000)) throw new AssertionError("Rare price mismatch"); checked++; } if(checked!=4) throw new AssertionError("Rare offers missing");
                }
                System.out.println("PostgreSQL shop verified: "+first+" unique offers, stable retries, 12,000 / 60,000 rare prices. All verification writes rolled back.");
            } finally {connection.rollback();}
        }
    }
    static int count(Statement statement) throws SQLException {try(ResultSet r=statement.executeQuery("SELECT count(*) FROM shop_offers WHERE week_key='2099-W01'")){r.next();return r.getInt(1);}}
}
