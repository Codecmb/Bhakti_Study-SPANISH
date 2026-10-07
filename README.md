# Bhakti Study — Academia Master Siddhānta Gauḍīya

Bhakti Study is a self-contained, modular śāstra-study environment designed around the academic progression:

**Study → Remember → Realize**

The Academy combines canonical source reading, structured courses, study questions, personal study work, assessments, progress tracking, reference resources, and Academy completion certificates while keeping authoritative source material separate from student-created work.

Bhakti Study is designed as a modular academic environment in which:

**canonical sources remain authoritative,  
courses organize study,  
shared tools support learning,  
student work remains independent,  
progress records Academy completion,  
and provenance remains visible.**

The guiding principle is:

> **One source of truth, many uses.**

---

## 1. Academy Programs

The application currently includes:

### Bhakti Śāstrī

- Bhagavad-gītā
- Śrī Īśopaniṣad
- Nectar of Instruction
- Nectar of Devotion

### Bhakti Vaibhava

- Śrīmad-Bhāgavatam Cantos 1–6

### Bhakti Vedānta

- Śrīmad-Bhāgavatam Cantos 7–12

### Bhakti Sārvabhauma

- Caitanya-caritāmṛta Ādi-līlā
- Caitanya-caritāmṛta Madhya-līlā
- Caitanya-caritāmṛta Antya-līlā

---

## 2. Ṣaṭ Sandarbhas

Bhakti Study also includes a dedicated advanced study environment for the Ṣaṭ Sandarbhas of Śrī Jīva Gosvāmī:

1. Tattva Sandarbha
2. Bhagavat Sandarbha
3. Paramātma Sandarbha
4. Kṛṣṇa Sandarbha
5. Bhakti Sandarbha
6. Prīti Sandarbha

The Sandarbha environment is intentionally distinct from the standard Academy course reader.

It preserves canonical anuccheda identities, source provenance, specialized study structures, and Sandarbha-specific learning tools rather than forcing these texts into the architecture of the four Academy programs.

### Spanish Translation Workflow

The Spanish edition includes a dedicated translation/editor workflow for the progressive translation of the Ṣaṭ Sandarbhas.

The translation system is designed to preserve:

- canonical anuccheda identity;
- the relationship between English source material and Spanish translation;
- source provenance;
- existing translated material;
- incremental translation work;
- compatibility with the specialized Sandarbha study environment.

Translation work must not create competing canonical copies of the same source.

---

## 3. Canonical Library

The Library is the authoritative source layer of Bhakti Study.

Courses and study tools should reference canonical material rather than maintaining independent copies of the same text.

This allows a single canonical source to support multiple uses:

**Canonical Source → Course → Reader → Questions → Study Work → Journal → Progress**

The course organizes study. It does not become a second source of truth.

---

## 4. Shared Study Tools

Bhakti Study uses shared academic tools across programs wherever possible.

These include:

- Books & Library
- Study workspace
- Question Bank
- student-created questions
- Student Portfolio / My Work
- Study Journal
- progress tracking
- assessments
- certificates
- reference resources
- source resolution and provenance
- import/export tools

Shared capabilities should be implemented once and consumed by programs through stable interfaces and configuration rather than duplicated separately for each course.

---

## 5. Study Journal

The Study Journal provides passage-linked personal study work while remaining separate from canonical source material.

Journal capabilities include:

- passage-linked entries;
- automatic reader context;
- Follow Reader mode;
- autosave;
- personal notes;
- study questions and working answers;
- tags;
- search;
- book filtering;
- tag filtering;
- sorting;
- entry counts;
- persistent saved entries;
- RTF export for AI-assisted review.

The Journal opens in a separate study window so that the canonical reader can remain visible while the student writes.

Student journal content never modifies the canonical text.

---

## 6. Academic Provenance

Source provenance is a core architectural requirement.

Bhakti Study distinguishes between:

- canonical source text;
- translations;
- commentaries;
- course organization;
- Academy questions;
- student-created questions;
- personal notes and answers;
- supplemental explanations.

Non-Prabhupāda material should retain visible attribution to its author and source.

The system should never silently merge commentary, interpretation, or student work into canonical source material.

---

## 7. Portable by Design

Bhakti Study is designed to be self-contained and portable.

A working copy of the Academy should be downloadable and usable locally without requiring the academic content or student environment to depend on GitHub at runtime.

Portability is a design requirement, not a replacement for version control.

---

## 8. Git and GitHub

The project remains a normal Git repository.

Git and GitHub provide:

- version history;
- development checkpoints;
- backup;
- synchronization;
- collaboration;
- controlled deployment and distribution.

The normal development workflow may use GitHub Desktop for pull, commit, push, and repository management.

The two goals are complementary:

> **Portable for the student. Git-controlled for development.**

A portable copy must not require the removal of `.git` from the development repository, and maintaining GitHub synchronization must not make the Academy dependent on GitHub for normal study.

---

## 9. Architectural Rules

Future development should preserve the following rules:

1. **One canonical source.** Do not duplicate authoritative source content unnecessarily.
2. **Courses reference sources.** Course structure and canonical source storage remain separate.
3. **Student work remains separate.** Notes, questions, answers, journals, and progress must not modify canonical material.
4. **Shared tools remain shared.** Avoid course-specific duplicates of reusable systems.
5. **Provenance remains visible.** Sources and authorship must remain identifiable.
6. **Specialized readers remain specialized.** Do not replace working Bhakti Vaibhava or Ṣaṭ Sandarbha architectures merely to make them conform to another reader.
7. **Spanish translation preserves canonical identity.** Translation should not break source relationships or provenance.
8. **Modules remain independently maintainable.** Adding or removing one shared capability should not break unrelated systems.
9. **Portability must be preserved.**
10. **Git/GitHub remains the normal development and version-control workflow.**

---

## 10. Repository Areas

Major application areas include:

- `programs/` — Academy programs and Ṣaṭ Sandarbhas program configuration
- `library/` — canonical book/library resources
- `library/books-es/` — Spanish library resources
- `sandarbhas/` — specialized Sandarbha environment
- `sandarbhas/sources/` — Sandarbha source material
- `student/` — student-facing work, progress, Journal, and related tools
- `study/` — shared study environment
- `question-bank/` — question-bank interface
- `references/` — reference resources
- `slokas/` — śloka study resources
- `scholars/` — scholar-related resources
- `certificates/` — Academy completion certificates
- `shared/` — reusable application modules
- `tools/` — development/import utilities
- `data/` — shared application data and source registries

---

## 11. Development Principle

Before adding a new feature, determine whether it belongs to:

**the canonical source,  
the course structure,  
a shared study tool,  
or the student's personal work.**

That distinction should determine where the feature is implemented.

The architecture should always return to the same principle:

> **One source of truth, many uses.**
