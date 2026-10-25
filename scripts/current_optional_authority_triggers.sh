#!/usr/bin/env bash
# Stable, fail-closed entry point for optional authority workflow trigger regression.
set -euo pipefail
cd "$(dirname "$0")/.."
node scripts/build633_optional_authority_triggers_test.mjs
node scripts/build634_optional_authority_cohort_b_test.mjs
node scripts/build635_optional_authority_cohort_c_test.mjs
node scripts/build636_optional_authority_cohort_d_test.mjs
node scripts/build637_optional_authority_cohort_e_test.mjs
node scripts/build638_optional_authority_cohort_f_test.mjs
node scripts/build639_optional_authority_cohort_g_test.mjs
node scripts/build640_optional_authority_cohort_h_test.mjs
node scripts/build641_optional_authority_cohort_i_test.mjs
node scripts/build642_optional_authority_cohort_j_test.mjs
node scripts/build643_optional_authority_cohort_k_test.mjs
node scripts/build644_optional_authority_cohort_l_test.mjs
