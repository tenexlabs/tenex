# Plan: Add File Library And Upload Workflows

Status: Backlog

Priority: P2

Type: feat

Owner: Agent

Created: 2026-05-07

## Goal

Expand storage scaffolding into a usable file library with upload flows,
metadata, permissions, previews, deletion policy, and provider-specific storage
guidance.

## Context

- Storage add-on: `src/addons/storage.ts`
- Generated files route: `src/addons/storage.ts`
- Security guidance: `docs/SECURITY.md`
- Generated app contract: `docs/product-specs/generated-app-contract.md`

Audit findings:

- Storage currently generates a provider constant, placeholder list, placeholder
  upload URL, and a static `/files` route.
- There is no file metadata table, ownership model, upload completion flow,
  access policy, or deletion behavior.
- The generated files route has room to become a real founder asset-management
  surface.

## Acceptance Criteria

- Storage add-on generates Convex tables and functions for files, folders or
  collections, upload requests, upload completion, and deletion/archive state.
- Generated UI supports upload, list, search/filter, preview metadata, rename,
  delete/archive, and empty states.
- Access rules are explicit for user-owned, team-owned, and admin-visible files
  when teams/admin are enabled.
- R2 and Convex storage providers document public/private object assumptions and
  required env vars.
- Tests cover generated source, route links, provider combinations, and
  idempotency.

## Steps

- [ ] Define a provider-neutral file metadata model.
- [ ] Generate provider-specific upload request and completion helpers.
- [ ] Generate `/files` UI for upload and file management.
- [ ] Add optional team/admin access behavior.
- [ ] Update doctor and handoff copy with provider setup details.
- [ ] Add smoke tests for Convex storage and R2 paths.

## Decisions

- 2026-05-07: Treat file access as a security-sensitive workflow. Server-side
  ownership checks should be generated with the storage functions.

## Verification

- Planning review only. Future verification should include generated-source
  tests and security review of access rules.

## Handoff

This makes the storage add-on product-useful instead of merely registering a
provider component.
