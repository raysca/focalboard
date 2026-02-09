# Password Compatibility Guide

## Overview

This document explains how the seed script ensures password compatibility with Better Auth's authentication system.

## ⚠️ CRITICAL: Better Auth Uses Scrypt (NOT Bcrypt)

**Important:** Better Auth uses **scrypt** for password hashing, not bcrypt. This is a key detail that affects how seed passwords must be generated.

## Better Auth Password Requirements

Better Auth uses **scrypt** for password hashing. The seed script must:

1. Hash passwords using **scrypt algorithm** (via Better Auth's `hashPassword` function)
2. Use Better Auth's specific scrypt configuration:
   - N=16384 (CPU/memory cost parameter)
   - r=16 (block size)
   - p=1 (parallelization parameter)
   - dkLen=64 (derived key length in bytes)
3. Store hashes in the format `salt:key` where both are hex-encoded
4. Store hashes in the `account.password` field
5. Ensure hashes are verifiable by Better Auth's `verifyPassword` function

## Implementation

### Seed Script Password Hashing

The seed script uses Better Auth's own `hashPassword` function:

```typescript
import {hashPassword, verifyPassword} from 'better-auth/crypto'

// Hash password using Better Auth's scrypt implementation
const hashedPassword = await hashPassword(userData.password)

// Store in account table
db.insert(account).values({
    id: crypto.randomUUID(),
    accountId: userData.id,
    providerId: 'credential',
    userId: userData.id,
    password: hashedPassword, // Format: "salt:key"
    createdAt: new Date(),
    updatedAt: new Date(),
}).run()
```

### Why This Works

1. **Uses Better Auth Directly**: Imports and uses Better Auth's native password hashing
2. **Scrypt Algorithm**: Uses the same scrypt implementation Better Auth uses internally
3. **Correct Format**: Generates hashes in `salt:key` format that Better Auth expects
4. **Configuration Match**: Uses identical scrypt parameters (N, r, p, dkLen)

### Hash Format

Better Auth password hashes use the format:

```
salt:key
```

Example:
```
07297fd2427c1e6b5358eb9d681c8dd2:f390e29b3c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d
```

Where:
- **salt**: 32 hex characters (16 bytes)
- **key**: 128 hex characters (64 bytes)

## Verification

### Automatic Verification

The seed script automatically verifies password compatibility after seeding:

```
🔐 Verifying password compatibility...
✅ Password verification successful - users can log in!
```

This checks:
- Password hash was created correctly
- Hash can be verified with Better Auth's verifyPassword()
- Format is compatible (salt:key)

### Manual Testing

#### Test 1: Direct Database Check
```bash
bun test-login.ts
```

Verifies:
- User exists in database
- Account has password hash
- Hash is in scrypt format (salt:key)
- Hash can be verified with Better Auth's verifyPassword()

Expected output:
```
✅ User found: alice@focalboard.dev
✅ Account found
   Password hash: 07297fd2427c1e6b5358eb9d681c8dd2:f390e29...
   Hash format: scrypt (salt:key)
🔐 Password verification: ✅ VALID
✅ SUCCESS: Seed user passwords are compatible with Better Auth!
```

#### Test 2: API Login Test
```bash
# Start dev server
bun dev

# In another terminal
bun test-api-login.ts
```

Verifies:
- Users can authenticate via Better Auth API
- All seed users can log in
- Sessions are created correctly

## Common Mistakes to Avoid

### ❌ DON'T Use bcrypt

```typescript
// WRONG - This creates bcrypt hashes that Better Auth cannot verify
const hashedPassword = await Bun.password.hash(password, {
    algorithm: 'bcrypt',
    cost: 10
})
```

**Error you'll see:**
```
BetterAuthError: Invalid password hash
```

### ❌ DON'T Use Custom Scrypt

```typescript
// WRONG - Custom scrypt parameters won't match Better Auth
import {scryptAsync} from '@noble/hashes/scrypt'
const hash = await scryptAsync(password, salt, {N: 1024, r: 8, p: 1})
```

### ✅ DO Use Better Auth's hashPassword

```typescript
// CORRECT - Use Better Auth's own function
import {hashPassword} from 'better-auth/crypto'
const hashedPassword = await hashPassword(password)
```

## Troubleshooting

### Issue 1: "Invalid password hash" Error

**Symptom:** 
```
BetterAuthError: Invalid password hash
```

**Cause:** Password hash is not in `salt:key` format (likely bcrypt format)

**Solution:**
```bash
# Re-seed with correct scrypt hashing
bun src/backend/db/seed.ts --force
```

### Issue 2: Password Verification Fails

**Symptom:** 
```
🔐 Password verification: ❌ INVALID
```

**Cause:** Hash format is wrong or using incompatible algorithm

**Solution:**
1. Check seed script imports: `import {hashPassword} from 'better-auth/crypto'`
2. Verify using hashPassword(): `const hash = await hashPassword(password)`
3. Re-seed database: `bun src/backend/db/seed.ts --force`

### Issue 3: Hash Missing Colon

**Symptom:** Hash doesn't contain `:` character

**Cause:** Not using Better Auth's hashPassword function

**Solution:** Update seed script to use Better Auth's hashPassword

### Debugging Commands

```bash
# Check hash format in database
sqlite3 focalboard.db "SELECT password FROM account LIMIT 1;"
# Should output something like: salt:key (not $2b$10$...)

# Verify hash contains colon
sqlite3 focalboard.db "SELECT CASE WHEN password LIKE '%:%' THEN 'scrypt' ELSE 'wrong' END FROM account LIMIT 1;"
# Should output: scrypt

# Test password verification
bun test-login.ts
```

## Security Notes

### Scrypt vs Bcrypt

**Scrypt advantages:**
- Memory-hard (resists GPU/ASIC attacks better)
- More secure against hardware attacks
- Modern, well-studied algorithm

**Bcrypt advantages:**
- More widely used
- Simpler parameters
- Lower memory requirements

Better Auth chose scrypt for its superior security properties.

### Scrypt Parameters

Better Auth uses these scrypt parameters:

```typescript
{
  N: 16384,      // CPU/memory cost (2^14)
  r: 16,         // Block size
  p: 1,          // Parallelization
  dkLen: 64      // Derived key length
}
```

These provide strong security while maintaining reasonable performance (~100-200ms per hash on modern hardware).

## Integration with Better Auth

### How Better Auth Handles Passwords

1. **Registration** (`/api/auth/sign-up/email`):
   ```typescript
   // Better Auth internally
   const hash = await hashPassword(plainPassword)
   // Stores: "salt:key" format
   ```

2. **Login** (`/api/auth/sign-in/email`):
   ```typescript
   // Better Auth internally
   const isValid = await verifyPassword({hash, password: plainPassword})
   // Checks salt:key format and verifies with scrypt
   ```

### Seed Script Compatibility

Our seed script uses the exact same functions:

```typescript
// What Better Auth does
import {hashPassword} from 'better-auth/crypto'
const hash = await hashPassword(password)

// What our seed script does (identical!)
import {hashPassword} from 'better-auth/crypto'
const hashedPassword = await hashPassword(userData.password)
```

Both produce identical, compatible scrypt hashes.

## Summary

✅ **Correct Implementation:**
- Seed script uses Better Auth's `hashPassword` function
- Generates scrypt hashes in `salt:key` format
- Automatic verification confirms compatibility
- All seed users can log in successfully

❌ **Common Mistakes:**
- Using bcrypt instead of scrypt
- Custom scrypt with wrong parameters
- Wrong hash format

🔐 **Result:**
All seed users can authenticate successfully with Better Auth using scrypt-hashed passwords in the format `salt:key`.

**Password for all seed users:** `demo1234`
