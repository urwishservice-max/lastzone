<?php
$mysqli = new mysqli('127.0.0.1', 'root', '', 'lastzone_db');
if ($mysqli->connect_error) {
    die("Connect Error: " . $mysqli->connect_error . "\n");
}
echo "Connected to lastzone_db successfully!\n\n";

echo "--- TABLES IN lastzone_db ---\n";
$res = $mysqli->query("SHOW TABLES");
while ($row = $res->fetch_array()) {
    echo "- " . $row[0] . "\n";
}

echo "\n--- USERS (Login Details) ---\n";
$res = $mysqli->query("SELECT id, username, email, display_name, role, created_at FROM users");
while ($row = $res->fetch_assoc()) {
    echo "ID: {$row['id']} | User: {$row['username']} | Email: {$row['email']} | Role: {$row['role']}\n";
}

echo "\n--- LEADERBOARD (Scores & Ranks) ---\n";
$sql = "SELECT 
    ROW_NUMBER() OVER (ORDER BY gr.score DESC, gr.kills DESC, gr.survival_duration DESC) AS rank_num,
    u.username,
    u.display_name,
    gr.score,
    gr.kills,
    gr.wave,
    gr.survival_duration,
    gr.status
FROM game_runs gr
JOIN users u ON gr.user_id = u.id
ORDER BY gr.score DESC";

$res = $mysqli->query($sql);
while ($row = $res->fetch_assoc()) {
    echo "#{$row['rank_num']} - {$row['display_name']} (@{$row['username']}) | Score: {$row['score']} | Kills: {$row['kills']} | Wave: {$row['wave']} | Time: {$row['survival_duration']}s\n";
}
?>
