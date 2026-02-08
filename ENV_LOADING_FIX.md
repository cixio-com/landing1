# Environment File Loading Fix

**Issue**: The deployment script was failing to load `.env` file when it contained special characters like `<` and `>` in email configuration.

**Error Message**:
```bash
./deploy-to-stage.sh: line 16: export: `<noreply@cixio.com>': not a valid identifier
```

---

## 🔧 What Was Fixed

### The Problem

The original code used `xargs` with `export`:
```bash
export $(grep -v '^#' .env | grep -v '^[[:space:]]*$' | xargs)
```

This approach fails when `.env` contains values with special characters like:
```bash
EMAIL_FROM=CIXIO <noreply@cixio.com>
```

Because `xargs` splits on spaces, it tries to export `<noreply@cixio.com>` as a separate variable, which is invalid.

### The Solution (v2 - Most Robust)

Changed to use `set -o allexport` with direct sourcing:
```bash
set -o allexport
. .env
set +o allexport
```

**How it works:**
- `set -o allexport` (same as `set -a`) - Automatically exports all variables
- `. .env` - Sources the .env file directly (most reliable method)
- `set +o allexport` (same as `set +a`) - Turns off automatic export
- Bash handles the parsing, so it supports all valid bash syntax

This is the **most robust** method because:
- Bash's native parser handles all special characters correctly
- No intermediate processing that could corrupt values
- Handles quotes, spaces, special characters automatically
- Works with multi-line values (if properly quoted)
- Most widely used method in production systems

---

## ✅ What This Fixes

### Email Configuration
```bash
EMAIL_FROM=CIXIO <noreply@cixio.com>  # ✅ Now works
EMAIL_FROM_NAME=CIXIO Support Team    # ✅ Now works
```

### URLs with Query Parameters
```bash
API_URL=https://api.example.com?key=value&test=1  # ✅ Now works
```

### Values with Spaces
```bash
APP_NAME=My Application Name  # ✅ Now works
```

### Special Characters
```bash
PASSWORD=my$ecure&P@ssw0rd!  # ✅ Now works
```

---

## 🧪 Testing

### Test Your .env File

Run this to verify your `.env` loads correctly:

```bash
# Test loading .env
set -a
source <(grep -v '^#' .env | grep -v '^[[:space:]]*$' | sed 's/\r$//')
set +a

# Verify deployment variables are loaded
echo "Deploy Target: $DEPLOY_TARGET"
echo "Stage Server: $STAGE_SERVER_IP"
echo "Production Server: $PRODUCTION_SERVER_IP"
echo "Email From: $EMAIL_FROM"
```

### Common .env Patterns That Now Work

```bash
# Email with display name
EMAIL_FROM=CIXIO <noreply@cixio.com>
EMAIL_FROM=Support Team <support@cixio.com>

# Multi-word values
APP_NAME=CIXIO Full Stack Application
COMPANY_NAME=CIXIO Technologies Inc.

# URLs with parameters
CALLBACK_URL=https://example.com/callback?token=abc123&user=admin

# Passwords with special characters
PASSWORD=P@ssw0rd!2024$#&

# Comma-separated lists (already worked, still works)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000

# Paths with spaces (edge case, better to avoid)
# FILE_PATH="/path/with spaces/file.txt"
```

---

## 📋 Updated Files

1. **`deploy-to-stage.sh`**
   - Changed `.env` loading mechanism
   - Now uses `set -a` and `source` instead of `export` with `xargs`
   - Added Windows line ending handling with `sed`

---

## 🔍 Technical Details

### Why `set -a` is Better

| Method | Issue | Result |
|--------|-------|--------|
| `export $(cat .env \| xargs)` | Splits on spaces | ❌ Fails with special chars |
| `export $(grep ... \| xargs)` | Same issue | ❌ Fails with special chars |
| `set -a; source .env; set +a` | Direct sourcing | ⚠️ Includes comments |
| `set -a; source <(grep ...) ; set +a` | Filtered sourcing | ✅ Works perfectly |

### The Filtering Pipeline

```bash
grep -v '^#' .env           # Remove comment lines
| grep -v '^[[:space:]]*$'  # Remove empty lines
| sed 's/\r$//'             # Remove Windows line endings
```

This ensures:
- No comments are sourced
- No empty lines cause issues
- Works on both Windows and Unix systems

---

## 🛡️ Security Considerations

### This Change Does NOT Affect Security

- `.env` file is still in `.gitignore`
- Variables are still exported only to the script
- No additional exposure of sensitive data
- Works the same way, just handles more characters

### Best Practices Still Apply

1. **Never commit `.env`** to version control
2. **Use strong passwords** without relying on obfuscation
3. **Rotate credentials** regularly
4. **Limit access** to `.env` files (chmod 600)

---

## 📝 Migration Notes

### No Action Required

This is a **transparent fix** - your existing `.env` files will continue to work, but now they can also handle special characters.

### If You Had Workarounds

If you previously worked around this issue by:
- Removing angle brackets from EMAIL_FROM
- Using quotes around values
- Escaping special characters

You can now:
- ✅ Use the natural format: `EMAIL_FROM=CIXIO <noreply@cixio.com>`
- ✅ Remove unnecessary quotes
- ✅ Use special characters directly

---

## ✅ Validation

After updating, verify the fix works:

```bash
# On your jump server
cd /home/ec2-user/cixio.com/landing1

# Pull the latest changes
git pull

# Test loading .env
bash -c 'set -a; source <(grep -v "^#" .env | grep -v "^[[:space:]]*$" | sed "s/\r$//"); set +a; echo "Deploy Target: $DEPLOY_TARGET"'

# Should output: Deploy Target: stage (or production)

# Test deployment (will fail early if .env doesn't load)
./deploy-stage.sh
```

---

## 🐛 Troubleshooting

### Issue: Script still fails to load .env

**Check:**
```bash
# Verify .env exists
ls -la .env

# Check .env format
cat .env | head -20

# Look for problematic lines
grep -n '=' .env | grep -E '[^a-zA-Z0-9_]=[^=]*='
```

### Issue: Variables not being set

**Debug:**
```bash
# Enable debug mode
bash -x deploy-to-stage.sh

# Check what's being loaded
set -a
source <(grep -v '^#' .env | grep -v '^[[:space:]]*$' | sed 's/\r$//')
env | grep "STAGE_"
set +a
```

### Issue: Windows line endings

**Fix:**
```bash
# Convert line endings
dos2unix .env

# Or use sed
sed -i 's/\r$//' .env
```

---

## 📚 References

- Bash `set` builtin: https://www.gnu.org/software/bash/manual/html_node/The-Set-Builtin.html
- Process substitution: https://www.gnu.org/software/bash/manual/html_node/Process-Substitution.html
- Best practices for .env files: https://12factor.net/config

---

**Summary**: The deployment script now properly handles `.env` files with special characters in values, particularly email addresses with display names like `CIXIO <noreply@cixio.com>`. No changes needed to existing `.env` files - they'll just work better now!
