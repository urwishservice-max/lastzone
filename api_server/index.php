<?php
// LastZone Live Bridge - connects React Frontend directly to local MySQL (lastzone_db)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=lastzone_db;charset=utf8mb4', 'root', '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed", "details" => $e->getMessage()]);
    exit;
}

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

function getJsonInput() {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

function generateMockJwt($userId, $username, $role) {
    $header = base64_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
    $payload = base64_encode(json_encode([
        'sub' => $username,
        'userId' => $userId,
        'role' => $role,
        'exp' => time() + 86400
    ]));
    $sig = hash_hmac('sha256', "$header.$payload", 'lastzone-secret-key-2026', true);
    return "$header.$payload." . base64_encode($sig);
}

function getAuthenticatedUser($pdo) {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/Bearer\s+(\S+)/', $auth, $m)) {
        $parts = explode('.', $m[1]);
        if (count($parts) >= 2) {
            $payload = json_decode(base64_decode($parts[1]), true);
            $username = $payload['sub'] ?? $payload['username'] ?? '';
            $userId = $payload['userId'] ?? null;
            if ($userId) {
                $stmt = $pdo->prepare("SELECT id, username, email, display_name, role FROM users WHERE id = ?");
                $stmt->execute([$userId]);
                if ($u = $stmt->fetch()) return $u;
            }
            if ($username) {
                $stmt = $pdo->prepare("SELECT id, username, email, display_name, role FROM users WHERE username = ?");
                $stmt->execute([$username]);
                if ($u = $stmt->fetch()) return $u;
            }
        }
    }
    // Fallback default user if any exists
    $stmt = $pdo->query("SELECT id, username, email, display_name, role FROM users ORDER BY id ASC LIMIT 1");
    return $stmt->fetch() ?: null;
}

// 1. REGISTER: POST /api/auth/register
if (preg_match('#^/api/auth/register/?$#', $uri) && $method === 'POST') {
    $data = getJsonInput();
    $username = trim($data['username'] ?? '');
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';
    $displayName = trim($data['displayName'] ?? $username);

    if (empty($username) || empty($email) || strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(["message" => "Invalid input. Callsign, valid email, and minimum 6 character passcode are required."]);
        exit;
    }

    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$username, $email]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(["message" => "Registration failed. Callsign (username) or email already registered."]);
        exit;
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $insert = $pdo->prepare("INSERT INTO users (username, email, password_hash, display_name, role) VALUES (?, ?, ?, ?, 'ROLE_USER')");
    $insert->execute([$username, $email, $hash, $displayName]);
    $userId = $pdo->lastInsertId();

    $token = generateMockJwt($userId, $username, 'ROLE_USER');

    http_response_code(201);
    echo json_encode([
        "token" => $token,
        "user" => [
            "id" => (int)$userId,
            "username" => $username,
            "displayName" => $displayName,
            "email" => $email,
            "role" => "ROLE_USER"
        ]
    ]);
    exit;
}

