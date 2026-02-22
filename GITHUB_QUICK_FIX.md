# Quick Fix: Add Your GitHub Repository

## After creating your repository on GitHub, run this command:

```powershell
cd "Z:\Fast\Semester\SEMESTER 8\WEB\Project\frontend-html"
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git push -u origin main
```

**Replace:**
- `YOUR-USERNAME` with your GitHub username
- `YOUR-REPO-NAME` with your repository name

## Example:
If your username is `john123` and repository is `myrental-marketplace`:
```powershell
git remote add origin https://github.com/john123/myrental-marketplace.git
git push -u origin main
```

## If you get authentication errors:
1. Use Personal Access Token (not password)
2. Create token: GitHub → Settings → Developer settings → Personal access tokens → Generate new token (classic)
3. Check "repo" scope
4. Use token as password when prompted

