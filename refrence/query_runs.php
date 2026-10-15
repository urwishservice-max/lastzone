<?php
$pdo = new PDO("mysql:host=127.0.0.1;dbname=lastzone_db", "root", "");
$stmt = $pdo->query("SELECT gr.id, gr.user_id, u.username, u.display_name, gr.score, gr.kills, gr.wave, gr.survival_duration, gr.status, gr.completed_at FROM game_runs gr JOIN users u ON gr.user_id = u.id ORDER BY gr.score DESC");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
