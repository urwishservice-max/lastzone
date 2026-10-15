<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=lastzone_db', 'root', '');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Check current counts
$userCount = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
echo "Current users in DB: $userCount\n";

if ($userCount == 0) {
    echo "Inserting users...\n";
    $pdo->exec("INSERT INTO users (id, username, email, password_hash, display_name, role) VALUES
    (1, 'dharnidharan', 'dharnidharan@cit.edu.in', '$2a$12$e8YFeqKjL92uQjHw7b09eu8kQ0i2V9T3L2yq5L1m.P7mX.O0O1.2W', 'DHARNIDHARAN V', 'ROLE_ADMIN'),
    (2, 'ghost_recon', 'ghost@cit.edu.in', '$2a$12$e8YFeqKjL92uQjHw7b09eu8kQ0i2V9T3L2yq5L1m.P7mX.O0O1.2W', 'Alex Mercer', 'ROLE_USER'),
    (3, 'spartan_117', 'spartan@cit.edu.in', '$2a$12$e8YFeqKjL92uQjHw7b09eu8kQ0i2V9T3L2yq5L1m.P7mX.O0O1.2W', 'Master Chief', 'ROLE_USER'),
    (4, 'valkyrie', 'valkyrie@cit.edu.in', '$2a$12$e8YFeqKjL92uQjHw7b09eu8kQ0i2V9T3L2yq5L1m.P7mX.O0O1.2W', 'Sarah Connor', 'ROLE_USER'),
    (5, 'shadow_hunter', 'shadow@cit.edu.in', '$2a$12$e8YFeqKjL92uQjHw7b09eu8kQ0i2V9T3L2yq5L1m.P7mX.O0O1.2W', 'Marcus Fenix', 'ROLE_USER')");
}

$runCount = $pdo->query("SELECT COUNT(*) FROM game_runs")->fetchColumn();
echo "Current game_runs in DB: $runCount\n";

if ($runCount == 0) {
    echo "Inserting game runs (scores)...\n";
    $pdo->exec("INSERT INTO game_runs (user_id, run_token, score, kills, wave, survival_duration, status) VALUES
    (1, 'RUN-TOURNAMENT-2026-001', 98450, 184, 15, 842, 'COMPLETED'),
    (2, 'RUN-TOURNAMENT-2026-002', 84200, 152, 12, 695, 'COMPLETED'),
    (3, 'RUN-TOURNAMENT-2026-003', 76100, 138, 11, 610, 'COMPLETED'),
    (4, 'RUN-TOURNAMENT-2026-004', 59300, 96, 9, 480, 'COMPLETED'),
    (5, 'RUN-TOURNAMENT-2026-005', 42150, 71, 7, 365, 'COMPLETED')");
}

$rankCount = $pdo->query("SELECT COUNT(*) FROM leaderboard_ranks")->fetchColumn();
if ($rankCount == 0) {
    echo "Populating leaderboard_ranks...\n";
    $pdo->exec("INSERT INTO leaderboard_ranks (rank_position, user_id, username, display_name, score, kills, wave, survival_duration, played_at) VALUES
    (1, 1, 'dharnidharan', 'DHARNIDHARAN V', 98450, 184, 15, 842, NOW()),
    (2, 2, 'ghost_recon', 'Alex Mercer', 84200, 152, 12, 695, NOW()),
    (3, 3, 'spartan_117', 'Master Chief', 76100, 138, 11, 610, NOW()),
    (4, 4, 'valkyrie', 'Sarah Connor', 59300, 96, 9, 480, NOW()),
    (5, 5, 'shadow_hunter', 'Marcus Fenix', 42150, 71, 7, 365, NOW())");
}

echo "\n================= VERIFICATION OUTPUT =================\n";
echo "TABLE: users (Login Details)\n";
$stmt = $pdo->query("SELECT id, username, email, display_name, role FROM users");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "  [ID {$row['id']}] Username: {$row['username']} | Email: {$row['email']} | Name: {$row['display_name']} | Role: {$row['role']}\n";
}

echo "\nTABLE: game_runs (Match Scores & Telemetry)\n";
$stmt = $pdo->query("SELECT id, user_id, run_token, score, kills, wave, survival_duration, status FROM game_runs ORDER BY score DESC");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "  [Run {$row['id']}] User #{$row['user_id']} | Token: {$row['run_token']} | Score: {$row['score']} | Kills: {$row['kills']} | Wave: {$row['wave']} | Duration: {$row['survival_duration']}s\n";
}

echo "\nTABLE: leaderboard_ranks (Calculated Ranks)\n";
$stmt = $pdo->query("SELECT rank_position, username, display_name, score, kills, wave, survival_duration FROM leaderboard_ranks ORDER BY rank_position ASC");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "  Rank #{$row['rank_position']} - {$row['display_name']} (@{$row['username']}) -> Score: {$row['score']} | Kills: {$row['kills']} | Wave: {$row['wave']} | Time: {$row['survival_duration']}s\n";
}
echo "=======================================================\n";
?>
