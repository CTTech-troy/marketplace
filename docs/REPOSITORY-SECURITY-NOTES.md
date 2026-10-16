# Repository security follow-up

The Marketplace repo has tracked environment files and previously included payment test credentials as source-code defaults. The assessment branch removes the tracked local environment files, adds ignore rules, replaces credential defaults with environment-only configuration, and provides an example environment file with blank values.

Important: a deletion in a new commit does not erase values from previous Git history or invalidate them. Before any public sharing or production use:
1. Rotate or revoke all payment/API credentials that may have been committed.
2. Confirm the replacement credentials are configured only in the hosting secret manager.
3. Clean the relevant Git history if the repository owner determines that real secrets were committed.
4. Review GitHub, deployment logs, build artifacts and forks/caches as appropriate.
5. Avoid fetching or printing tracked environment-file contents during cleanup.

The main branch remains unchanged by this assessment work until the branch is reviewed and merged.