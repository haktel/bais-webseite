<?php
/* Copyright (C) 2026 Bünyamin Atik
 * GPL-3.0-or-later
 */

use Luracast\Restler\RestException;

dol_include_once('/bais/class/baismanager.class.php');
require_once DOL_DOCUMENT_ROOT.'/projet/class/project.class.php';

/**
 * BAIS integration API.
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

    /**
     * Create or update the Dolibarr project that belongs to one BAIS project.
     *
     * @url POST /project/upsert
     */
    public function projectUpsert($request_data = null)
    {
        global $db, $conf;
        $this->requireProjectWritePermission();

        $data = is_array($request_data) ? $request_data : array();
        $customerRef = trim((string) ($data['customer_ref'] ?? ''));
        $projectRef = trim((string) ($data['project_ref'] ?? ''));
        $title = trim((string) ($data['title'] ?? ''));
        $sowStatus = trim((string) ($data['sow_status'] ?? 'draft'));
        $offerNumber = trim((string) ($data['offer_number'] ?? ''));
        $projectStart = trim((string) ($data['project_start'] ?? ''));
        $modules = isset($data['modules']) && is_array($data['modules']) ? $data['modules'] : array();

        if (!preg_match('/^KD-\d{4}-\d{6}$/', $customerRef)) {
            throw new RestException(400, 'Invalid BAIS customer reference');
        }
        if (!preg_match('/^PR-\d{4}-\d{6}$/', $projectRef)) {
            throw new RestException(400, 'Invalid BAIS project reference');
        }
        if ($title === '' || strlen($title) > 180) {
            throw new RestException(400, 'Invalid project title');
        }
        if (!in_array($sowStatus, array('draft', 'approved', 'signed'), true)) {
            throw new RestException(400, 'Invalid SOW status');
        }

        $allowedModules = array(
            'MOD-01' => 'Website-Entwicklung',
            'MOD-02' => 'Project Portal',
            'MOD-03' => 'Wartung/Hosting-Setup',
            'MOD-04' => 'Content-Pflege',
        );
        $normalizedModules = array();
        foreach ($modules as $module) {
            $code = trim((string) (is_array($module) ? ($module['code'] ?? '') : ''));
            if (!isset($allowedModules[$code])) {
                throw new RestException(400, 'Unsupported BAIS module');
            }
            $normalizedModules[$code] = $allowedModules[$code];
        }
        if (empty($normalizedModules)) {
            throw new RestException(400, 'At least one BAIS module is required');
        }

        $sql = "SELECT rowid FROM ".$db->prefix()."societe";
        $sql .= " WHERE entity=".((int) $conf->entity);
        $sql .= " AND ref_ext='".$db->escape($customerRef)."'";
        $sql .= " AND status=1 AND client IN (1,2,3) ORDER BY rowid ASC LIMIT 1";
        $resql = $db->query($sql);
        if (!$resql) {
            throw new RestException(500, 'Unable to resolve BAIS customer');
        }
        $soc = $db->fetch_object($resql);
        if (!$soc) {
            throw new RestException(409, 'BAIS customer is not synchronized to Dolibarr yet');
        }
        $socid = (int) $soc->rowid;

        $project = new Project($db);
        $found = $project->fetch(0, $projectRef);
        $created = false;
        if ($found < 0) {
            throw new RestException(500, 'Unable to search Dolibarr project');
        }

        $lines = array();
        foreach ($normalizedModules as $code => $name) {
            $lines[] = $code.' - '.$name;
        }
        $block = "[BAIS-SOW]\n";
        $block .= "Kunden-Nr.: ".$customerRef."\n";
        $block .= "Projekt-Nr.: ".$projectRef."\n";
        $block .= "SOW-Status: ".$sowStatus."\n";
        if ($offerNumber !== '') $block .= "Angebot: ".$offerNumber."\n";
        $block .= "Module: ".implode(', ', $lines)."\n";
        $block .= "[/BAIS-SOW]";
        $existingNote = $found > 0 ? (string) $project->note_private : '';
        $existingNote = trim((string) preg_replace('/\[BAIS-SOW\].*?\[\/BAIS-SOW\]/s', '', $existingNote));
        $note = trim($existingNote.($existingNote !== '' ? "\n\n" : '').$block);

        if ($found > 0) {
            $project->title = $title;
            $project->socid = $socid;
            $project->note_private = $note;
            $project->public = 0;
            $project->usage_task = 1;
            if ($projectStart !== '') $project->date_start = dol_stringtotime($projectStart.' 12:00:00');
            if (in_array($sowStatus, array('approved','signed'), true) && (int) $project->status === 0) $project->status = 1;
            $result = $project->update($this->user);
            if ($result < 0) throw new RestException(500, 'Unable to update Dolibarr project: '.$project->error);
        } else {
            $project = new Project($db);
            $project->ref = $projectRef;
            $project->title = $title;
            $project->socid = $socid;
            $project->description = 'BAIS Project '.$projectRef;
            $project->note_private = $note;
            $project->public = 0;
            $project->usage_task = 1;
            $project->status = in_array($sowStatus, array('approved','signed'), true) ? 1 : 0;
            if ($projectStart !== '') $project->date_start = dol_stringtotime($projectStart.' 12:00:00');
            $id = $project->create($this->user);
            if ($id <= 0) throw new RestException(500, 'Unable to create Dolibarr project: '.$project->error);
            $project->id = $id;
            $created = true;
        }

        $manager = new BAISManager($db);
        $baisRef = $manager->assignReference('project', (int) $project->id, 'PR', (int) $conf->entity, $projectRef, $projectRef);
        $manager->enqueueEvent(
            'BAIS_SOW_PROJECT_UPSERT',
            'project',
            (int) $project->id,
            $baisRef,
            array(
                'customer_ref' => $customerRef,
                'project_ref' => $projectRef,
                'sow_status' => $sowStatus,
                'offer_number' => $offerNumber,
                'modules' => array_keys($normalizedModules),
                'created' => $created,
            ),
            (int) $conf->entity
        );

        return array(
            'ok' => true,
            'id' => (int) $project->id,
            'ref' => $projectRef,
            'bais_ref' => $baisRef,
            'customer_ref' => $customerRef,
            'created' => $created,
            'modules' => array_keys($normalizedModules),
        );
    }

    private function requireReadPermission()
    {
        if (!$this->user || (!$this->user->admin && !$this->user->hasRight('bais', 'reference', 'read'))) {
            throw new RestException(403, 'BAIS read permission required');
        }
    }

    private function requireProjectWritePermission()
    {
        if (!$this->user || (!$this->user->admin && !$this->user->hasRight('bais', 'project', 'write'))) {
            throw new RestException(403, 'BAIS project write permission required');
        }
    }
}
