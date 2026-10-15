<?php
$m = new mysqli('127.0.0.1', 'root', '', 'lastzone_db');
if ($m->connect_error) {
    die("Connect Error: " . $m->connect_error);
}

// 1. Ensure tables exist
$m->query("CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'ROLE_USER',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

$m->query("CREATE TABLE IF NOT EXISTS game_runs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    run_token VARCHAR(64) NOT NULL UNIQUE,
    score INT NOT NULL DEFAULT 0,
    kills INT NOT NULL DEFAULT 0,
    wave INT NOT NULL DEFAULT 1,
    survival_duration INT NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

$m->query("CREATE TABLE IF NOT EXISTS leaderboard_ranks (
    rank_position INT NOT NULL PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    username VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    score INT NOT NULL,
    kills INT NOT NULL,
    wave INT NOT NULL,
    survival_duration INT NOT NULL,
    played_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

// 2. Insert Users (Login details)
$users = [
    [1, 'dharnidharan', 'dharnidharan@cit.edu.in', '$2a$12$e8YFeqKjL92uQjHw7b09eu8kQ0i2V9T3L2yq5L1m.P7mX.O0O1.2W', 'DHARNIDHARAN V', 'ROLE_ADMIN'],
    [2, 'ghost_recon', 'ghost@cit.edu.in', '$2a$12$e8YFeqKjL92uQjHw7b09eu8kQ0i2V9T3L2yq5L1m.P7mX.O0O1.2W', 'Alex Mercer', 'ROLE_USER'],
    [3, 'spartan_117', 'spartan@cit.edu.in', '$2a$12$e8YFeqKjL92uQjHw7b09eu8kQ0i2V9T3L2yq5L1m.P7mX.O0O1.2W', 'Master Chief', 'ROLE_USER'],
    [4, 'valkyrie', 'valkyrie@cit.edu.in', '$2a$12$e8YFeqKjL92uQjHw7b09eu8kQ0i2V9T3L2yq5L1m.P7mX.O0O1.2W', 'Sarah Connor', 'ROLE_USER'],
    [5, 'shadow_hunter', 'shadow@cit.edu.in', '$2a$12$e8YFeqKjL92uQjHw7b09eu8kQ0i2V9T3L2yq5L1m.P7mX.O0O1.2W', 'Marcus Fenix', 'ROLE_USER']
];

foreach ($users as $u) {
    $stmt = $m->prepare("INSERT INTO users (id, username, email, password_hash, display_name, role) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE display_name=VALUES(display_name)");
    $stmt->bind_param("isssss", $u[0], $u[1], $u[2], $u[3], $u[4], $u[5]);
    $stmt->execute();
}

// 3. Insert Game Runs (Scores)
$runs = [
    [1, 'RUN-TOURNAMENT-2026-001', 98450, 184, 15, 842, 'COMPLETED'],
    [2, 'RUN-TOURNAMENT-2026-002', 84200, 152, 12, 695, 'COMPLETED'],
    [3, 'RUN-TOURNAMENT-2026-003', 76100, 138, 11, 610, 'COMPLETED'],
    [4, 'RUN-TOURNAMENT-2026-004', 59300, 96, 9, 480, 'COMPLETED'],
    [5, 'RUN-TOURNAMENT-2026-005', 42150, 71, 7, 365, 'COMPLETED']
];

foreach ($runs as $r) {
    $stmt = $m->prepare("INSERT INTO game_runs (user_id, run_token, score, kills, wave, survival_duration, status) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE score=VALUES(score)");
    $stmt->bind_param("isiiiss", $r[0], $r[1], $r[2], $r[3], $r[4], $r[5], $r[6]);
    $stmt->execute();
}

// 4. Populate Leaderboard Ranks
$m->query("DELETE FROM leaderboard_ranks");
$ranks = [
    [1, 1, 'dharnidharan', 'DHARNIDHARAN V', 98450, 184, 15, 842],
    [2, 2, 'ghost_recon', 'Alex Mercer', 84200, 152, 12, 695],
    [3, 3, 'spartan_117', 'Master Chief', 76100, 138, 11, 610],
    [4, 4, 'valkyrie', 'Sarah Connor', 59300, 96, 9, 480],
    [5, 5, 'shadow_hunter', 'Marcus Fenix', 42150, 71, 7, 365]
];

foreach ($ranks as $rk) {
    $stmt = $m->prepare("INSERT INTO leaderboard_ranks (rank_position, user_id, username, display_name, score, kills, wave, survival_duration, played_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())");
    $stmt->bind_param("iissiiii", $rk[0], $rk[1], $rk[2], $rk[3], $rk[4], $rk[5], $rk[6], $rk[7]);
    $stmt->execute();
}

echo "Database populated successfully!\n";
$uCount = $m->query("SELECT COUNT(*) as c FROM users")->fetch_assoc()['c'];
$gCount = $m->query("SELECT COUNT(*) as c FROM game_runs")->fetch_assoc()['c'];
$rCount = $m->query("SELECT COUNT(*) as c FROM leaderboard_ranks")->fetch_assoc()['c'];

echo "Users: {$uCount} | Game Runs: {$gCount} | Leaderboard Ranks: {$rCount}\n";
?>
