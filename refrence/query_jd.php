<?php
$pdo = new PDO("mysql:host=127.0.0.1;dbname=lastzone_db", "root", "");
$u = $pdo->query("SELECT * FROM users WHERE username = \"jdramkrish\"")->fetch(PDO::FETCH_ASSOC);
echo "User:\n";
print_r($u);
if ($u) {
    $runs = $pdo->query("SELECT * FROM game_runs WHERE user_id = " . $u["id"])->fetchAll(PDO::FETCH_ASSOC);
    echo "Runs:\n";
    print_r($runs);
}
