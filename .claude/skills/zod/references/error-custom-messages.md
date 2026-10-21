---
title: Provide Custom Error Messages
impact: HIGH
impactDescription: Default messages like "Expected string, received number" confuse users; custom messages like "Email is required" are actionable
tags: error, messages, user-experience, validation
---

## Provide Custom Error Messages

Zod's default error messages are technical and confusing for end users. Provide custom messages that are clear, specific, and actionable. This dramatically improves user experience when validation fails.

**Incorrect (default error messages):**

```typescript
import { z } from 'zod'

const signupSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  age: z.number().min(18),
})

signupSchema.parse({ email: 'bad', password: '123', age: 15 })
// ZodError issues:
// - "Invalid email address"
// - "Too small: expected string to have >=8 characters"
// - "Too small: expected number to be >=18"
// Users see: "Too small: expected string to have >=8 characters" - what string?
```

**Correct (custom error messages):**

```typescript
import { z } from 'zod'

const signupSchema = z.object({
  email: z.email({
    error: (iss) => (iss.input === undefined ? 'Email is required' : 'Please enter a valid email address'),
  }),

  password: z
    .string({ error: (iss) => (iss.input === undefined ? 'Password is required' : 'Password must be text') })
    .min(8, 'Password must be at least 8 characters'),

  age: z
    .number({ error: (iss) => (iss.input === undefined ? 'Age is required' : 'Age must be a number') })
    .min(18, 'You must be at least 18 years old'),
})

signupSchema.parse({ email: 'bad', password: '123', age: 15 })
// ZodError issues:
// - "Please enter a valid email address"
// - "Password must be at least 8 characters"
// - "You must be at least 18 years old"
```

**Message types and when they trigger:**

```typescript
const schema = z
  .string({
    // Issues from the type check itself; iss.input is undefined when the field is missing
    error: (iss) => (iss.input === undefined ? 'This field is required' : 'This field must be text'),
  })
  .min(1, 'Cannot be empty') // When length < 1
  .max(100, 'Too long') // When length > 100

const email = z.email('Invalid email format') // When the format check fails
```

**Using error maps for consistent messaging:**

```typescript
// An error map takes the issue and returns a message, or undefined to keep Zod's default
const customError: z.core.$ZodErrorMap = (issue) => {
  if (issue.code === 'too_small') {
    if (issue.origin === 'string') return `Must be at least ${issue.minimum} characters`
    if (issue.origin === 'number') return `Must be at least ${issue.minimum}`
  }

  if (issue.code === 'invalid_type' && issue.expected === 'string') {
    return 'Must be text'
  }

  return undefined
}

// Apply globally
z.config({ customError })

// Or per parse call
schema.parse(data, { error: customError })
```

**Good error message principles:**
- Say what's wrong: "Password too short" not "Invalid password"
- Say how to fix it: "at least 8 characters" not just "too short"
- Use user's language: "email" not "string field at path .email"
- Be specific: "Must be a positive number" not "Invalid"

**When NOT to use this pattern:**
- Internal development scripts where technical errors are fine
- When you'll map errors to user-facing messages in the UI layer

Reference: [Zod Error Customization](https://zod.dev/error-customization)
