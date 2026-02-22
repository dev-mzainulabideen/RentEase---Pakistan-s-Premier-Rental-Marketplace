# Complete GitHub Setup Guide
## Step-by-Step Instructions to Add Your Project to GitHub

---

## 📋 Prerequisites

Before starting, make sure you have:
- ✅ Git installed on your computer ([Download Git](https://git-scm.com/downloads))
- ✅ A GitHub account ([Sign up here](https://github.com/signup))
- ✅ Your project files ready

---

## 🚀 Step-by-Step Instructions

### Step 1: Install Git (if not already installed)

1. **Check if Git is installed:**
   ```bash
   git --version
   ```
   If you see a version number, Git is installed. If not, download and install from [git-scm.com](https://git-scm.com/downloads)

2. **Configure Git with your name and email:**
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

---

### Step 2: Create a New Repository on GitHub

1. **Go to GitHub.com** and sign in to your account

2. **Click the "+" icon** in the top right corner → Select **"New repository"**

3. **Fill in the repository details:**
   - **Repository name:** `myrental-marketplace` (or any name you prefer)
   - **Description:** "A rental marketplace platform built with MERN stack"
   - **Visibility:** Choose **Public** (for portfolio) or **Private** (if you want to keep it private)
   - **DO NOT** check "Initialize this repository with a README" (we'll do this locally)
   - **DO NOT** add .gitignore or license yet

4. **Click "Create repository"**

5. **Copy the repository URL** - You'll see a page with instructions. Copy the HTTPS URL (looks like: `https://github.com/yourusername/myrental-marketplace.git`)

---

### Step 3: Initialize Git in Your Project Folder

1. **Open Terminal/Command Prompt** (or PowerShell on Windows)

2. **Navigate to your project folder:**
   ```bash
   cd "Z:\Fast\Semester\SEMESTER 8\WEB\Project\frontend-html"
   ```
   *(Replace with your actual project path)*

3. **Initialize Git repository:**
   ```bash
   git init
   ```
   This creates a hidden `.git` folder in your project.

---

### Step 4: Create .gitignore File

1. **Check if .gitignore exists:**
   - If you see `.gitignore` in the root folder, it's already created
   - If not, one has been created for you in this project

2. **Verify the .gitignore file** includes:
   - `node_modules/`
   - `.env`
   - `*.log`
   - Other sensitive/temporary files

---

### Step 5: Add All Files to Git

1. **Check current status:**
   ```bash
   git status
   ```
   This shows all files that will be added.

2. **Add all files to staging:**
   ```bash
   git add .
   ```
   This adds all files (except those in .gitignore) to be committed.

3. **Verify what will be committed:**
   ```bash
   git status
   ```
   You should see a list of files ready to be committed.

---

### Step 6: Create Your First Commit

1. **Commit all files:**
   ```bash
   git commit -m "Initial commit: Rental marketplace platform"
   ```
   This creates your first commit with all project files.

---

### Step 7: Connect to GitHub Repository

1. **Add the remote repository:**
   ```bash
   git remote add origin https://github.com/yourusername/myrental-marketplace.git
   ```
   *(Replace `yourusername` and `myrental-marketplace` with your actual GitHub username and repository name)*

2. **Verify the remote was added:**
   ```bash
   git remote -v
   ```
   You should see your repository URL listed.

---

### Step 8: Push to GitHub

1. **Push your code to GitHub:**
   ```bash
   git branch -M main
   git push -u origin main
   ```

2. **Enter your GitHub credentials:**
   - **Username:** Your GitHub username
   - **Password:** Your GitHub Personal Access Token (NOT your account password)
     - If you don't have a token, see "Creating a Personal Access Token" below

3. **Wait for upload to complete** - This may take a few minutes depending on your internet speed and project size.

---

### Step 9: Verify on GitHub

1. **Go to your GitHub repository page** (refresh if needed)
2. **You should see all your files** uploaded
3. **Check that the README.md file is visible** at the bottom of the file list

---

## 🔑 Creating a Personal Access Token (if needed)

If Git asks for a password and your account password doesn't work:

1. **Go to GitHub.com** → Click your profile picture → **Settings**

2. **Scroll down** → Click **"Developer settings"** (left sidebar)

3. **Click "Personal access tokens"** → **"Tokens (classic)"**

4. **Click "Generate new token"** → **"Generate new token (classic)"**

5. **Fill in the form:**
   - **Note:** "Git push access"
   - **Expiration:** Choose 90 days or custom
   - **Scopes:** Check **"repo"** (this gives full repository access)

6. **Click "Generate token"**

7. **COPY THE TOKEN IMMEDIATELY** (you won't see it again!)

8. **Use this token as your password** when Git asks for credentials

---

## 📝 Common Commands for Future Updates

After the initial setup, use these commands to update your repository:

### Check Status
```bash
git status
```

### Add Changes
```bash
git add .
```
or add specific files:
```bash
git add filename.js
```

### Commit Changes
```bash
git commit -m "Description of what you changed"
```

### Push to GitHub
```bash
git push
```

### Pull Latest Changes (if working on multiple computers)
```bash
git pull
```

---

## 🛠️ Troubleshooting

### Problem: "fatal: not a git repository"
**Solution:** Make sure you're in the project folder and run `git init`

### Problem: "remote origin already exists"
**Solution:** Remove and re-add:
```bash
git remote remove origin
git remote add origin https://github.com/yourusername/repository.git
```

### Problem: "Authentication failed"
**Solution:** 
- Use Personal Access Token instead of password
- Make sure token has "repo" scope

### Problem: "Large files won't upload"
**Solution:** 
- Check .gitignore includes large files
- Use Git LFS for large files:
  ```bash
  git lfs install
  git lfs track "*.psd"
  git add .gitattributes
  ```

### Problem: "node_modules is too large"
**Solution:** 
- Make sure `node_modules/` is in .gitignore
- Remove it from Git if already added:
  ```bash
  git rm -r --cached node_modules
  git commit -m "Remove node_modules from repository"
  ```

---

## ✅ Final Checklist

Before pushing, make sure:
- [ ] `.gitignore` file exists and includes `node_modules/`, `.env`, etc.
- [ ] No sensitive data (passwords, API keys) in code files
- [ ] `.env` file is NOT committed (check .gitignore)
- [ ] README.md file exists
- [ ] All files are added: `git add .`
- [ ] Initial commit created: `git commit -m "Initial commit"`
- [ ] Remote repository added: `git remote add origin [URL]`
- [ ] Code pushed: `git push -u origin main`

---

## 🎉 Success!

Once you see your files on GitHub, you're done! Your project is now:
- ✅ Version controlled
- ✅ Backed up on GitHub
- ✅ Shareable with others
- ✅ Ready for collaboration

---

## 📚 Next Steps

1. **Add a README.md** (already created for you!)
2. **Add a LICENSE file** (if you want to open source)
3. **Create branches** for new features:
   ```bash
   git checkout -b feature-name
   ```
4. **Add collaborators** (Settings → Collaborators on GitHub)
5. **Set up GitHub Actions** for CI/CD (optional)

---

**Need Help?** Check GitHub's official documentation: [docs.github.com](https://docs.github.com)

