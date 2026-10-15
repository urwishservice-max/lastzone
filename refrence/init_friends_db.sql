USE lastzone_db;
CREATE TABLE IF NOT EXISTS friend_network (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    friend_id BIGINT UNSIGNED NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACCEPTED', -- PENDING, ACCEPTED, REJECTED
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_friend_pair (user_id, friend_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed initial network connections around user 9 (jdramkrish) and user 1 (dharnidharan)
INSERT IGNORE INTO friend_network (user_id, friend_id, status) VALUES
(9, 1, 'ACCEPTED'), -- DHARNIDHARAN V
(9, 2, 'ACCEPTED'), -- Alex Mercer
(9, 3, 'PENDING'),  -- Master Chief (request pending)
(1, 2, 'ACCEPTED'),
(1, 3, 'ACCEPTED'),
(1, 4, 'ACCEPTED');