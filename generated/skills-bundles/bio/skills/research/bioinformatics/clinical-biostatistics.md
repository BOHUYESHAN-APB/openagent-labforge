---
name: "clinical-biostatistics"
description: "Statistical analysis methods for clinical trial data, from CDISC data handling through logistic regression, categorical testing, and regulatory-compliant reporting."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Clinical Biostatistics Category Guide

Statistical analysis methods for clinical trial data, from CDISC data handling through logistic regression, categorical testing, and regulatory-compliant reporting.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/clinical-biostatistics/categorical-tests` — Tests associations between categorical variables in clinical data using chi-square, Fisher's exact, and Cochran-Mantel-Haenszel tests. Computes effect sizes and post-hoc pairwise comparisons. Use when analyzing categorical outcomes or testing treatment-outcome independence in clinical trials.
- `research/bioinformatics/clinical-biostatistics/cdisc-data-handling` — Reads and prepares CDISC SDTM clinical trial data for analysis. Handles domain tables (DM, AE, EX, VS, LB), USUBJID-based joins, event-to-subject aggregation, and SUPPQUAL pivoting. Use when working with clinical trial datasets in CDISC/SDTM format or .xpt files.
- `research/bioinformatics/clinical-biostatistics/effect-measures` — Computes and interprets treatment effect measures including odds ratios, risk ratios, number needed to treat, and confidence intervals from clinical trial data. Covers crude and adjusted measures, non-collapsibility of odds ratios, and forest plot visualization. Use when reporting treatment effects or comparing effect sizes across clinical studies.
- `research/bioinformatics/clinical-biostatistics/logistic-regression` — Performs logistic regression for clinical trial outcomes including binary, ordinal, and multinomial models. Extracts odds ratios with confidence intervals, handles covariate adjustment, and provides Firth penalized regression for rare events or separation. Use when modeling binary or ordinal endpoints from clinical data.
- `research/bioinformatics/clinical-biostatistics/subgroup-analysis` — Performs stratified and subgroup analyses for clinical trial data. Covers Mantel-Haenszel pooling, Breslow-Day homogeneity testing, interaction terms in regression, multiple comparisons correction, and forest plot visualization. Use when analyzing treatment effects across patient subgroups or controlling for stratification variables.
- `research/bioinformatics/clinical-biostatistics/trial-reporting` — Prepares statistical tables and reports for clinical trials following regulatory standards. Generates Table 1 baseline characteristics, defines analysis populations (ITT, per-protocol, safety), performs multiple imputation for missing data, and follows CONSORT and ICH E9 guidelines. Use when creating analysis reports, handling missing data, or preparing regulatory submissions from clinical trials.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.