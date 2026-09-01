<?php
/* Copyright (C) 2026 Bünyamin Atik
 * GPL-3.0-or-later
 */

class BAISManager
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    public function getReference($objectType, $objectId, $entity = 1)
    {
        $sql = "SELECT bais_ref FROM ".$this->db->prefix()."bais_object_ref";
        $sql .= " WHERE object_type='".$this->db->escape($objectType)."'";
        $sql .= " AND fk_object=".((int) $objectId);
        $sql .= " AND entity=".((int) $entity);
        $resql = $this->db->query($sql);
        if (!$resql) return '';
        $obj = $this->db->fetch_object($resql);
        return $obj ? (string) $obj->bais_ref : '';
    }

    public function assignReference($objectType, $objectId, $prefix, $entity = 1, $sourceRef = '', $preferredRef = '')
    {
        $existing = $this->getReference($objectType, $objectId, $entity);
        if ($existing !== '') return $existing;

        $year = (int) date('Y');
        $baisRef = '';
        $pattern = '/^'.preg_quote($prefix, '/').'-(\\d{4})-(\\d{6})$/';
        if ($preferredRef !== '' && preg_match($pattern, $preferredRef, $matches)) {
            $baisRef = $preferredRef;
            $this->ensureSequenceAtLeast($objectType, (int) $matches[1], ((int) $matches[2]) + 1, $entity);
        } else {
            $sequence = $this->nextSequence($objectType, $year, $entity);
            $baisRef = sprintf('%s-%04d-%06d', $prefix, $year, $sequence);
        }

        $sql = "INSERT INTO ".$this->db->prefix()."bais_object_ref";
        $sql .= " (entity, object_type, fk_object, bais_ref, source_ref, datec, tms) VALUES (";
        $sql .= ((int) $entity).", '".$this->db->escape($objectType)."', ".((int) $objectId).", '".$this->db->escape($baisRef)."', '".$this->db->escape((string) $sourceRef)."', NOW(), NOW())";
        if (!$this->db->query($sql)) {
            $existing = $this->getReference($objectType, $objectId, $entity);
            if ($existing !== '') return $existing;
            throw new RuntimeException('Unable to store BAIS reference: '.$this->db->lasterror());
        }
        return $baisRef;
    }

    private function ensureSequenceAtLeast($scope, $year, $nextValue, $entity)
    {
        $sql = "INSERT INTO ".$this->db->prefix()."bais_sequence (entity, scope, seq_year, next_value, datec, tms) VALUES (";
        $sql .= ((int) $entity).", '".$this->db->escape($scope)."', ".((int) $year).", ".((int) $nextValue).", NOW(), NOW())";
        $sql .= " ON DUPLICATE KEY UPDATE next_value=GREATEST(next_value, VALUES(next_value)), tms=NOW()";
        if (!$this->db->query($sql)) {
            throw new RuntimeException('Unable to align BAIS sequence: '.$this->db->lasterror());
        }
    }

    private function nextSequence($scope, $year, $entity)
    {
        for ($attempt = 0; $attempt < 3; $attempt++) {
            $this->db->begin();
            $sql = "SELECT next_value FROM ".$this->db->prefix()."bais_sequence";
            $sql .= " WHERE scope='".$this->db->escape($scope)."'";
            $sql .= " AND seq_year=".((int) $year);
            $sql .= " AND entity=".((int) $entity)." FOR UPDATE";
            $resql = $this->db->query($sql);
            if (!$resql) {
                $this->db->rollback();
                throw new RuntimeException('Unable to lock BAIS sequence: '.$this->db->lasterror());
            }

            $obj = $this->db->fetch_object($resql);
            if ($obj) {
                $value = (int) $obj->next_value;
                $sqlUpdate = "UPDATE ".$this->db->prefix()."bais_sequence SET next_value=".($value + 1).", tms=NOW()";
                $sqlUpdate .= " WHERE scope='".$this->db->escape($scope)."' AND seq_year=".((int) $year)." AND entity=".((int) $entity);
                if (!$this->db->query($sqlUpdate)) {
                    $this->db->rollback();
                    throw new RuntimeException('Unable to update BAIS sequence: '.$this->db->lasterror());
                }
                $this->db->commit();
                return $value;
            }

            $sqlInsert = "INSERT INTO ".$this->db->prefix()."bais_sequence (entity, scope, seq_year, next_value, datec, tms) VALUES (";
            $sqlInsert .= ((int) $entity).", '".$this->db->escape($scope)."', ".((int) $year).", 2, NOW(), NOW())";
            if ($this->db->query($sqlInsert)) {
                $this->db->commit();
                return 1;
            }
            $this->db->rollback();
            usleep(50000 * ($attempt + 1));
        }
        throw new RuntimeException('Unable to allocate BAIS sequence after retries');
    }

    private function ensureCustomerOnboardingSchema()
    {
        $sql = "CREATE TABLE IF NOT EXISTS ".$this->db->prefix()."bais_customer_onboarding (";
        $sql .= "rowid integer AUTO_INCREMENT PRIMARY KEY, ";
        $sql .= "entity integer NOT NULL DEFAULT 1, ";
        $sql .= "fk_soc integer NOT NULL, ";
        $sql .= "bais_ref varchar(32) NOT NULL, ";
        $sql .= "status varchar(32) NOT NULL DEFAULT 'prepared', ";
        $sql .= "template_version varchar(16) NOT NULL DEFAULT 'v1', ";
        $sql .= "template_manifest text NULL, ";
        $sql .= "datec datetime NULL, tms timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, ";
        $sql .= "UNIQUE KEY uk_bais_customer_onboarding (entity, fk_soc), ";
        $sql .= "KEY idx_bais_customer_onboarding_ref (entity, bais_ref)";
        $sql .= ")";
        if (!$this->db->query($sql)) {
            throw new RuntimeException('Unable to ensure BAIS customer onboarding schema: '.$this->db->lasterror());
        }
    }

    public function ensureCustomerStarterPack($thirdpartyId, $baisRef, $entity = 1)
    {
        $this->ensureCustomerOnboardingSchema();
        $templates = array(
            'kundenstammblatt-v1',
            'welcome-onboarding-v1',
            'angebot-sow-check-v1',
            'avv-dsgvo-check-v1',
            'projekt-kickoff-v1',
            'abnahme-vorbereitung-v1'
        );
        $manifest = json_encode($templates, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($manifest === false) $manifest = '[]';

        $sql = "INSERT INTO ".$this->db->prefix()."bais_customer_onboarding";
        $sql .= " (entity, fk_soc, bais_ref, status, template_version, template_manifest, datec, tms) VALUES (";
        $sql .= ((int) $entity).", ".((int) $thirdpartyId).", '".$this->db->escape((string) $baisRef)."', 'prepared', 'v1', '".$this->db->escape($manifest)."', NOW(), NOW())";
        $sql .= " ON DUPLICATE KEY UPDATE bais_ref=VALUES(bais_ref), template_version='v1', template_manifest=VALUES(template_manifest), tms=NOW()";
        if (!$this->db->query($sql)) {
            throw new RuntimeException('Unable to prepare BAIS customer starter pack: '.$this->db->lasterror());
        }
        return $templates;
    }

    public function getCustomerStarterPack($thirdpartyId, $entity = 1)
    {
        $this->ensureCustomerOnboardingSchema();
        $sql = "SELECT bais_ref,status,template_version,template_manifest,datec,tms FROM ".$this->db->prefix()."bais_customer_onboarding";
        $sql .= " WHERE entity=".((int) $entity)." AND fk_soc=".((int) $thirdpartyId)." LIMIT 1";
        $resql = $this->db->query($sql);
        if (!$resql) return null;
        $obj = $this->db->fetch_object($resql);
        if (!$obj) return null;
        $templates = json_decode((string) $obj->template_manifest, true);
        if (!is_array($templates)) $templates = array();
        return array(
            'bais_ref' => (string) $obj->bais_ref,
            'status' => (string) $obj->status,
            'template_version' => (string) $obj->template_version,
            'templates' => $templates,
            'datec' => (string) $obj->datec,
            'tms' => (string) $obj->tms,
        );
    }

    public function enqueueEvent($eventName, $objectType, $objectId, $baisRef, array $payload = array(), $entity = 1)
    {
        $payloadJson = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($payloadJson === false) $payloadJson = '{}';

        $sql = "INSERT INTO ".$this->db->prefix()."bais_event_queue";
        $sql .= " (entity, event_name, object_type, fk_object, bais_ref, payload, status, attempts, datec, tms) VALUES (";
        $sql .= ((int) $entity).", '".$this->db->escape($eventName)."', '".$this->db->escape($objectType)."', ".((int) $objectId).", '".$this->db->escape((string) $baisRef)."', '".$this->db->escape($payloadJson)."', 'pending', 0, NOW(), NOW())";
        return (bool) $this->db->query($sql);
    }
}
