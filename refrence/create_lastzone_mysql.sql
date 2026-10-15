-- =============================================================================
-- LASTZONE TOURNAMENT DATABASE
-- Compatible with MySQL 8.x / MariaDB (XAMPP phpMyAdmin)
-- Stores: Login Details (users), Game Scores & Telemetry (game_runs), and Ranks (leaderboard view)
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `lastzone_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `lastzone_db`;

-- 1. USERS TABLE (Login Details, Credentials & Roles)
DROP TABLE IF EXISTS `game_runs`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL COMMENT 'BCrypt or SHA256 hashed password',
    `display_name` VARCHAR(100) NOT NULL,
    `role` VARCHAR(20) NOT NULL DEFAULT 'ROLE_USER',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_users_username` (`username`),
    INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. GAME_RUNS TABLE (Scores, Telemetry, Kills, Survival Time, Tournament Waves)
CREATE TABLE `game_runs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `run_token` VARCHAR(64) NOT NULL UNIQUE,
    `score` INT NOT NULL DEFAULT 0,
    `kills` INT NOT NULL DEFAULT 0,
    `wave` INT NOT NULL DEFAULT 1,
    `survival_duration` INT NOT NULL DEFAULT 0 COMMENT 'Duration in seconds',
    `status` VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
    `client_metadata` VARCHAR(500) DEFAULT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `completed_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_game_runs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    INDEX `idx_game_runs_user_id` (`user_id`),
    INDEX `idx_game_runs_leaderboard` (`status`, `score` DESC, `kills` DESC, `survival_duration` DESC, `created_at` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. LEADERBOARD VIEW (Auto-Calculates Live Ranks based on Highest Scores)
DROP VIEW IF EXISTS `v_leaderboard`;

CREATE VIEW `v_leaderboard` AS
SELECT 
    ROW_NUMBER() OVER (ORDER BY gr.score DESC, gr.kills DESC, gr.survival_duration DESC, gr.created_at ASC) AS `rank`,
    gr.id AS `run_id`,
    u.id AS `user_id`,
    u.username,
    u.display_name,
    gr.score,
    gr.kills,
    gr.wave,
    gr.survival_duration,
    gr.status,
    COALESCE(gr.completed_at, gr.created_at) AS `played_at`
FROM `game_runs` gr
JOIN `users` u ON gr.user_id = u.id
WHERE gr.status = 'COMPLETED';

-- =============================================================================
-- SEED DATA (Cadets, Scores & Tournament Rankings)
-- =============================================================================

INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `display_name`, `role`, `created_at`) VALUES
(1, 'dharnidharan', 'dharnidharan@cit.edu.in', '$2a$12$e8YFeqKjL92uQjHw7b09eu8kQ0i2V9T3L2yq5L1m.P7mX.O0O1.2W', 'DHARNIDHARAN V', 'ROLE_ADMIN', '2026-10-15 10:00:00'),
(2, 'ghost_recon', 'ghost@cit.edu.in', '$2a$12$e8YFeqKjL92uQjHw7b09eu8kQ0i2V9T3L2yq5L1m.P7mX.O0O1.2W', 'Alex Mercer', 'ROLE_USER', '2026-10-15 10:15:00'),
(3, 'spartan_117', 'spartan@cit.edu.in', '$2a$12$e8YFeqKjL92uQjHw7b09eu8kQ0i2V9T3L2yq5L1m.P7mX.O0O1.2W', 'Master Chief', 'ROLE_USER', '2026-10-15 10:30:00'),
(4, 'valkyrie', 'valkyrie@cit.edu.in', '$2a$12$e8YFeqKjL92uQjHw7b09eu8kQ0i2V9T3L2yq5L1m.P7mX.O0O1.2W', 'Sarah Connor', 'ROLE_USER', '2026-10-15 11:00:00'),
(5, 'shadow_hunter', 'shadow@cit.edu.in', '$2a$12$e8YFeqKjL92uQjHw7b09eu8kQ0i2V9T3L2yq5L1m.P7mX.O0O1.2W', 'Marcus Fenix', 'ROLE_USER', '2026-10-15 11:20:00');

INSERT INTO `game_runs` (`user_id`, `run_token`, `score`, `kills`, `wave`, `survival_duration`, `status`, `created_at`, `completed_at`) VALUES
(1, 'RUN-TOURNAMENT-2026-001', 98450, 184, 15, 842, 'COMPLETED', '2026-10-15 14:00:00', '2026-10-15 14:14:02'),
(2, 'RUN-TOURNAMENT-2026-002', 84200, 152, 12, 695, 'COMPLETED', '2026-10-15 14:20:00', '2026-10-15 14:31:35'),
(3, 'RUN-TOURNAMENT-2026-003', 76100, 138, 11, 610, 'COMPLETED', '2026-10-15 14:40:00', '2026-10-15 14:50:10'),
(4, 'RUN-TOURNAMENT-2026-004', 59300, 96, 9, 480, 'COMPLETED', '2026-10-15 15:00:00', '2026-10-15 15:08:00'),
(5, 'RUN-TOURNAMENT-2026-005', 42150, 71, 7, 365, 'COMPLETED', '2026-10-15 15:30:00', '2026-10-15 15:36:05');
