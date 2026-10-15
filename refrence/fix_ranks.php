<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=lastzone_db', 'root', '');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Recreate leaderboard_ranks cleanly
$pdo->exec("DROP TABLE IF EXISTS leaderboard_ranks");
$pdo->exec("CREATE TABLE leaderboard_ranks (
    rank_position INT NOT NULL PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    username VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    score INT NOT NULL,
    kills INT NOT NULL,
    wave INT NOT NULL,
    survival_duration INT NOT NULL,
    played_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

$pdo->exec("INSERT INTO leaderboard_ranks (rank_position, user_id, username, display_name, score, kills, wave, survival_duration, played_at) VALUES
(1, 1, 'dharnidharan', 'DHARNIDHARAN V', 98450, 184, 15, 842, NOW()),
(2, 2, 'ghost_recon', 'Alex Mercer', 84200, 152, 12, 695, NOW()),
(3, 3, 'spartan_117', 'Master Chief', 76100, 138, 11, 610, NOW()),
(4, 4, 'valkyrie', 'Sarah Connor', 59300, 96, 9, 480, NOW()),
(5, 5, 'shadow_hunter', 'Marcus Fenix', 42150, 71, 7, 365, NOW())");

// Create dynamic SQL view for automatic ranks
$pdo->exec("CREATE OR REPLACE VIEW v_leaderboard AS
SELECT 
    ROW_NUMBER() OVER (ORDER BY gr.score DESC, gr.kills DESC, gr.survival_duration DESC) AS calculated_rank,
    gr.id AS run_id,
    u.id AS user_id,
    u.username,
    u.display_name,
    gr.score,
    gr.kills,
    gr.wave,
    gr.survival_duration,
    gr.status,
    gr.created_at AS played_at
FROM game_runs gr
JOIN users u ON gr.user_id = u.id");

echo "\n================= VERIFICATION OUTPUT =================\n";
echo "TABLE: users (Login Details & Credentials)\n";
$stmt = $pdo->query("SELECT id, username, email, display_name, role FROM users");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "  [ID {$row['id']}] Username: {$row['username']} | Email: {$row['email']} | Name: {$row['display_name']} | Role: {$row['role']}\n";
}

echo "\nTABLE: game_runs (Scores, Kills, Wave, Survival Telemetry)\n";
$stmt = $pdo->query("SELECT id, user_id, run_token, score, kills, wave, survival_duration, status FROM game_runs ORDER BY score DESC");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "  [Run {$row['id']}] User #{$row['user_id']} | Token: {$row['run_token']} | Score: {$row['score']} | Kills: {$row['kills']} | Wave: {$row['wave']} | Duration: {$row['survival_duration']}s\n";
}

echo "\nTABLE: leaderboard_ranks (Rankings & Leaderboard)\n";
$stmt = $pdo->query("SELECT rank_position, username, display_name, score, kills, wave, survival_duration FROM leaderboard_ranks ORDER BY rank_position ASC");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "  Rank #{$row['rank_position']} - {$row['display_name']} (@{$row['username']}) -> Score: {$row['score']} | Kills: {$row['kills']} | Wave: {$row['wave']} | Time: {$row['survival_duration']}s\n";
}
echo "=======================================================\n";
?>
