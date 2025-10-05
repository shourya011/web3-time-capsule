# Git Development Workflow

## 🚀 Quick Commands

### Useful Git Aliases (Already configured)
- `git st` - Check status
- `git ci` - Commit changes  
- `git co` - Checkout branch
- `git br` - List branches
- `git lg` - Pretty log with graph

### Development Workflow

#### 1. Check current status
```bash
git st
```

#### 2. Add changes
```bash
git add .                    # Add all changes
git add <filename>           # Add specific file
```

#### 3. Commit changes
```bash
git ci -m "feat: add new feature"
git ci -m "fix: resolve issue with wallet connection"
git ci -m "perf: optimize dashboard rendering"
```

#### 4. View history
```bash
git lg                       # Pretty log
git log --oneline           # Simple one-line log
```

### Branch Management

#### Create and switch to new branch
```bash
git co -b feature/new-feature
```

#### Switch branches
```bash
git co main
git co feature/new-feature
```

#### List branches
```bash
git br                       # Local branches
git br -a                    # All branches (local + remote)
```

### Commit Message Conventions

Use conventional commit format:
- `feat:` - New features
- `fix:` - Bug fixes
- `perf:` - Performance improvements
- `refactor:` - Code refactoring
- `docs:` - Documentation updates
- `style:` - Code style changes
- `test:` - Test additions/updates
- `chore:` - Maintenance tasks

### Examples
```bash
git ci -m "feat: add wallet disconnect functionality"
git ci -m "fix: resolve form glitching when typing"
git ci -m "perf: optimize CreateCapsule component with memo"
git ci -m "docs: update README with deployment instructions"
```

## 🔄 Typical Development Session

1. **Start development server**
   ```bash
   cd Frontend
   npm run dev
   ```

2. **Make changes** to your code

3. **Check what changed**
   ```bash
   git st
   ```

4. **Stage and commit**
   ```bash
   git add .
   git ci -m "feat: implement new time capsule feature"
   ```

5. **View your changes**
   ```bash
   git lg
   ```

## 🌐 Remote Repository Setup (Future)

When ready to push to GitHub/GitLab:

```bash
# Add remote origin
git remote add origin <repository-url>

# Push initial commit
git push -u origin master

# Future pushes
git push
```

## 📦 Release Workflow

For major releases:

```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```