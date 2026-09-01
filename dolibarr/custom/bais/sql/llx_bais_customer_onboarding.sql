CREATE TABLE llx_bais_customer_onboarding (
  rowid integer AUTO_INCREMENT PRIMARY KEY,
  entity integer NOT NULL DEFAULT 1,
  fk_soc integer NOT NULL,
  bais_ref varchar(32) NOT NULL,
  status varchar(32) NOT NULL DEFAULT 'prepared',
  template_version varchar(16) NOT NULL DEFAULT 'v1',
  template_manifest text NULL,
  datec datetime NULL,
  tms timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_bais_customer_onboarding (entity, fk_soc),
  KEY idx_bais_customer_onboarding_ref (entity, bais_ref)
) ENGINE=innodb;
