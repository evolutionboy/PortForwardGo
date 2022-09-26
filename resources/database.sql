SET
  SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";

SET
  AUTOCOMMIT = 0;

START TRANSACTION;

SET
  time_zone = "+00:00";

CREATE TABLE `announcements` (
  `id` int(11) NOT NULL,
  `title` text NOT NULL,
  `content` longtext NOT NULL,
  `edit_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE `nat_devices` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` text NOT NULL,
  `secret` text NOT NULL,
  `version` text NOT NULL,
  `updated` datetime NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE `nat_rules` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `node_id` int(11) NOT NULL,
  `name` text NOT NULL,
  `protocol` enum('tcpudp', 'http', 'https') NOT NULL DEFAULT 'tcpudp',
  `bind` text NOT NULL,
  `targets` longtext NOT NULL,
  `proxy` int(11) UNSIGNED NOT NULL DEFAULT '0',
  `conf` longtext NOT NULL,
  `status` enum(
    'Created',
    'Active',
    'Suspend',
    'Deleted',
    'Error',
    'Exhaust',
    'Disabled'
  ) NOT NULL DEFAULT 'Created',
  `sync` tinyint(1) UNSIGNED NOT NULL DEFAULT '0',
  `dest_device` int(11) NOT NULL DEFAULT '0',
  `dest_sync` tinyint(1) UNSIGNED NOT NULL DEFAULT '0'
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE `nodes` (
  `id` int(11) NOT NULL,
  `name` text NOT NULL,
  `addr` text NOT NULL,
  `assign_ips` longtext NOT NULL,
  `protocol` text NOT NULL,
  `nat_protocol` text NOT NULL,
  `outbounds` text NOT NULL,
  `nat_port` int(11) NOT NULL DEFAULT '0',
  `http_port` int(11) NOT NULL DEFAULT '0',
  `https_port` int(11) NOT NULL DEFAULT '0',
  `secure_port` int(11) NOT NULL DEFAULT '0',
  `securex_port` int(11) NOT NULL DEFAULT '0',
  `tls_port` int(11) NOT NULL DEFAULT '0',
  `tls_sni` text NOT NULL,
  `traffic` decimal(10, 2) NOT NULL DEFAULT '0.00',
  `speed` decimal(10, 2) NOT NULL DEFAULT '0.00',
  `icp` tinyint(1) NOT NULL DEFAULT '0',
  `firewall` tinyint(1) NOT NULL DEFAULT '0',
  `tls_verify` tinyint(1) NOT NULL DEFAULT '0',
  `tls_verify_host` tinyint(1) NOT NULL DEFAULT '0',
  `blocked_path` text NOT NULL,
  `blocked_hostname` text NOT NULL,
  `blocked_protocol` text NOT NULL,
  `secret` varchar(255) NOT NULL,
  `port_range` text NOT NULL,
  `reseved_ports` longtext NOT NULL,
  `reseved_target_ports` longtext NOT NULL,
  `note` longtext NOT NULL,
  `updated` datetime NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE `permissions` (
  `id` int(11) NOT NULL,
  `name` text NOT NULL,
  `nodes` longtext,
  `protocol` text NOT NULL,
  `nat_protocol` text NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE `plans` (
  `id` int(11) NOT NULL,
  `name` text NOT NULL,
  `permission_id` int(11) NOT NULL DEFAULT '0',
  `hidden` tinyint(1) NOT NULL DEFAULT '0',
  `rule` int(11) NOT NULL DEFAULT '0',
  `nat_rule` int(11) NOT NULL DEFAULT '0',
  `speed` int(11) NOT NULL DEFAULT '0',
  `conn` int(11) NOT NULL DEFAULT '0',
  `traffic` bigint(20) NOT NULL DEFAULT '0',
  `price` decimal(10, 2) NOT NULL DEFAULT '0.00',
  `cycle` int(11) NOT NULL DEFAULT '0',
  `note` longtext NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE `rules` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `node_id` int(11) NOT NULL,
  `name` text NOT NULL,
  `mode` int(11) UNSIGNED NOT NULL DEFAULT '0',
  `protocol` enum(
    'tcpudp',
    'http',
    'https',
    'host',
    'secure',
    'securex',
    'tls',
    'cloudflare'
  ) NOT NULL,
  `bind` text NOT NULL,
  `targets` longtext NOT NULL,
  `proxy` int(11) UNSIGNED NOT NULL DEFAULT '0',
  `outbound` text NOT NULL,
  `conf` longtext NOT NULL,
  `status` enum(
    'Created',
    'Active',
    'Suspend',
    'Deleted',
    'Error',
    'Exhaust',
    'Disabled'
  ) NOT NULL,
  `sync` tinyint(1) UNSIGNED NOT NULL DEFAULT '0',
  `dest_node` int(11) NOT NULL DEFAULT '0',
  `dest_device` int(11) NOT NULL DEFAULT '0',
  `dest_sync` tinyint(1) UNSIGNED NOT NULL DEFAULT '0'
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE `settings` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `value` text NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

INSERT INTO
  `settings` (`id`, `name`, `value`)
VALUES
  (1, 'license', ''),
  (2, 'secure_key', ''),
  (4, 'certificate', ''),
  (5, 'certificate_key', '');

CREATE TABLE `traffic_statistics` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `nat` tinyint(1) NOT NULL DEFAULT '0',
  `rule_id` int(11) NOT NULL,
  `traffic` bigint(20) UNSIGNED NOT NULL,
  `date` date NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE `tunnel_devices` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` text NOT NULL,
  `ips` longtext NOT NULL,
  `secure_port` int(11) NOT NULL DEFAULT '0',
  `securex_port` int(11) NOT NULL DEFAULT '0',
  `tls_port` int(11) NOT NULL DEFAULT '0',
  `tls_sni` text NOT NULL,
  `secret` text NOT NULL,
  `version` text NOT NULL,
  `updated` datetime NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `name` text NOT NULL,
  `password` text NOT NULL,
  `plan_id` int(11) NOT NULL DEFAULT '0',
  `permission_id` int(11) NOT NULL DEFAULT '0',
  `reset_date` date NOT NULL DEFAULT '0000-00-00',
  `expire_date` date NOT NULL DEFAULT '0000-00-00',
  `auto_renew` tinyint(1) NOT NULL DEFAULT '0',
  `rule` int(11) UNSIGNED NOT NULL DEFAULT '0',
  `nat_rule` int(11) UNSIGNED NOT NULL DEFAULT '0',
  `traffic` bigint(11) UNSIGNED NOT NULL DEFAULT '0',
  `traffic_used` bigint(11) UNSIGNED NOT NULL DEFAULT '0',
  `speed` int(11) UNSIGNED NOT NULL DEFAULT '0',
  `maxconn` int(11) UNSIGNED NOT NULL DEFAULT '0',
  `balance` decimal(10, 2) NOT NULL DEFAULT '0.00',
  `price` decimal(10, 2) UNSIGNED NOT NULL DEFAULT '0.00',
  `cycle` int(11) UNSIGNED NOT NULL DEFAULT '0',
  `permission` int(11) UNSIGNED NOT NULL DEFAULT '0',
  `api_token` text NOT NULL,
  `last_ip` varchar(255) NOT NULL,
  `last_active` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `registration_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

INSERT INTO
  `users` (
    `id`,
    `username`,
    `name`,
    `password`,
    `plan_id`,
    `permission_id`,
    `reset_date`,
    `expire_date`,
    `auto_renew`,
    `rule`,
    `nat_rule`,
    `traffic`,
    `traffic_used`,
    `speed`,
    `maxconn`,
    `balance`,
    `price`,
    `cycle`,
    `permission`,
    `api_token`,
    `last_ip`,
    `last_active`,
    `registration_date`
  )
VALUES
  (
    NULL,
    'admin',
    'Admin',
    MD5('admin'),
    '0',
    '0',
    '0000-00-00',
    '0000-00-00',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0',
    '0.00',
    '0.00',
    '0',
    '0',
    '',
    '',
    '0000-00-00 00:00:00.000000',
    CURRENT_TIMESTAMP
  );

ALTER TABLE
  `announcements`
ADD
  PRIMARY KEY (`id`);

ALTER TABLE
  `nat_devices`
ADD
  PRIMARY KEY (`id`);

ALTER TABLE
  `nat_rules`
ADD
  PRIMARY KEY (`id`);

ALTER TABLE
  `nodes`
ADD
  PRIMARY KEY (`id`),
ADD
  UNIQUE KEY `secret` (`secret`) USING BTREE;

ALTER TABLE
  `permissions`
ADD
  PRIMARY KEY (`id`);

ALTER TABLE
  `plans`
ADD
  PRIMARY KEY (`id`);

ALTER TABLE
  `rules`
ADD
  PRIMARY KEY (`id`);

ALTER TABLE
  `settings`
ADD
  PRIMARY KEY (`id`),
ADD
  UNIQUE KEY `name` (`name`) USING BTREE;

ALTER TABLE
  `traffic_statistics`
ADD
  PRIMARY KEY (`id`);

ALTER TABLE
  `tunnel_devices`
ADD
  PRIMARY KEY (`id`);

ALTER TABLE
  `users`
ADD
  PRIMARY KEY (`id`),
ADD
  UNIQUE KEY `username` (`username`) USING BTREE;

ALTER TABLE
  `announcements`
MODIFY
  `id` int(11) NOT NULL AUTO_INCREMENT,
  AUTO_INCREMENT = 4;

ALTER TABLE
  `nat_devices`
MODIFY
  `id` int(11) NOT NULL AUTO_INCREMENT,
  AUTO_INCREMENT = 8;

ALTER TABLE
  `nat_rules`
MODIFY
  `id` int(11) NOT NULL AUTO_INCREMENT,
  AUTO_INCREMENT = 6;

ALTER TABLE
  `nodes`
MODIFY
  `id` int(11) NOT NULL AUTO_INCREMENT,
  AUTO_INCREMENT = 7;

ALTER TABLE
  `permissions`
MODIFY
  `id` int(11) NOT NULL AUTO_INCREMENT,
  AUTO_INCREMENT = 4;

ALTER TABLE
  `plans`
MODIFY
  `id` int(11) NOT NULL AUTO_INCREMENT,
  AUTO_INCREMENT = 2;

ALTER TABLE
  `rules`
MODIFY
  `id` int(11) NOT NULL AUTO_INCREMENT,
  AUTO_INCREMENT = 14;

ALTER TABLE
  `settings`
MODIFY
  `id` int(11) NOT NULL AUTO_INCREMENT,
  AUTO_INCREMENT = 6;

ALTER TABLE
  `traffic_statistics`
MODIFY
  `id` int(11) NOT NULL AUTO_INCREMENT,
  AUTO_INCREMENT = 12;

ALTER TABLE
  `tunnel_devices`
MODIFY
  `id` int(11) NOT NULL AUTO_INCREMENT,
  AUTO_INCREMENT = 11;

ALTER TABLE
  `users`
MODIFY
  `id` int(11) NOT NULL AUTO_INCREMENT,
  AUTO_INCREMENT = 3;

COMMIT;