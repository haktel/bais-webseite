PRAGMA foreign_keys=ON;

-- Remove only the old automatically-created placeholder projects that never
-- received real project data. Projects with milestones, documents, approvals
-- or staged uploads are intentionally preserved for manual review.

DELETE FROM customer_access_grants
WHERE project_id IN (
 SELECT p.id
 FROM projects p
 WHERE p.name='Erstprojekt / Intake'
   AND p.status='planned'
   AND NOT EXISTS(SELECT 1 FROM milestones m WHERE m.project_id=p.id)
   AND NOT EXISTS(SELECT 1 FROM documents d WHERE d.project_id=p.id)
   AND NOT EXISTS(SELECT 1 FROM approvals a WHERE a.project_id=p.id)
   AND NOT EXISTS(SELECT 1 FROM document_uploads du WHERE du.project_id=p.id)
);

DELETE FROM project_members
WHERE project_id IN (
 SELECT p.id
 FROM projects p
 WHERE p.name='Erstprojekt / Intake'
   AND p.status='planned'
   AND NOT EXISTS(SELECT 1 FROM milestones m WHERE m.project_id=p.id)
   AND NOT EXISTS(SELECT 1 FROM documents d WHERE d.project_id=p.id)
   AND NOT EXISTS(SELECT 1 FROM approvals a WHERE a.project_id=p.id)
   AND NOT EXISTS(SELECT 1 FROM document_uploads du WHERE du.project_id=p.id)
);

DELETE FROM project_registry
WHERE project_id IN (
 SELECT p.id
 FROM projects p
 WHERE p.name='Erstprojekt / Intake'
   AND p.status='planned'
   AND NOT EXISTS(SELECT 1 FROM milestones m WHERE m.project_id=p.id)
   AND NOT EXISTS(SELECT 1 FROM documents d WHERE d.project_id=p.id)
   AND NOT EXISTS(SELECT 1 FROM approvals a WHERE a.project_id=p.id)
   AND NOT EXISTS(SELECT 1 FROM document_uploads du WHERE du.project_id=p.id)
);

DELETE FROM projects
WHERE name='Erstprojekt / Intake'
  AND status='planned'
  AND NOT EXISTS(SELECT 1 FROM milestones m WHERE m.project_id=projects.id)
  AND NOT EXISTS(SELECT 1 FROM documents d WHERE d.project_id=projects.id)
  AND NOT EXISTS(SELECT 1 FROM approvals a WHERE a.project_id=projects.id)
  AND NOT EXISTS(SELECT 1 FROM document_uploads du WHERE du.project_id=projects.id);
