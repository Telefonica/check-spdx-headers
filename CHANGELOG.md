# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

#### Added
#### Changed
#### Fixed
#### Deprecated
#### Removed

## [1.0.1] - 2025-01-17

### Fixed

* fix: Ensure that paths correspond to files before trying to read them

## [1.0.0] - 2025-01-17

### Added

* test: Add unit tests
* test: Add E2E tests

### Changed

* feat: Do not repeat rule name on each rule result when they are grouped by rule name
* feat: Ignore license headers rule when it is an empty array
* docs: Change github inputs examples to JSON format to avoid indentation issues

### Fixed

* chore: Remove unused script from package.json

## [0.2.0] - 2025-01

### Added

* feat: Support running composite action both in PRs or pushes. In pushes, the action won't send any comment

### Fixed

* chore: Pin chalk dependency


## [0.1.0] - 2024-12

### Added

* feat: First beta version
