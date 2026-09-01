CREATE TABLE llx_bais_object_ref (
  rowid integer AUTO_INCREMENT PRIMARY KEY,
  entity integer NOT NULL DEFAULT 1,
  object_type varchar(32) NOT NULL,
  fk_object integer NOT NULL,
  bais_ref varchar(32) NOT NULL,
  source_ref varchar(128) NULL,
  datec datetime NULL,
  tms timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_bais_object_ref_object (entity, object_type, fk_object),
  UNIQUE KEY uk_bais_object_ref_value (entity, bais_ref),
  KEY idx_bais_object_ref_type (entity, object_type)
) ENGINE=innodb;
