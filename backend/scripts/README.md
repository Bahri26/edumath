# Backend Scripts

This folder contains operational scripts used for data import, normalization, and setup.

## Structure

- `data/`: static input payloads used by import scripts.
- `dev/`: local development/debug/test helper scripts.
- root scripts: production-safe maintenance scripts.

## Production-safe scripts

- `import_questions_to_cloud_sql.js`: imports question data into Cloud SQL MySQL.
- `normalize_shape_placeholders_in_db.js`: normalizes placeholder/legacy shape tokens.
- `assign_teacher_subjects.js`: assigns teacher subjects.
- `check_ap_csa.js`, `setup_ap_csa_curriculum.js`, `update_ap_csa_topics.js`: AP CSA setup helpers.

## Dev-only scripts

Dev-only scripts are under `dev/` and should not be used in deployment pipelines.
