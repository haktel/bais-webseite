CREATE TABLE llx_bais_sequence (
  rowid integer AUTO_INCREMENT PRIMARY KEY,
  entity integer NOT NULL DEFAULT 1,
  scope varchar(32) NOT NULL,
  seq_year integer NOT NULL,
  next_value integer NOT NULL DEFAULT 1,
  datec datetime NULL,
  tms timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_bais_sequence (entity, scope, seq_year)
) ENGINE=innodb;
