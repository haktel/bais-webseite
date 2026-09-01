<?php
/* Copyright (C) 2026 Bünyamin Atik
 * GPL-3.0-or-later
 */

use Luracast\Restler\RestException;

dol_include_once('/bais/class/baismanager.class.php');

/**
 * BAIS read-only API.
 *
 * @access protected
 * @class DolibarrApiAccess {@requires user,external}
 */
class BAISApi extends DolibarrApi
{
    /**
     * @url GET /health
     */
    public function health()
    {
        global $conf;
        $this->requireReadPermission();

        return array(
            'ok' => true,
            'module' => 'BAIS',
            'version' => '0.1.0',
            'entity' => (int) $conf->entity,
            'time' => dol_now(),
        );
    }

    /**
     * @url GET /reference/{type}/{id}
     */
    public function reference($type, $id)
    {
        global $db, $conf;
        $this->requireReadPermission();

        $allowed = array('customer', 'project', 'proposal', 'invoice');
        if (!in_array($type, $allowed, true)) {
            throw new RestException(400, 'Unsupported BAIS object type');
        }

        $manager = new BAISManager($db);
        $ref = $manager->getReference($type, (int) $id, (int) $conf->entity);
        if ($ref === '') {
            throw new RestException(404, 'BAIS reference not found');
        }

        return array('type' => $type, 'id' => (int) $id, 'bais_ref' => $ref);
    }

    /**
     * @url GET /events
     */
    public function events($status = 'pending', $limit = 50)
    {
        global $db, $conf;
        $this->requireReadPermission();

        $allowedStatus = array('pending', 'processing', 'done', 'failed');
        if (!in_array($status, $allowedStatus, true)) {
            throw new RestException(400, 'Unsupported event status');
        }

        $limit = max(1, min(100, (int) $limit));
        $rows = array();

        $sql = "SELECT rowid, event_name, object_type, fk_object, bais_ref, payload, status, attempts, datec";
        $sql .= " FROM ".$db->prefix()."bais_event_queue WHERE entity=".((int) $conf->entity);
        $sql .= " AND status='".$db->escape($status)."' ORDER BY rowid ASC LIMIT ".$limit;

        $resql = $db->query($sql);
        if (!$resql) {
            throw new RestException(500, 'Unable to read BAIS event queue');
        }

        while ($obj = $db->fetch_object($resql)) {
            $payload = json_decode((string) $obj->payload, true);
            if (!is_array($payload)) $payload = array();

            $rows[] = array(
                'id' => (int) $obj->rowid,
                'event_name' => (string) $obj->event_name,
                'object_type' => (string) $obj->object_type,
                'object_id' => (int) $obj->fk_object,
                'bais_ref' => (string) $obj->bais_ref,
                'payload' => $payload,
                'status' => (string) $obj->status,
                'attempts' => (int) $obj->attempts,
                'created_at' => (string) $obj->datec,
            );
        }

        return $rows;
    }

    private function requireReadPermission()
    {
        if (!$this->user || (!$this->user->admin && !$this->user->hasRight('bais', 'reference', 'read'))) {
            throw new RestException(403, 'BAIS read permission required');
        }
    }
}
