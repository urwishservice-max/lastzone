$mysqli = new mysqli('127.0.0.1', 'root', '', 'lastzone_db');
if ($mysqli->connect_error) {
    die('Connect Error: ' . $mysqli->connect_error);
}
echo 'Connected to lastzone_db successfully!\n';
$res = $mysqli->query('SHOW TABLES');
while ($row = $res->fetch_array()) {
    echo 'Table: ' . $row[0] . '\n';
}
$res = $mysqli->query('SELECT COUNT(*) as c FROM users');
$row = $res->fetch_assoc();
echo 'Users count: ' . $row['c'] . '\n';
$res = $mysqli->query('SELECT COUNT(*) as c FROM game_runs');
$row = $res->fetch_assoc();
echo 'Game Runs count: ' . $row['c'] . '\n';
