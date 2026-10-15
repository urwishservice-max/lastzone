USE lastzone_db;
INSERT IGNORE INTO users (id, username, email, password_hash, display_name, role) VALUES
(1, 'dharnidharan', 'dharnidharan@cit.edu.in', '$2a$12$e8YFeqKjL92uQjHw7b09eu8kQ0i2V9T3L2yq5L1m.P7mX.O0O1.2W', 'DHARNIDHARAN V', 'ROLE_ADMIN'),
(2, 'ghost_recon', 'ghost@cit.edu.in', '$2a$12$e8YFeqKjL92uQjHw7b09eu8kQ0i2V9T3L2yq5L1m.P7mX.O0O1.2W', 'Alex Mercer', 'ROLE_USER'),
(3, 'spartan_117', 'spartan@cit.edu.in', '$2a$12$e8YFeqKjL92uQjHw7b09eu8kQ0i2V9T3L2yq5L1m.P7mX.O0O1.2W', 'Master Chief', 'ROLE_USER'),
(4, 'valkyrie', 'valkyrie@cit.edu.in', '$2a$12$e8YFeqKjL92uQjHw7b09eu8kQ0i2V9T3L2yq5L1m.P7mX.O0O1.2W', 'Sarah Connor', 'ROLE_USER'),
(5, 'shadow_hunter', 'shadow@cit.edu.in', '$2a$12$e8YFeqKjL92uQjHw7b09eu8kQ0i2V9T3L2yq5L1m.P7mX.O0O1.2W', 'Marcus Fenix', 'ROLE_USER');

INSERT IGNORE INTO game_runs (user_id, run_token, score, kills, wave, survival_duration, status) VALUES
(1, 'RUN-TOURNAMENT-2026-001', 98450, 184, 15, 842, 'COMPLETED'),
(2, 'RUN-TOURNAMENT-2026-002', 84200, 152, 12, 695, 'COMPLETED'),
(3, 'RUN-TOURNAMENT-2026-003', 76100, 138, 11, 610, 'COMPLETED'),
(4, 'RUN-TOURNAMENT-2026-004', 59300, 96, 9, 480, 'COMPLETED'),
(5, 'RUN-TOURNAMENT-2026-005', 42150, 71, 7, 365, 'COMPLETED');

INSERT INTO leaderboard_ranks (rank_position, user_id, username, display_name, score, kills, wave, survival_duration, played_at)
SELECT 
    ROW_NUMBER() OVER (ORDER BY gr.score DESC) as rank_position,
    u.id, u.username, u.display_name, gr.score, gr.kills, gr.wave, gr.survival_duration, NOW()
FROM game_runs gr
JOIN users u ON gr.user_id = u.id
ON DUPLICATE KEY UPDATE score = VALUES(score);