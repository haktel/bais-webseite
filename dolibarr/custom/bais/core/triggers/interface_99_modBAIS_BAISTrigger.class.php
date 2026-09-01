<?php
/* Copyright (C) 2026 Bünyamin Atik
 * GPL-3.0-or-later
 */

require_once DOL_DOCUMENT_ROOT.'/core/triggers/dolibarrtriggers.class.php';
dol_include_once('/bais/class/baismanager.class.php');

class InterfaceBAISTrigger extends DolibarrTriggers
{
    public $family = 'interface';
    public $description = 'BAIS business event integration';
    public $version = self::VERSION_DOLIBARR;
    public $picto = 'building';

    public function __construct($db)
    {
        $this->db = $db;
        $this->name = preg_replace('/^Interface/i', '', get_class($this));
    }

    public function runTrigger($action, $object, User $user, Translate $langs, Conf $conf)
    {
        if (!isModEnabled('bais')) return 0;

        try {
            $manager = new BAISManager($this->db);
            $entity = !empty($object->entity) ? (int) $object->entity : (int) $conf->entity;
            $objectId = !empty($object->id) ? (int) $object->id : 0;
            if ($objectId <= 0) return 0;

            $objectType = '';
            $prefix = '';
            $baisRef = '';

            if (($action === 'COMPANY_CREATE' || $action === 'COMPANY_MODIFY') && !empty($object->client)) {
                $objectType = 'customer'; $prefix = 'KD';
            } elseif ($action === 'PROJECT_CREATE') {
                $objectType = 'project'; $prefix = 'PR';
            } elseif ($action === 'PROPAL_CREATE') {
                $objectType = 'proposal'; $prefix = 'AN';
            } elseif ($action === 'BILL_CREATE') {
                $objectType = 'invoice'; $prefix = 'RE';
            }

            if ($objectType !== '') {
                $sourceRef = !empty($object->ref) ? (string) $object->ref : '';
                $preferredRef = '';
                if ($objectType === 'customer' && !empty($object->ref_ext) && preg_match('/^KD-\\d{4}-\\d{6}$/', (string) $object->ref_ext)) {
                    $preferredRef = (string) $object->ref_ext;
                }
                $baisRef = $manager->assignReference($objectType, $objectId, $prefix, $entity, $sourceRef, $preferredRef);
            }

            $trackedActions = array(
                'COMPANY_CREATE', 'COMPANY_MODIFY',
                'PROJECT_CREATE', 'PROJECT_VALIDATE',
                'PROPAL_CREATE', 'PROPAL_VALIDATE', 'PROPAL_CLOSE_SIGNED',
                'BILL_CREATE', 'BILL_VALIDATE', 'BILL_PAYED', 'BILL_UNPAYED',
                'PAYMENT_CUSTOMER_CREATE'
            );

            if (in_array($action, $trackedActions, true)) {
                $manager->enqueueEvent(
                    $action,
                    $objectType !== '' ? $objectType : (string) (!empty($object->element) ? $object->element : 'unknown'),
                    $objectId,
                    $baisRef,
                    array(
                        'action' => $action,
                        'dolibarr_ref' => !empty($object->ref) ? (string) $object->ref : '',
                        'user_id' => (int) $user->id,
                    ),
                    $entity
                );
            }
        } catch (Throwable $e) {
            dol_syslog('BAIS trigger error for '.$action.': '.$e->getMessage(), LOG_ERR);
            return 0;
        }

        return 1;
    }
}
