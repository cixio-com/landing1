# .ENV File Quoting Rules - IMPORTANT

## 🚨 Critical Issue Fixed

**Problem:** `.env` file with unquoted special characters causes syntax errors  
**Solution:** Properly quote values containing shell special characters

---

## ❌ The Error

```bash
.env: line 45: syntax error near unexpected token `newline'
```

**Cause:** Line 45 had unquoted angle brackets:
```bash
EMAIL_FROM=Cixio Team <noreply@cixio.com>  # ❌ WRONG - Will fail
```

---

## ✅ The Fix

**Always quote values with special characters:**
```bash
EMAIL_FROM="Cixio Team <noreply@cixio.com>"  # ✅ CORRECT
EMAIL_FROM_NAME="Cixio Team"  # ✅ CORRECT
```

---

## 📋 Quoting Rules for .env Files

### MUST Be Quoted ⚠️

Values containing these characters **MUST** be quoted:

| Character | Name | Example | Quoted Version |
|-----------|------|---------|----------------|
| `<` `>` | Angle brackets | `<noreply@cixio.com>` | `"Cixio <noreply@cixio.com>"` |
| `&` | Ampersand | `url?key=1&val=2` | `"url?key=1&val=2"` |
| `|` | Pipe | `cmd1 | cmd2` | `"cmd1 | cmd2"` |
| `;` | Semicolon | `cmd1; cmd2` | `"cmd1; cmd2"` |
| `$` | Dollar sign | `$variable` | `"\$variable"` or `'$variable'` |
| `` ` `` | Backtick | `` `command` `` | `` "\`command\`" `` |
| `!` | Exclamation | `P@ssw0rd!` | `"P@ssw0rd!"` or `'P@ssw0rd!'` |
| `\` | Backslash | `path\to\file` | `"path\\to\\file"` |
| `(` `)` | Parentheses | `value (note)` | `"value (note)"` |
| `*` | Asterisk | `file*.txt` | `"file*.txt"` |
| `?` | Question mark | `file?.txt` | `"file?.txt"` |
| `[` `]` | Brackets | `[array]` | `"[array]"` |
| Spaces | Whitespace | `My App Name` | `"My App Name"` |

### SHOULD Be Quoted (Best Practice) 👍

Even if not strictly required, quote these for consistency:

```bash
# Multi-word strings
APP_NAME="CIXIO Full Stack Application"
COMPANY_NAME="CIXIO Technologies Inc."

# Email addresses with display names
EMAIL_FROM="Cixio Team <noreply@cixio.com>"
SUPPORT_EMAIL_FROM="Cixio Support <support@cixio.com>"

# Paths
FILE_PATH="/home/user/app/uploads"
BACKUP_DIR="/var/backups/app"
```

### No Quotes Needed ✓

Simple values without special characters don't need quotes:

```bash
# Numbers
PORT=80
MAX_CONNECTIONS=100

# Simple strings (alphanumeric + basic punctuation)
NODE_ENV=production
DATABASE_NAME=cixio
API_VERSION=v1

# URLs without query parameters (no & or special chars)
API_URL=https://api.cixio.com
FRONTEND_URL=https://www.cixio.com

# Email addresses (simple, no display name)
ADMIN_EMAIL=admin@cixio.com
SUPPORT_EMAIL=support@cixio.com

# Comma-separated lists (no internal special chars)
ALLOWED_ORIGINS=https://cixio.com,https://www.cixio.com,http://localhost:3000
```

---

## 📝 Correct .env File Examples

### ✅ CORRECT Examples

```bash
# Email with display name - MUST BE QUOTED
EMAIL_FROM="Cixio Team <noreply@cixio.com>"
EMAIL_FROM_NAME="Cixio Team"
EMAIL_FROM_ADDRESS=noreply@cixio.com

# AWS credentials with special characters - SHOULD BE QUOTED
EMAIL_PASS="BPOfycQtt30c46LPpOw1cY1QKG/tWOtMfgqPo+4NE/U9"
JWT_SECRET="7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e"

# URLs with query parameters - SHOULD BE QUOTED
CALLBACK_URL="https://example.com/callback?token=abc&user=123"

# Connection strings with special chars - MUST BE QUOTED
MONGODB_URI="mongodb://admin:p@ssw0rd!@mongo:27017/cixio?authSource=admin"

# Multi-word values - SHOULD BE QUOTED
APP_TITLE="CIXIO - AI Platform"
WELCOME_MESSAGE="Welcome to CIXIO!"

# Simple values - NO QUOTES NEEDED
PORT=80
NODE_ENV=production
DEBUG=false
```

### ❌ INCORRECT Examples

```bash
# Missing quotes on email with angle brackets - WILL FAIL
EMAIL_FROM=Cixio Team <noreply@cixio.com>  # ❌ Syntax error

