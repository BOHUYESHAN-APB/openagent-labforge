---
name: "machine-learning"
description: "Machine learning skills for biomarker discovery, model interpretation, and predictive modeling on omics data."
metadata:
  category: "research/bioinformatics"
  discovery_hidden: "true"
  catalog_tier: "category"
  upstream_source: "GPTomics/bioSkills"
---
# Machine Learning Category Guide

Machine learning skills for biomarker discovery, model interpretation, and predictive modeling on omics data.

Use this category guide only to choose the correct detailed leaf skill(s).

## Available Leaf Skills

- `research/bioinformatics/machine-learning/atlas-mapping` — Maps query single-cell data to reference atlases using scArches transfer learning with scVI and scANVI models. Transfers cell type labels without retraining on combined data. Use when annotating new single-cell datasets using pre-trained reference models.
- `research/bioinformatics/machine-learning/biomarker-discovery` — Selects informative features for biomarker discovery using Boruta all-relevant selection, mRMR minimum redundancy, and LASSO regularization. Use when identifying biomarkers from high-dimensional omics data.
- `research/bioinformatics/machine-learning/model-validation` — Implements nested cross-validation and stratified splits for unbiased model evaluation on biomedical datasets. Prevents data leakage and overfitting in biomarker discovery. Use when validating classifiers or optimizing hyperparameters on omics data.
- `research/bioinformatics/machine-learning/omics-classifiers` — Builds classification models for omics data using RandomForest, XGBoost, and logistic regression with sklearn-compatible APIs. Includes proper preprocessing and evaluation metrics for biomarker classifiers. Use when building diagnostic or prognostic classifiers from expression or variant data.
- `research/bioinformatics/machine-learning/prediction-explanation` — Explains machine learning predictions on omics data using SHAP values and LIME for feature attribution. Identifies which genes or features drive classifier decisions. Use when interpreting biomarker classifiers or understanding model predictions.
- `research/bioinformatics/machine-learning/survival-analysis` — Analyzes time-to-event data using Kaplan-Meier curves, log-rank tests, and Cox proportional hazards regression with lifelines. Builds survival models from clinical and omics features. Use when predicting patient survival or modeling time-to-event outcomes.

## Routing Rule

- Choose the narrowest matching leaf skill.
- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.
- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.