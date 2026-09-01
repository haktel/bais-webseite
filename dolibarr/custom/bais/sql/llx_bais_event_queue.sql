CREATE TABLE llx_bais_event_queue (
  rowid integer AUTO_INCREMENT PRIMARY KEY,
  entity integer NOT NULL DEFAULT 1,
  event_name varchar(64) NOT NULL,
  object_type varchar(32) NOT NULL,
  fk_object integer NOT NULL,
  bais_ref varchar(32) NULL,
  payload mediumtext NULL,
  status varchar(16) NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  last_error text NULL,
  datec datetime NULL,
  date_processed datetime NULL,
  tms timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_bais_event_queue_status (entity, status, datec),
  KEY idx_bais_event_queue_object (entity, object_type, fk_object)
) ENGINE=innodb;
