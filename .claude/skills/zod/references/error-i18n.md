---
title: Implement Internationalized Error Messages
impact: HIGH
impactDescription: Hardcoded English messages exclude non-English users; error maps enable localized messages for global applications
tags: error, i18n, localization, internationalization
---

## Implement Internationalized Error Messages

Hardcoded error messages in English exclude users who speak other languages. Use Zod's error map feature to provide localized messages based on user locale, making your application accessible globally.

**Incorrect (hardcoded English messages):**

```typescript
import { z } from 'zod'

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.email('Invalid email address'),
  age: z.number().min(18, 'You must be at least 18 years old'),
})

// French users see English errors - poor UX
```

**Correct (localized error messages):**

```typescript
import { z } from 'zod'

// Translation dictionaries
const translations = {
  en: {
    required: 'This field is required',
    invalidEmail: 'Please enter a valid email address',
    tooShort: (min: number) => `Must be at least ${min} characters`,
    tooYoung: (min: number) => `You must be at least ${min} years old`,
  },
  fr: {
    required: 'Ce champ est obligatoire',
    invalidEmail: 'Veuillez entrer une adresse email valide',
    tooShort: (min: number) => `Doit contenir au moins ${min} caractères`,
    tooYoung: (min: number) => `Vous devez avoir au moins ${min} ans`,
  },
  es: {
    required: 'Este campo es requerido',
    invalidEmail: 'Por favor ingrese un correo electrónico válido',
    tooShort: (min: number) => `Debe tener al menos ${min} caracteres`,
    tooYoung: (min: number) => `Debes tener al menos ${min} años`,
  },
} as const

type Locale = keyof typeof translations

function createErrorMap(locale: Locale): z.core.$ZodErrorMap {
  const t = translations[locale]

  return (issue) => {
    switch (issue.code) {
      case 'invalid_type':
        if (issue.input === undefined) {
          return t.required
        }
        break

      case 'invalid_format':
        if (issue.format === 'email') {
          return t.invalidEmail
        }
        break

      case 'too_small':
        if (issue.origin === 'string') {
          return t.tooShort(Number(issue.minimum))
        }
        if (issue.origin === 'number') {
          return t.tooYoung(Number(issue.minimum))
        }
        break
    }

    return undefined // keep Zod's default (or locale) message
  }
}

// Usage with user's locale
const userLocale: Locale = 'fr'
const errorMap = createErrorMap(userLocale)

const userSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  age: z.number().min(18),
})

const result = userSchema.safeParse(
  { name: '', email: 'bad', age: 15 },
  { error: errorMap }
)

// French error messages:
// - "Doit contenir au moins 1 caractères"
// - "Veuillez entrer une adresse email valide"
// - "Vous devez avoir au moins 18 ans"
```

**Setting error map globally:**

```typescript
// At application startup
const userLocale = getUserLocale()  // From cookie, header, etc.
z.config({ customError: createErrorMap(userLocale) })

// All schemas now use localized messages.
// Zod 4 also ships translated default messages, e.g. z.config(z.locales.fr())
```

**With i18n libraries (react-intl, i18next):**

```typescript
import { useIntl } from 'react-intl'

function useZodErrorMap(): z.core.$ZodErrorMap {
  const intl = useIntl()

  return (issue) => {
    switch (issue.code) {
      case 'too_small':
        return intl.formatMessage(
          { id: 'validation.tooShort' },
          { min: Number(issue.minimum) }
        )
      // ...
    }
    return undefined
  }
}
```

**When NOT to use this pattern:**
- Internal tools used only by your team
- Single-language applications

Reference: [Zod Error Customization - Internationalization](https://zod.dev/error-customization#internationalization)
