# How to Remove an Email Account from MongoDB

## Quick Solutions

### Option 1: Using MongoDB Shell (mongosh) - Recommended

#### Step 1: Connect to MongoDB
```powershell
# Connect to MongoDB in Docker container
docker exec -it cixio-com-mongodb mongosh -u admin -p changeme123 --authenticationDatabase admin
```

#### Step 2: Switch to Database
```javascript
use cixio
```

#### Step 3: Find the User by Email
```javascript
db.users.findOne({ email: "user@example.com" })
```

#### Step 4: Delete the User
```javascript
db.users.deleteOne({ email: "user@example.com" })
```

#### Verify Deletion
```javascript
db.users.findOne({ email: "user@example.com" })
// Should return: null
```

---

### Option 2: Using Docker One-Liner

```powershell
# Delete user by email (replace with your email)
docker exec -it cixio-com-mongodb mongosh -u admin -p changeme123 --authenticationDatabase admin --eval 'db.getSiblingDB("cixio").users.deleteOne({ email: "user@example.com" })'
```

---

### Option 3: Using MongoDB Compass (GUI)

1. Download MongoDB Compass: https://www.mongodb.com/try/download/compass
2. Connect using: `mongodb://admin:changeme123@localhost:27017/cixio?authSource=admin`
3. Navigate to `cixio` database → `users` collection
4. Find the document with your email
5. Click the trash icon to delete

---

### Option 4: Using Mongo Express (If Running)

```powershell
# Start mongo-express (if not already running)
docker-compose --profile dev up -d
```

Then open: http://localhost:8081
- Login: `admin` / `admin123`
- Navigate to: `cixio` → `users`
- Find and delete the user

---

## Common Use Cases

### Delete Multiple Users by Domain
```javascript
// Connect to MongoDB first
use cixio

// Delete all users with @example.com domain
db.users.deleteMany({ email: { $regex: "@example.com$" } })
```

### Delete Unverified Users
```javascript
use cixio

// Delete all unverified users
db.users.deleteMany({ isEmailVerified: false })
```

### Delete Test Users
```javascript
use cixio

// Delete users with test emails
db.users.deleteMany({ email: { $regex: "^test" } })
```

---

## Step-by-Step Example

### Example: Delete user `test@example.com` and register again

```powershell
# 1. Connect to MongoDB container
docker exec -it cixio-com-mongodb mongosh -u admin -p changeme123 --authenticationDatabase admin

# 2. In MongoDB shell, run these commands:
use cixio
db.users.findOne({ email: "test@example.com" })  # View user first
db.users.deleteOne({ email: "test@example.com" }) # Delete user
exit

# 3. Now register again via API
$body = @{
    firstName = "Test"
    lastName = "User"
    email = "test@example.com"
    password = "NewPassword123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost/api/auth/register" -Method POST -Body $body -ContentType "application/json"
```

---

## View All Users

```javascript
// Connect to MongoDB first
use cixio

// View all users (just email and name)
db.users.find({}, { email: 1, firstName: 1, lastName: 1, isEmailVerified: 1 })

// Count total users
db.users.countDocuments()

// View all emails
db.users.find({}, { email: 1, _id: 0 })
```

---

## Also Remove from Newsletter/Contacts (Optional)

If the email is also in other collections:

```javascript
use cixio

// Remove from newsletter
db.newsletters.deleteOne({ email: "user@example.com" })

// Remove from contacts
db.contacts.deleteOne({ email: "user@example.com" })
```

---

## Quick Command Reference

| Task | Command |
|------|---------|
| Connect to MongoDB | `docker exec -it cixio-com-mongodb mongosh -u admin -p changeme123 --authenticationDatabase admin` |
| Use database | `use cixio` |
| Find user | `db.users.findOne({ email: "user@example.com" })` |
| Delete user | `db.users.deleteOne({ email: "user@example.com" })` |
| Count users | `db.users.countDocuments()` |
| List all emails | `db.users.find({}, { email: 1 })` |
| Exit shell | `exit` |

---

## Troubleshooting

### "User not found"
```javascript
// Check if user exists with case-insensitive search
db.users.findOne({ email: { $regex: "user@example.com", $options: "i" } })
```

### "Authentication failed"
Make sure you're using the correct credentials from `.env`:
```
MONGODB_URI=mongodb://admin:changeme123@mongo:27017/cixio?authSource=admin
```

### "Container not found"
```powershell
# Check container name
docker ps

# Use correct container name
docker exec -it cixio-com-mongodb mongosh ...
```

---

## Prevention

To avoid this issue in the future, you can:

1. **Use unique test emails**: `test+1@example.com`, `test+2@example.com`
2. **Delete old test data regularly**
3. **Use a separate test database**
4. **Implement soft delete** (mark as deleted instead of removing)

---

## Complete Example Script

Save this as `delete-user.ps1`:

```powershell
# Delete User Script
param(
    [Parameter(Mandatory=$true)]
    [string]$Email
)

Write-Host "Deleting user: $Email" -ForegroundColor Yellow

# Delete from users collection
docker exec -it cixio-com-mongodb mongosh -u admin -p changeme123 --authenticationDatabase admin --eval "db.getSiblingDB('cixio').users.deleteOne({ email: '$Email' })"

Write-Host "User deleted successfully!" -ForegroundColor Green
Write-Host "You can now register with this email again." -ForegroundColor Cyan
```

Usage:
```powershell
.\delete-user.ps1 -Email "test@example.com"
```

---

**Need Help?** Check MongoDB logs:
```powershell
docker logs cixio-com-mongodb
```
