<?php
/* Copyright (C) 2026 Bünyamin Atik
 * GPL-3.0-or-later
 */

include_once DOL_DOCUMENT_ROOT.'/core/modules/DolibarrModules.class.php';

class modBAIS extends DolibarrModules
{
    public function __construct($db)
    {
        $this->db = $db;
        $this->numero = 500321;
        $this->rights_class = 'bais';
        $this->family = 'interface';
        $this->module_position = '90';
        $this->name = 'BAIS';
        $this->description = 'BAIS integration and workflow module';
        $this->descriptionlong = 'BAIS customer/project identifiers, audit events and integration endpoints.';
        $this->editor_name = 'BAIS - Bünyamin Atik - IT Solutions';
        $this->editor_url = 'https://bais-solutions.de';
        $this->version = '0.3.0';
        $this->const_name = 'MAIN_MODULE_BAIS';
        $this->picto = 'building';
        $this->module_parts = array(
            'triggers' => 1,
            'css' => array(),
            'js' => array(),
            'hooks' => array(),
            'moduleforexternal' => 0,
        );
        $this->dirs = array('/bais/temp');
        $this->config_page_url = array();
        $this->langfiles = array('bais@bais');

        $this->rights = array();
        $r = 0;
        $this->rights[$r][0] = 50032101;
        $this->rights[$r][1] = 'Read BAIS identifiers and events';
        $this->rights[$r][4] = 'reference';
        $this->rights[$r][5] = 'read';
        $r++;
        $this->rights[$r][0] = 50032102;
        $this->rights[$r][1] = 'Manage BAIS integration settings';
        $this->rights[$r][4] = 'settings';
        $this->rights[$r][5] = 'write';
        $r++;
        $this->rights[$r][0] = 50032103;
        $this->rights[$r][1] = 'Create or update BAIS projects from signed SOW';
        $this->rights[$r][4] = 'project';
        $this->rights[$r][5] = 'write';
    }

    public function init($options = '')
    {
        $result = $this->_load_tables('/bais/sql/');
        if ($result < 0) {
            return -1;
        }
        return $this->_init(array(), $options);
    }

    public function remove($options = '')
    {
        return $this->_remove(array(), $options);
    }
}
