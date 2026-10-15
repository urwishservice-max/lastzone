<?php
$pdo = new PDO("mysql:host=127.0.0.1;dbname=lastzone_db", "root", "");
$stmt = $pdo->query("SELECT id, username, email, display_name, role, created_at FROM users ORDER BY id DESC LIMIT 5");
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT);
