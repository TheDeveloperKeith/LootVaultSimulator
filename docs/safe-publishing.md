# Publishing after the database-password exposure

The exposed database password has been rotated. Keep the replacement only in private environment variables or the ignored `application-local.properties` file at the repository root.

The backend imports that optional local file for development. Production uses `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD`. Docker Compose uses the ignored `.env`; `.env.example` contains placeholders only. Spring does not automatically read Docker Compose's `.env` file.

Before committing or pushing, run `node scripts/check-publish-safety.mjs` from the repository root. It scans the Git index for excluded files, known local secrets, and common credential signatures. It cannot detect every possible secret.

The local `master` branch was replaced with a single clean root commit, preserving the current source and removing old commit ancestry. Old local refs and reflogs are removed. This deliberately discards previous commit history. Private `.env`, local settings, and dependencies remain on disk but are excluded from Git and Docker. The embedded `repo-mirror.git` backup of old history was removed.

To replace GitHub's `master`, review the clean commit, then run:

```powershell
git push --force-with-lease=refs/heads/master:09bec4d9a6934c884e422b5edeb5412189a86884 origin master:master
```

The explicit lease refuses to overwrite the branch if GitHub has changed since the observed remote commit. Do not replace it with plain `--force` without investigating a lease failure. No remote push was performed during local cleanup.

Anyone with an old clone should clone the cleaned repository again rather than merge or push old history back. A branch rewrite does not remove copies in forks, pull requests, caches, or downloads. See [GitHub's sensitive-data removal guidance](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository).

