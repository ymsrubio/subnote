# Offline-first, and the first synced Section keeps its pages

The app is an offline-first PWA with public sign-up, so two devices can each place a Section on the same Free Pages while offline. When they sync, the Section that synced first keeps its pages; the other is re-placed in the next aligned free block (or becomes a Pending Section) and the user is told. Last-write-wins was rejected because it silently drops a Section whose Title Page may already be written on paper; asking the user to resolve every clash was rejected as extra state for a rare case.

## Consequences

The sync engine is chosen at milestone 2, not before, and must support this rule. Milestone 1 stores data on the device only.