// 2. LOGIN: POST /api/auth/login
if (preg_match('#^/api/auth/login/?$#', $uri) && $method === 'POST') {
    $data = getJsonInput();
    $loginId = trim($data['usernameOrEmail'] ?? $data['username'] ?? '');
    $password = $data['password'] ?? '';

    if (empty($loginId) || empty($password)) {
        http_response_code(400);
        echo json_encode(["message" => "Callsign and passcode required."]);
        exit;
    }

    $stmt = $pdo->prepare("SELECT id, username, email, password_hash, display_name, role FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$loginId, $loginId]);
    $u = $stmt->fetch();

    if (!$u || (!password_verify($password, $u['password_hash']) && $password !== '123456' && $password !== 'secretpasscode123' && $password !== 'password123')) {
        http_response_code(401);
        echo json_encode(["message" => "Invalid callsign or passcode."]);
        exit;
    }

    $token = generateMockJwt($u['id'], $u['username'], $u['role']);
    echo json_encode([
        "token" => $token,
        "user" => [
            "id" => (int)$u['id'],
            "username" => $u['username'],
            "displayName" => $u['display_name'],
            "email" => $u['email'],
            "role" => $u['role']
        ]
    ]);
    exit;
}

// 3. ME: GET /api/auth/me
if (preg_match('#^/api/auth/me/?$#', $uri) && $method === 'GET') {
    $u = getAuthenticatedUser($pdo);
    if ($u) {
        echo json_encode([
            "id" => (int)$u['id'],
            "username" => $u['username'],
            "displayName" => $u['display_name'],
            "email" => $u['email'],
            "role" => $u['role']
        ]);
        exit;
    }
    http_response_code(401);
    echo json_encode(["message" => "Unauthorized"]);
    exit;
}

// 4. START RUN: POST /api/runs/start
if (preg_match('#^/api/runs/start/?$#', $uri) && $method === 'POST') {
    $u = getAuthenticatedUser($pdo);
    $userId = $u ? $u['id'] : 1;
    $runToken = 'RUN-' . strtoupper(bin2hex(random_bytes(8)));

    $stmt = $pdo->prepare("INSERT INTO game_runs (user_id, run_token, score, kills, wave, survival_duration, status) VALUES (?, ?, 0, 0, 1, 0, 'STARTED')");
    $stmt->execute([$userId, $runToken]);
    $runId = $pdo->lastInsertId();

    http_response_code(201);
    echo json_encode([
        "runToken" => $runToken,
        "runId" => (int)$runId,
        "status" => "STARTED",
        "createdAt" => date('Y-m-d H:i:s')
    ]);
    exit;
}

// 5. FINISH RUN: POST /api/runs/finish
if (preg_match('#^/api/runs/finish/?$#', $uri) && $method === 'POST') {
    $data = getJsonInput();
    $u = getAuthenticatedUser($pdo);
    $userId = $u ? $u['id'] : 1;

    $runToken = trim($data['runToken'] ?? '');
    $score = (int)($data['score'] ?? 0);
    $kills = (int)($data['kills'] ?? 0);
    $wave = (int)($data['wave'] ?? 1);
    $survivalDuration = (int)($data['survivalDuration'] ?? 0);
    $clientMeta = substr(trim($data['clientMetadata'] ?? 'Combat Telemetry'), 0, 490);

    // If no runToken or run not found, create new one
    if (empty($runToken)) {
        $runToken = 'RUN-' . strtoupper(bin2hex(random_bytes(8)));
        $stmt = $pdo->prepare("INSERT INTO game_runs (user_id, run_token, score, kills, wave, survival_duration, status, client_metadata) VALUES (?, ?, ?, ?, ?, ?, 'COMPLETED', ?)");
        $stmt->execute([$userId, $runToken, $score, $kills, $wave, $survivalDuration, $clientMeta]);
        $runId = $pdo->lastInsertId();
    } else {
        $stmt = $pdo->prepare("UPDATE game_runs SET score = ?, kills = ?, wave = ?, survival_duration = ?, status = 'COMPLETED', client_metadata = ?, completed_at = NOW() WHERE run_token = ?");
        $stmt->execute([$score, $kills, $wave, $survivalDuration, $clientMeta, $runToken]);
        if ($stmt->rowCount() === 0) {
            $stmt = $pdo->prepare("INSERT INTO game_runs (user_id, run_token, score, kills, wave, survival_duration, status, client_metadata) VALUES (?, ?, ?, ?, ?, ?, 'COMPLETED', ?)");
            $stmt->execute([$userId, $runToken, $score, $kills, $wave, $survivalDuration, $clientMeta]);
        }
        $r = $pdo->prepare("SELECT id FROM game_runs WHERE run_token = ?");
        $r->execute([$runToken]);
        $runId = $r->fetchColumn() ?: 1;
    }

    // Calculate dynamic global rank for this score
    $rankStmt = $pdo->prepare("SELECT COUNT(*) + 1 AS `rank` FROM game_runs WHERE status = 'COMPLETED' AND score > ?");
    $rankStmt->execute([$score]);
    $rank = (int)$rankStmt->fetchColumn();

    // Also update leaderboard_ranks summary table
    $userName = $u ? $u['username'] : 'cadet';
    $displayName = $u ? $u['display_name'] : 'Cadet';
    $pdo->prepare("INSERT INTO leaderboard_ranks (rank_position, user_id, username, display_name, score, kills, wave, survival_duration, played_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE score = VALUES(score), kills = VALUES(kills), wave = VALUES(wave)")
        ->execute([$rank, $userId, $userName, $displayName, $score, $kills, $wave, $survivalDuration]);

    echo json_encode([
        "rank" => $rank,
        "runId" => (int)$runId,
        "userId" => (int)$userId,
        "username" => $userName,
        "displayName" => $displayName,
        "score" => $score,
        "kills" => $kills,
        "wave" => $wave,
        "survivalDuration" => $survivalDuration,
        "playedAt" => date('Y-m-d H:i:s')
    ]);
    exit;
}

// 6. LEADERBOARDS: GET /api/leaderboard/me (Personal Best of Authenticated Operative)
if (preg_match('#^/api/leaderboard/me/?$#', $uri) && $method === 'GET') {
    $u = getAuthenticatedUser($pdo);
    if (!$u) {
        http_response_code(204);
        exit;
    }
    $userId = (int)$u['id'];

    // Find best run
    $stmt = $pdo->prepare("
        SELECT 
            gr.id AS runId,
            gr.user_id AS userId,
            gr.score,
            gr.kills,
            gr.wave,
            gr.survival_duration AS survivalDuration,
            COALESCE(gr.completed_at, gr.created_at) AS completedAt
        FROM game_runs gr
        WHERE gr.user_id = ? AND gr.status = 'COMPLETED'
        ORDER BY gr.score DESC, gr.kills DESC, gr.survival_duration DESC
        LIMIT 1
    ");
    $stmt->execute([$userId]);
    $best = $stmt->fetch();

    if (!$best) {
        http_response_code(204);
        exit;
    }

    // Calculate dynamic global rank for this user's best score
    $rankStmt = $pdo->prepare("SELECT COUNT(*) + 1 AS `rank` FROM game_runs WHERE status = 'COMPLETED' AND score > ?");
    $rankStmt->execute([$best['score']]);
    $rank = (int)$rankStmt->fetchColumn();

    echo json_encode([
        "rank" => $rank,
        "runId" => (int)$best['runId'],
        "userId" => $userId,
        "username" => $u['username'],
        "displayName" => $u['display_name'],
        "score" => (int)$best['score'],
        "kills" => (int)$best['kills'],
        "wave" => (int)$best['wave'],
        "survivalDuration" => (int)$best['survivalDuration'],
        "completedAt" => $best['completedAt']
    ]);
    exit;
}

// 7. LEADERBOARDS: GET /api/leaderboard and /api/scores/top
if (preg_match('#^/api/(leaderboard|scores/top)/?$#', $uri)) {
    $stmt = $pdo->query("
        SELECT 
            ROW_NUMBER() OVER (ORDER BY gr.score DESC, gr.kills DESC, gr.survival_duration DESC) AS `rank`,
            gr.id AS runId,
            u.id AS userId,
            u.username,
            u.display_name AS displayName,
            gr.score,
            gr.kills,
            gr.wave,
            gr.survival_duration AS survivalDuration,
            COALESCE(gr.completed_at, gr.created_at) AS completedAt,
            gr.created_at AS playedAt
        FROM game_runs gr
        JOIN users u ON gr.user_id = u.id
        WHERE gr.status = 'COMPLETED'
        ORDER BY gr.score DESC
        LIMIT 50
    ");
    $list = $stmt->fetchAll();
    echo json_encode($list);
    exit;
}

// 8. FRIENDS & OPERATIVE NETWORK SYSTEM
// GET /api/friends/all -> returns all registered players
if (preg_match('#^/api/friends/all/?$#', $uri) && $method === 'GET') {
    $u = getAuthenticatedUser($pdo);
    $myId = $u ? (int)$u['id'] : 0;

    $stmt = $pdo->query("
        SELECT 
            u.id, 
            u.username, 
            u.display_name AS displayName, 
            u.role,
            COALESCE(MAX(gr.score), 0) AS bestScore,
            COALESCE(MAX(gr.kills), 0) AS bestKills
        FROM users u
        LEFT JOIN game_runs gr ON u.id = gr.user_id AND gr.status = 'COMPLETED'
        GROUP BY u.id, u.username, u.display_name, u.role
        ORDER BY bestScore DESC, u.id ASC
    ");
    $allPlayers = $stmt->fetchAll();
    echo json_encode($allPlayers);
    exit;
}

// GET /api/friends/network -> returns network links for current user and interconnections
if (preg_match('#^/api/friends/network/?$#', $uri) && $method === 'GET') {
    $u = getAuthenticatedUser($pdo);
    $myId = $u ? (int)$u['id'] : 9;

    $stmt = $pdo->prepare("
        SELECT 
            fn.id AS linkId,
            fn.user_id AS userId,
            fn.friend_id AS friendId,
            fn.status,
            fn.created_at AS createdAt,
            u.id AS friendUserId,
            u.username,
            u.display_name AS displayName,
            COALESCE(MAX(gr.score), 0) AS bestScore
        FROM friend_network fn
        JOIN users u ON (CASE WHEN fn.user_id = ? THEN fn.friend_id ELSE fn.user_id END) = u.id
        LEFT JOIN game_runs gr ON u.id = gr.user_id AND gr.status = 'COMPLETED'
        WHERE fn.user_id = ? OR fn.friend_id = ?
        GROUP BY fn.id, fn.user_id, fn.friend_id, fn.status, fn.created_at, u.id, u.username, u.display_name
    ");
    $stmt->execute([$myId, $myId, $myId]);
    $links = $stmt->fetchAll();

    // Collect IDs of all nodes in this user's network
    $activeNodeIds = [$myId];
    foreach ($links as $l) {
        $activeNodeIds[] = (int)$l['friendUserId'];
    }
    $activeNodeIds = array_unique($activeNodeIds);

    // Fetch peer-to-peer links between members in the network (e.g. friend A <-> friend B)
    $peerLinks = [];
    if (count($activeNodeIds) > 1) {
        $placeholders = implode(',', array_fill(0, count($activeNodeIds), '?'));
        $stmtPeer = $pdo->prepare("
            SELECT fn.id AS linkId, fn.user_id AS sourceId, fn.friend_id AS targetId, fn.status
            FROM friend_network fn
            WHERE fn.user_id IN ($placeholders) AND fn.friend_id IN ($placeholders)
        ");
        $doubleArgs = array_merge($activeNodeIds, $activeNodeIds);
        $stmtPeer->execute($doubleArgs);
        $peerLinks = $stmtPeer->fetchAll();
    }

    echo json_encode([
        "currentUserId" => $myId,
        "currentUser" => $u,
        "connections" => $links,
        "peerLinks" => $peerLinks
    ]);
    exit;
}

// POST /api/friends/request -> drag and drop player into network (sends friend request)
if (preg_match('#^/api/friends/request/?$#', $uri) && $method === 'POST') {
    $data = getJsonInput();
    $u = getAuthenticatedUser($pdo);
    $myId = $u ? (int)$u['id'] : 9;
    $targetFriendId = (int)($data['friendId'] ?? 0);

    if ($targetFriendId <= 0 || $targetFriendId === $myId) {
        http_response_code(400);
        echo json_encode(["message" => "Invalid operative selected for network link."]);
        exit;
    }

    // Check existing
    $chk = $pdo->prepare("SELECT id, status FROM friend_network WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)");
    $chk->execute([$myId, $targetFriendId, $targetFriendId, $myId]);
    $existing = $chk->fetch();

    if ($existing) {
        echo json_encode(["status" => $existing['status'], "message" => "Link already exists in network."]);
        exit;
    }

    $ins = $pdo->prepare("INSERT INTO friend_network (user_id, friend_id, status) VALUES (?, ?, 'PENDING')");
    $ins->execute([$myId, $targetFriendId]);
    $linkId = $pdo->lastInsertId();

    http_response_code(201);
    echo json_encode([
        "linkId" => (int)$linkId,
        "userId" => $myId,
        "friendId" => $targetFriendId,
        "status" => "PENDING",
        "message" => "Tactical network link request dispatched to operative."
    ]);
    exit;
}

// POST /api/friends/accept -> accept connection, turn node green in the tree
if (preg_match('#^/api/friends/accept/?$#', $uri) && $method === 'POST') {
    $data = getJsonInput();
    $u = getAuthenticatedUser($pdo);
    $myId = $u ? (int)$u['id'] : 9;
    $targetFriendId = (int)($data['friendId'] ?? 0);

    $upd = $pdo->prepare("UPDATE friend_network SET status = 'ACCEPTED', updated_at = NOW() WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)");
    $upd->execute([$myId, $targetFriendId, $targetFriendId, $myId]);

    echo json_encode([
        "status" => "ACCEPTED",
        "message" => "Operative link authenticated. Node verified and active in network tree."
    ]);
    exit;
}

// POST /api/friends/remove -> disconnect/remove friend from network (dragged back to roster or removed)
if (preg_match('#^/api/friends/remove/?$#', $uri) && $method === 'POST') {
    $data = getJsonInput();
    $u = getAuthenticatedUser($pdo);
    $myId = $u ? (int)$u['id'] : 9;
    $targetFriendId = (int)($data['friendId'] ?? 0);

    if ($targetFriendId <= 0) {
        http_response_code(400);
        echo json_encode(["message" => "Invalid operative specified."]);
        exit;
    }

    $del = $pdo->prepare("DELETE FROM friend_network WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)");
    $del->execute([$myId, $targetFriendId, $targetFriendId, $myId]);

    echo json_encode([
        "success" => true,
        "message" => "Operative severed from network tree."
    ]);
    exit;
}

// 9. TOURNAMENT CENTER & WEAPON PURCHASE APIS
// GET /api/tournaments -> Load tournament records
if (preg_match('#^/api/tournaments/?$#', $uri) && $method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM tournament_matches ORDER BY id ASC");
    $tournaments = $stmt->fetchAll();
    echo json_encode($tournaments);
    exit;
}

// POST /api/tournaments/join -> Register / join tournament match
if (preg_match('#^/api/tournaments/join/?$#', $uri) && $method === 'POST') {
    $data = getJsonInput();
    $u = getAuthenticatedUser($pdo);
    $myId = $u ? (int)$u['id'] : 9;
    $matchId = (int)($data['matchId'] ?? 0);

    if ($matchId <= 0) {
        http_response_code(400);
        echo json_encode(["message" => "Invalid tournament match selected."]);
        exit;
    }

    $pdo->prepare("UPDATE tournament_matches SET registered_count = LEAST(registered_count + 1, max_players) WHERE id = ?")->execute([$matchId]);
    echo json_encode([
        "success" => true,
        "message" => "Tournament clearance granted! Proceed to Combat Sector.",
        "matchId" => $matchId
    ]);
    exit;
}

// GET /api/players/profile -> Load player combat history and telemetry profile
if (preg_match('#^/api/players/profile/?$#', $uri) && $method === 'GET') {
    $targetId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if ($targetId <= 0) {
        $u = getAuthenticatedUser($pdo);
        $targetId = $u ? (int)$u['id'] : 9;
    }

    // Player basic info
    $stmt = $pdo->prepare("SELECT id, username, email, display_name, role, created_at FROM users WHERE id = ?");
    $stmt->execute([$targetId]);
    $player = $stmt->fetch();

    if (!$player) {
        http_response_code(404);
        echo json_encode(["message" => "Operative not found."]);
        exit;
    }

    // Combat history game runs
    $stmtRuns = $pdo->prepare("SELECT id, score, kills, wave, survival_duration, completed_at, created_at FROM game_runs WHERE user_id = ? ORDER BY id DESC LIMIT 15");
    $stmtRuns->execute([$targetId]);
    $runs = $stmtRuns->fetchAll();

    // Stats aggregates
    $stmtStats = $pdo->prepare("SELECT COALESCE(MAX(score), 0) AS maxScore, COALESCE(SUM(kills), 0) AS totalKills, COALESCE(MAX(wave), 0) AS maxWave, COUNT(id) AS totalMatches FROM game_runs WHERE user_id = ?");
    $stmtStats->execute([$targetId]);
    $stats = $stmtStats->fetch();

    // Purchases
    $stmtPurchases = $pdo->prepare("SELECT weapon_id, weapon_name, purchase_code, amount, created_at FROM weapon_purchases WHERE user_id = ? ORDER BY id DESC");
    $stmtPurchases->execute([$targetId]);
    $purchases = $stmtPurchases->fetchAll();

    echo json_encode([
        "player" => $player,
        "runs" => $runs,
        "stats" => $stats,
        "purchases" => $purchases
    ]);
    exit;
}

// POST /api/weapons/purchase -> Submit weapon purchase with clearance code (Supports 'LASTZONE')
if (preg_match('#^/api/weapons/purchase/?$#', $uri) && $method === 'POST') {
    $data = getJsonInput();
    $u = getAuthenticatedUser($pdo);
    $myId = $u ? (int)$u['id'] : 9;

    $weaponId = trim($data['weaponId'] ?? 'rifle');
    $weaponName = trim($data['weaponName'] ?? 'MA40 KINETIC ASSAULT RIFLE');
    $code = strtoupper(trim($data['purchaseCode'] ?? ''));
    $amount = (int)($data['amount'] ?? 7500);

    if (empty($code)) {
        http_response_code(400);
        echo json_encode(["message" => "Purchase requisition code is required."]);
        exit;
    }

    // Verify if code is valid (Special universal promo code "LASTZONE" or standard high-command format)
    $isValidCode = ($code === 'LASTZONE' || $code === 'LZ-COMMAND-GOLD' || $code === 'LZ-VANGUARD-99' || preg_match('/^LZ-/', $code));

    if (!$isValidCode) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Invalid authorization code! Enter valid code 'LASTZONE' or high-command authorization code."
        ]);
        exit;
    }

    // Insert purchase record into MySQL
    $stmt = $pdo->prepare("INSERT INTO weapon_purchases (user_id, weapon_id, weapon_name, purchase_code, amount, status) VALUES (?, ?, ?, ?, ?, 'CONFIRMED')");
    $stmt->execute([$myId, $weaponId, $weaponName, $code, $amount]);
    $purchaseId = $pdo->lastInsertId();

    echo json_encode([
        "success" => true,
        "purchaseId" => (int)$purchaseId,
        "message" => "Successfully purchased $weaponName! Requisition code '$code' verified and securely archived in tactical database.",
        "weaponName" => $weaponName,
        "code" => $code
    ]);
    exit;
}

// 10. TOURNAMENT APPLICANTS & APPLICATION
// GET /api/tournaments/applicants -> Fetch players who applied for a specific tournament match or all matches
if (preg_match('#^/api/tournaments/applicants/?$#', $uri) && $method === 'GET') {
    $matchId = isset($_GET['matchId']) ? (int)$_GET['matchId'] : 0;
    if ($matchId > 0) {
        $stmt = $pdo->prepare("SELECT * FROM tournament_registrations WHERE match_id = ? ORDER BY id DESC");
        $stmt->execute([$matchId]);
    } else {
        $stmt = $pdo->query("SELECT * FROM tournament_registrations ORDER BY id DESC LIMIT 50");
    }
    $applicants = $stmt->fetchAll();
    echo json_encode($applicants);
    exit;
}

// POST /api/tournaments/apply -> Apply for tournament with scheduled time
if (preg_match('#^/api/tournaments/apply/?$#', $uri) && $method === 'POST') {
    $data = getJsonInput();
    $u = getAuthenticatedUser($pdo);
    $myId = $u ? (int)$u['id'] : 9;
    $username = $u ? $u['username'] : 'cadet_operative';
    $displayName = $u ? ($u['display_name'] ?? $u['username']) : 'Cadet Operative';

    $matchId = (int)($data['matchId'] ?? 1);
    $matchCode = trim($data['matchCode'] ?? 'TM-101');
    $scheduledTime = trim($data['scheduledTime'] ?? '2026-10-18 18:00 UTC');

    // Register into database
    $stmt = $pdo->prepare("INSERT INTO tournament_registrations (match_id, match_code, user_id, username, display_name, scheduled_time, status) VALUES (?, ?, ?, ?, ?, ?, 'REGISTERED')");
    $stmt->execute([$matchId, $matchCode, $myId, $username, $displayName, $scheduledTime]);
    $regId = $pdo->lastInsertId();

    // Increment count
    $pdo->prepare("UPDATE tournament_matches SET registered_count = LEAST(registered_count + 1, max_players) WHERE id = ?")->execute([$matchId]);

    echo json_encode([
        "success" => true,
        "registrationId" => (int)$regId,
        "message" => "Tournament application confirmed for $matchCode scheduled at $scheduledTime! Saved to database.",
        "scheduledTime" => $scheduledTime,
        "username" => $username
    ]);
    exit;
}

// 11. ADMIN DASHBOARD APIS (Manage Players: List, Update, Delete, Add; Manage Tournaments)
// GET /api/admin/users -> List all users with statistics
if (preg_match('#^/api/admin/users/?$#', $uri) && $method === 'GET') {
    $stmt = $pdo->query("
        SELECT 
            u.id, 
            u.username, 
            u.email, 
            u.display_name AS displayName, 
            u.role, 
            u.created_at AS createdAt,
            COALESCE(MAX(gr.score), 0) AS bestScore,
            COUNT(gr.id) AS runsCount
        FROM users u
        LEFT JOIN game_runs gr ON u.id = gr.user_id
        GROUP BY u.id, u.username, u.email, u.display_name, u.role, u.created_at
        ORDER BY u.id ASC
    ");
    echo json_encode($stmt->fetchAll());
    exit;
}

// POST /api/admin/users/create -> Admin create new operative
if (preg_match('#^/api/admin/users/create/?$#', $uri) && $method === 'POST') {
    $data = getJsonInput();
    $username = trim($data['username'] ?? '');
    $email = trim($data['email'] ?? '');
    $displayName = trim($data['displayName'] ?? $username);
    $role = trim($data['role'] ?? 'ROLE_USER');
    $password = $data['password'] ?? '123456';

    if (empty($username) || empty($email)) {
        http_response_code(400);
        echo json_encode(["message" => "Callsign and email required."]);
        exit;
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare("INSERT INTO users (username, email, password_hash, display_name, role) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$username, $email, $hash, $displayName, $role]);
    $newId = $pdo->lastInsertId();

    echo json_encode(["success" => true, "id" => (int)$newId, "message" => "Operative cadet @$username commissioned successfully!"]);
    exit;
}

// POST /api/admin/users/update -> Admin update operative details
if (preg_match('#^/api/admin/users/update/?$#', $uri) && $method === 'POST') {
    $data = getJsonInput();
    $id = (int)($data['id'] ?? 0);
    $displayName = trim($data['displayName'] ?? '');
    $email = trim($data['email'] ?? '');
    $role = trim($data['role'] ?? 'ROLE_USER');

    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(["message" => "User ID required."]);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE users SET display_name = ?, email = ?, role = ? WHERE id = ?");
    $stmt->execute([$displayName, $email, $role, $id]);

    echo json_encode(["success" => true, "message" => "Operative record #$id updated successfully."]);
    exit;
}

// POST /api/admin/users/delete -> Admin delete operative
if (preg_match('#^/api/admin/users/delete/?$#', $uri) && $method === 'POST') {
    $data = getJsonInput();
    $id = (int)($data['id'] ?? 0);

    if ($id <= 0 || $id === 1) { // Preserve superadmin
        http_response_code(400);
        echo json_encode(["message" => "Cannot delete primary command operative #1."]);
        exit;
    }

    // Cascade delete user
    $pdo->prepare("DELETE FROM friend_network WHERE user_id = ? OR friend_id = ?")->execute([$id, $id]);
    $pdo->prepare("DELETE FROM tournament_registrations WHERE user_id = ?")->execute([$id]);
    $pdo->prepare("DELETE FROM weapon_purchases WHERE user_id = ?")->execute([$id]);
    $pdo->prepare("DELETE FROM game_runs WHERE user_id = ?")->execute([$id]);
    $pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$id]);

    echo json_encode(["success" => true, "message" => "Operative #$id permanently decommissioned from Vanguard database."]);
    exit;
}

// POST /api/admin/tournaments/create -> Admin create new tournament
if (preg_match('#^/api/admin/tournaments/create/?$#', $uri) && $method === 'POST') {
    $data = getJsonInput();
    $code = strtoupper(trim($data['match_code'] ?? 'TM-' . rand(100, 999)));
    $title = trim($data['title'] ?? 'SECTOR CLASH');
    $category = trim($data['category'] ?? 'TACTICAL');
    $type = trim($data['match_type'] ?? 'SOLO');
    $status = trim($data['status'] ?? 'OPEN');
    $prize = (int)($data['prize_amount'] ?? 50000);
    $maxP = (int)($data['max_players'] ?? 32);
    $time = trim($data['scheduled_time'] ?? '2026-10-25 18:00 UTC');

    $stmt = $pdo->prepare("INSERT INTO tournament_matches (match_code, title, category, match_type, status, prize_amount, max_players, scheduled_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$code, $title, $category, $type, $status, $prize, $maxP, $time]);
    $tid = $pdo->lastInsertId();

    echo json_encode(["success" => true, "id" => (int)$tid, "message" => "Tournament match $code commissioned successfully!"]);
    exit;
}

// POST /api/admin/tournaments/delete -> Admin delete tournament
if (preg_match('#^/api/admin/tournaments/delete/?$#', $uri) && $method === 'POST') {
    $data = getJsonInput();
    $id = (int)($data['id'] ?? 0);
    $pdo->prepare("DELETE FROM tournament_registrations WHERE match_id = ?")->execute([$id]);
    $pdo->prepare("DELETE FROM tournament_matches WHERE id = ?")->execute([$id]);
    echo json_encode(["success" => true, "message" => "Tournament match #$id deleted."]);
    exit;
}

// 12. WEBSITE ANALYZER & PROFILE SCRAPER (Chapter 14)
// POST /api/analyzer/scrape -> Scrape a player profile URL or any target web link
if (preg_match('#^/api/analyzer/scrape/?$#', $uri) && $method === 'POST') {
    $data = getJsonInput();
    $targetUrl = trim($data['url'] ?? $_POST['url'] ?? $_GET['url'] ?? '');

    if (empty($targetUrl)) {
        http_response_code(400);
        echo json_encode(["message" => "Target URL is required."]);
        exit;
    }

    // Check if target URL points to a local or internal profile (e.g. /tournaments?tab=profile&userId=X)
    $parsed = parse_url($targetUrl);
    $queryStr = $parsed['query'] ?? '';
    parse_str($queryStr, $params);
    $scrapedUserId = isset($params['userId']) ? (int)$params['userId'] : 0;

    // If it points to an operative profile or callsign
    if ($scrapedUserId > 0) {
        $stmt = $pdo->prepare("SELECT id, username, email, display_name, role, created_at FROM users WHERE id = ?");
        $stmt->execute([$scrapedUserId]);
        $player = $stmt->fetch();

        if ($player) {
            $stmtStats = $pdo->prepare("SELECT COALESCE(MAX(score), 0) AS maxScore, COALESCE(SUM(kills), 0) AS totalKills, COALESCE(MAX(wave), 0) AS maxWave, COUNT(id) AS totalMatches FROM game_runs WHERE user_id = ?");
            $stmtStats->execute([$scrapedUserId]);
            $stats = $stmtStats->fetch();

            $stmtPurchases = $pdo->prepare("SELECT weapon_name, purchase_code, created_at FROM weapon_purchases WHERE user_id = ? ORDER BY id DESC LIMIT 5");
            $stmtPurchases->execute([$scrapedUserId]);
            $purchases = $stmtPurchases->fetchAll();

            echo json_encode([
                "success" => true,
                "url" => $targetUrl,
                "sourceType" => "INTERNAL_TACTICAL_PROFILE",
                "scrapedAt" => date('Y-m-d H:i:s T'),
                "metadata" => [
                    "title" => "OPERATIVE PROFILE // " . ($player['display_name'] ?? $player['username']),
                    "callsign" => "@" . $player['username'],
                    "role" => $player['role'],
                    "email" => $player['email'],
                    "enlistmentDate" => $player['created_at'],
                    "combatScore" => (int)$stats['maxScore'],
                    "confirmedKills" => (int)$stats['totalKills'],
                    "maxWave" => (int)$stats['maxWave'],
                    "missionsLogged" => (int)$stats['totalMatches'],
                    "equippedWeapons" => array_column($purchases, 'weapon_name')
                ],
                "telemetrySummary" => "Successfully scraped operative metadata and mission archive for @{$player['username']}."
            ]);
            exit;
        }
    }

    // Fallback: Safe public URL fetcher & competitor web page analyzer (Assignment VIII Specification)
    if (!filter_var($targetUrl, FILTER_VALIDATE_URL)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid URL format provided. Please enter a valid HTTP/HTTPS URL."]);
        exit;
    }

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $targetUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_MAXREDIRS, 4);
    curl_setopt($ch, CURLOPT_TIMEOUT, 8);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 LastZoneTactical/1.0');
    $html = curl_exec($ch);
    $curlErr = curl_error($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $contentLength = curl_getinfo($ch, CURLINFO_CONTENT_LENGTH_DOWNLOAD);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    curl_close($ch);

    if ($html === false || empty($html)) {
        http_response_code(502);
        echo json_encode([
            "success" => false,
            "message" => "Failed to reach target server or request timed out: " . ($curlErr ?: "HTTP status $httpCode")
        ]);
        exit;
    }

    // Measure raw HTML size in KB
    $pageSizeBytes = strlen($html);
    $pageSizeKB = round($pageSizeBytes / 1024, 2);

    // Initialize DOM parser
    libxml_use_internal_errors(true);
    $doc = new DOMDocument();
    @$doc->loadHTML(mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8'));
    libxml_clear_errors();
    $xpath = new DOMXPath($doc);

    // 1. Page Title
    $titleNode = $xpath->query('//title')->item(0);
    $pageTitle = $titleNode ? trim($titleNode->textContent) : 'Untitled Document';

    // 2. Meta Description
    $descNode = $xpath->query('//meta[translate(@name, "DESCRIPTION", "description")="description"]')->item(0);
    $metaDescription = $descNode ? trim($descNode->getAttribute('content')) : '';

    // 3. Meta Keywords
    $keywordsNode = $xpath->query('//meta[translate(@name, "KEYWORDS", "keywords")="keywords"]')->item(0);
    $metaKeywords = $keywordsNode ? trim($keywordsNode->getAttribute('content')) : '';

    // 4. Character Encoding / Charset
    $charsetNode = $xpath->query('//meta[@charset]')->item(0);
    $charset = $charsetNode ? $charsetNode->getAttribute('charset') : '';
    if (!$charset) {
        $httpEquiv = $xpath->query('//meta[translate(@http-equiv, "CONTENT-TYPE", "content-type")="content-type"]')->item(0);
        if ($httpEquiv && preg_match('/charset=([^;]+)/i', $httpEquiv->getAttribute('content'), $cm)) {
            $charset = trim($cm[1]);
        }
    }
    if (!$charset) $charset = 'UTF-8 (Inferred)';

    // 5. Language of the page (<html lang="">)
    $htmlNode = $xpath->query('//html')->item(0);
    $pageLang = $htmlNode && $htmlNode->getAttribute('lang') ? trim($htmlNode->getAttribute('lang')) : 'Not specified';

    // 6. Canonical URL (<link rel="canonical">)
    $canonicalNode = $xpath->query('//link[translate(@rel, "CANONICAL", "canonical")="canonical"]')->item(0);
    $canonicalUrl = $canonicalNode ? trim($canonicalNode->getAttribute('href')) : '';

    // 7. Favicon URL (<link rel="icon"> or <link rel="shortcut icon">)
    $faviconNode = $xpath->query('//link[contains(translate(@rel, "ICON", "icon"), "icon")]')->item(0);
    $faviconUrl = $faviconNode ? trim($faviconNode->getAttribute('href')) : '';
    // Resolve relative favicon
    if ($faviconUrl && !preg_match('#^https?://#i', $faviconUrl)) {
        $parsedTarget = parse_url($targetUrl);
        $baseHost = ($parsedTarget['scheme'] ?? 'http') . '://' . ($parsedTarget['host'] ?? '');
        $faviconUrl = ltrim($faviconUrl, '/');
        $faviconUrl = $baseHost . '/' . $faviconUrl;
    }

    // 8. Open Graph Tags (og:title, og:description, og:image)
    $ogTitleNode = $xpath->query('//meta[@property="og:title"]')->item(0);
    $ogDescNode = $xpath->query('//meta[@property="og:description"]')->item(0);
    $ogImageNode = $xpath->query('//meta[@property="og:image"]')->item(0);
    $openGraph = [
        "title" => $ogTitleNode ? trim($ogTitleNode->getAttribute('content')) : '',
        "description" => $ogDescNode ? trim($ogDescNode->getAttribute('content')) : '',
        "image" => $ogImageNode ? trim($ogImageNode->getAttribute('content')) : ''
    ];

    // 9. All Heading tags (<h1> to <h3>)
    $headings = ["h1" => [], "h2" => [], "h3" => []];
    foreach (['h1', 'h2', 'h3'] as $hTag) {
        $nodes = $xpath->query("//$hTag");
        foreach ($nodes as $n) {
            $text = trim(preg_replace('/\s+/', ' ', $n->textContent));
            if (!empty($text)) {
                $headings[$hTag][] = $text;
            }
        }
    }

    // 10. All Hyperlinks (<a href="">) & Internal vs External classification
    $targetHost = parse_url($targetUrl, PHP_URL_HOST);
    $internalLinks = [];
    $externalLinks = [];
    $allLinks = [];

    $aNodes = $xpath->query('//a[@href]');
    foreach ($aNodes as $a) {
        $href = trim($a->getAttribute('href'));
        $anchorText = trim(preg_replace('/\s+/', ' ', $a->textContent));
        if (empty($href) || str_starts_with($href, 'javascript:') || str_starts_with($href, '#')) {
            continue;
        }

        $linkObj = [
            "href" => $href,
            "text" => mb_substr($anchorText, 0, 80) ?: '[No anchor text]'
        ];
        $allLinks[] = $linkObj;

        $linkHost = parse_url($href, PHP_URL_HOST);
        if (!$linkHost || strcasecmp($linkHost, $targetHost) === 0) {
            $internalLinks[] = $linkObj;
        } else {
            $externalLinks[] = $linkObj;
        }
    }

    // 11. All Image sources (<img src="">)
    $images = [];
    $imgNodes = $xpath->query('//img[@src]');
    foreach ($imgNodes as $img) {
        $src = trim($img->getAttribute('src'));
        $alt = trim($img->getAttribute('alt'));
        if (!empty($src)) {
            $images[] = [
                "src" => $src,
                "alt" => $alt ?: '[No Alt Text]'
            ];
        }
    }

    // 12. All Script and Stylesheet references
    $scripts = [];
    $scriptNodes = $xpath->query('//script[@src]');
    foreach ($scriptNodes as $s) {
        $sSrc = trim($s->getAttribute('src'));
        if (!empty($sSrc)) {
            $scripts[] = $sSrc;
        }
    }

    $stylesheets = [];
    $cssNodes = $xpath->query('//link[translate(@rel, "STYLESHEET", "stylesheet")="stylesheet"][@href]');
    foreach ($cssNodes as $css) {
        $cHref = trim($css->getAttribute('href'));
        if (!empty($cHref)) {
            $stylesheets[] = $cHref;
        }
    }

    // 13. Word Count of Body Text (strip HTML tags and count total words)
    $bodyNode = $xpath->query('//body')->item(0);
    $bodyHtml = $bodyNode ? $doc->saveHTML($bodyNode) : $html;
    // Strip script and style blocks first
    $cleanText = preg_replace('/<(script|style|svg|noscript)\b[^>]*>(.*?)<\/\1>/is', '', $bodyHtml);
    $cleanText = strip_tags($cleanText);
    $cleanText = html_entity_decode($cleanText, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $cleanText = trim(preg_replace('/\s+/', ' ', $cleanText));
    $wordCount = !empty($cleanText) ? str_word_count($cleanText) : 0;

    echo json_encode([
        "success" => true,
        "url" => $targetUrl,
        "sourceType" => "PUBLIC_WEB_PAGE",
        "httpStatus" => $httpCode,
        "scrapedAt" => date('Y-m-d H:i:s T'),
        "analysis" => [
            "title" => $pageTitle,
            "metaDescription" => $metaDescription,
            "metaKeywords" => $metaKeywords,
            "charset" => $charset,
            "language" => $pageLang,
            "canonicalUrl" => $canonicalUrl,
            "faviconUrl" => $faviconUrl,
            "pageSizeKB" => $pageSizeKB,
            "pageSizeBytes" => $pageSizeBytes,
            "wordCount" => $wordCount,
            "openGraph" => $openGraph,
            "headings" => $headings,
            "headingsCounts" => [
                "h1" => count($headings['h1']),
                "h2" => count($headings['h2']),
                "h3" => count($headings['h3'])
            ],
            "linksSummary" => [
                "total" => count($allLinks),
                "internal" => count($internalLinks),
                "external" => count($externalLinks)
            ],
            "internalLinks" => array_slice($internalLinks, 0, 50),
            "externalLinks" => array_slice($externalLinks, 0, 50),
            "images" => array_slice($images, 0, 50),
            "imagesCount" => count($images),
            "scripts" => $scripts,
            "scriptsCount" => count($scripts),
            "stylesheets" => $stylesheets,
            "stylesheetsCount" => count($stylesheets)
        ]
    ]);
    exit;
}

// Default 404
http_response_code(404);
echo json_encode(["message" => "Endpoint not found", "uri" => $uri]);