# Missing quotes on URL with & - WILL FAIL
CALLBACK_URL=https://example.com?token=abc&user=123  # ❌ Will break

# Missing quotes on password with ! - MAY FAIL
PASSWORD=MyP@ss!123  # ❌ May cause issues

# Missing quotes on multi-word string - WILL FAIL  
APP_NAME=My Application Name  # ❌ Only "My" will be used
```

---

## 🔧 Fixing Your .env Files

### Step 1: Identify Problems

Look for these patterns in your `.env` file:

```bash
# Find lines with angle brackets
grep '<' .env

# Find lines with ampersands
grep '&' .env

# Find lines with pipes
grep '|' .env

# Find lines with semicolons
grep ';' .env
```

### Step 2: Add Quotes

For each problematic line, add double quotes:

```bash
# Before
EMAIL_FROM=Cixio Team <noreply@cixio.com>

# After
EMAIL_FROM="Cixio Team <noreply@cixio.com>"
```

### Step 3: Test Loading

```bash
# Test if .env loads without errors
bash -c 'set -o allexport; . .env; set +o allexport; echo "SUCCESS: .env loaded"'

# If it fails, you'll see which line has the error
```

---

## 🎯 Updated Files

The following files have been updated with proper quoting:

### 1. `.env.production`
```bash
EMAIL_FROM="Cixio Team <noreply@cixio.com>"  # ✅ Now quoted
EMAIL_FROM_NAME="Cixio Team"  # ✅ Now quoted
```

### 2. `.env.example`
```bash
# IMPORTANT: Values with special characters like < > must be quoted
EMAIL_FROM="Cixio Team <noreply@cixio.com>"  # ✅ Now quoted
EMAIL_FROM_NAME="Cixio Team"  # ✅ Now quoted
```

---

## 💡 Best Practices

### 1. When in Doubt, Quote It

```bash
# Safe approach - quote everything except simple values
EMAIL_FROM="Cixio Team <noreply@cixio.com>"
APP_NAME="CIXIO"
PORT=80
```

### 2. Use Double Quotes

Double quotes are more flexible than single quotes:

```bash
# ✅ Double quotes - allows variable expansion if needed
MESSAGE="Welcome to $APP_NAME"

# Single quotes - literal string, no expansion
MESSAGE='Welcome to $APP_NAME'  # Will literally be "$APP_NAME"
```

### 3. Escape Special Characters in Quotes

If you need a literal quote or dollar sign:

```bash
# Escape dollar sign to prevent variable expansion
PASSWORD="MyP\$ssw0rd"

# Escape quotes
MESSAGE="He said \"Hello\""
```

### 4. Multi-line Values

For multi-line values, use quotes and newlines:

```bash
# Multi-line value (use \n)
DESCRIPTION="This is line 1\nThis is line 2"

# Or for actual newlines (less common in .env)
PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQE...
-----END PRIVATE KEY-----"
```

---

## ✅ Verification Checklist

After updating your `.env` file:

- [ ] All email display names with `<>` are quoted
- [ ] All URLs with `&` are quoted
- [ ] All passwords with special characters are quoted
- [ ] All multi-word values are quoted
- [ ] Test loading: `bash -c 'set -o allexport; . .env; set +o allexport; echo SUCCESS'`
- [ ] Deploy and verify: `./deploy-production.sh` (or `./deploy-stage.sh`)

---

## 🚨 Common Mistakes

### Mistake 1: Forgetting Quotes on Email Display Names
```bash
EMAIL_FROM=Cixio <noreply@cixio.com>  # ❌ WRONG
EMAIL_FROM="Cixio <noreply@cixio.com>"  # ✅ CORRECT
```

### Mistake 2: Using Unquoted URLs with Query Params
```bash
URL=https://api.com?key=val&user=123  # ❌ WRONG (& breaks it)
URL="https://api.com?key=val&user=123"  # ✅ CORRECT
```

### Mistake 3: Inconsistent Quoting
```bash
# Inconsistent - hard to maintain
EMAIL_FROM="Cixio <noreply@cixio.com>"
EMAIL_FROM_NAME=Cixio  # Should also be quoted for consistency
SUPPORT_EMAIL=support@cixio.com  # This is OK (no special chars)
```

---

## 📚 Resources

- Bash quoting: https://www.gnu.org/software/bash/manual/html_node/Quoting.html
- .env file best practices: https://12factor.net/config
- Shell special characters: https://www.gnu.org/software/bash/manual/html_node/Special-Parameters.html

---

**Summary:** Always quote values in `.env` files that contain shell special characters, especially `<`, `>`, `&`, `|`, `$`, and spaces. This prevents syntax errors and ensures your configuration loads correctly.

**Key Rule:** When in doubt, quote it! 🎯
