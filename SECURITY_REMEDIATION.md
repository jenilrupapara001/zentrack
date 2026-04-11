# ZenTrack: Security Remediation Guide

> [!CAUTION]
> **Action Required**: Your MongoDB Atlas credentials have been exposed in a Git commit. Even though the files have been cleaned, they remain in your Git history and are considered COMPROMISED.

Follow these steps immediately to restore platform security.

## Phase 1: Identity Rotation (MongoDB Atlas)
Since your credentials were leaked, you must rotate them to prevent unauthorized access.

1. **Log in to MongoDB Atlas Console**.
2. **Navigate to Database Access**:
   - Find the user `jenil`.
   - Change the password to a new, complex string.
3. **Update Cluster Access List**:
   - Ensure "Network Access" only allows your specific IP or the Render/Vercel IP ranges (or use `0.0.0.0/0` only if necessary and rotating passwords frequently).
4. **Update Production Environment Variables**:
   - Go to your **Render** and **Vercel** dashboards.
   - Update the `MONGODB_URI` environment variable with the new credentials.

## Phase 2: Purge Git History (Recommended)
Simply deleting the line in a new commit does not remove it from your project's history. To completely remove the leaked secret:

### Using BFG Repo-Cleaner (Fastest)
1. Download [bfg](https://rtyley.github.io/bfg-repo-cleaner/).
2. Create a file named `passwords.txt` and put the leaked URI inside.
3. Run:
   ```bash
   bfg --replace-text passwords.txt
   ```
4. Push the changes:
   ```bash
   git reflog expire --expire=now --all && git gc --prune=now --aggressive
   git push --force
   ```

### Using git-filter-repo (Standard)
If you have `git-filter-repo` installed:
```bash
git filter-repo --invert-paths --path docker-compose.yml
```
*(Note: This is more aggressive as it removes the file history entirely. Use with caution.)*

## Phase 3: Platform Reset
After rotation and history purging:
1. **Redeploy Backend**: Trigger a fresh build in Render with the new `MONGODB_URI`.
2. **Redeploy Frontend**: Trigger a fresh build in Vercel.

---

> [!IMPORTANT]
> **ZenTrack Security Standard**: From now on, never hardcode credentials in any file that is tracked by Git. Always use `${VARIABLE_NAME}` in Docker files and manage values via `.env` (which should be in your `.gitignore`) or your hosting provider's secret vault.
