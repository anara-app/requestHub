# Lingui Localization Setup

This Shadcn admin dashboard now includes Lingui for internationalization (i18n) support. This guide will help you understand how to use and maintain the localization system.

## 🌍 Supported Languages

- **English (en)** - Default/Source language
- **Spanish (es)** - Español
- **French (fr)** - Français
- **German (de)** - Deutsch
- **Chinese (zh)** - 中文
- **Japanese (ja)** - 日本語

## 📁 Project Structure

```
src/
├── lib/
│   └── i18n.ts                 # i18n configuration and setup
├── locales/
│   ├── en/messages.po          # English translations (source)
│   ├── es/messages.po          # Spanish translations
│   ├── fr/messages.po          # French translations
│   ├── de/messages.po          # German translations
│   ├── zh/messages.po          # Chinese translations
│   └── ja/messages.po          # Japanese translations
└── components/
    ├── locale-selector.tsx     # Language switcher component
    └── demo/
        └── translation-demo.tsx # Demo component showing usage
```

## 🚀 Quick Start

### 1. Import Required Components

```tsx
import { Trans, t, Plural } from '@lingui/macro'
import { useLingui } from '@lingui/react'
```

### 2. Basic Translation Usage

#### Using the `<Trans>` Component (Recommended for JSX)

```tsx
function MyComponent() {
  return (
    <div>
      <h1><Trans>Welcome to our app</Trans></h1>
      <p><Trans>This text will be translated</Trans></p>
    </div>
  )
}
```

#### Using the `t` Macro for Programmatic Translations

```tsx
function MyComponent() {
  const { _ } = useLingui()
  
  const handleClick = () => {
    alert(_(t`Button was clicked!`))
  }
  
  return (
    <button onClick={handleClick} title={_(t`Click me`)}>
      <Trans>Click me</Trans>
    </button>
  )
}
```

### 3. Variable Interpolation

```tsx
function UserGreeting({ userName, itemCount }) {
  return (
    <div>
      <p><Trans>Hello, {userName}!</Trans></p>
      <p><Trans>You have {itemCount} items in your cart</Trans></p>
    </div>
  )
}
```

### 4. Pluralization

```tsx
function ItemCounter({ count }) {
  return (
    <p>
      <Plural 
        value={count}
        zero="No items"
        one="One item"
        other="# items"
      />
    </p>
  )
}
```

## 🛠️ Development Workflow

### 1. Extract Messages

After adding new translatable strings to your code:

```bash
pnpm extract
```

This will:
- Scan your code for `<Trans>`, `t`, and `Plural` usage
- Update all `.po` files with new messages
- Show statistics of missing translations

### 2. Translate Messages

Edit the `.po` files in `src/locales/{locale}/messages.po`:

```po
# Spanish translation example
msgid "Welcome to our app"
msgstr "Bienvenido a nuestra aplicación"

msgid "Hello, {userName}!"
msgstr "¡Hola, {userName}!"
```

### 3. Compile Messages

After updating translations:

```bash
pnpm compile
```

This generates the JavaScript files that the app uses at runtime.

### 4. Combined Workflow

For convenience, you can run both commands together:

```bash
pnpm extract && pnpm compile
```

## 🎛️ Language Switching

### Using the LocaleSelector Component

```tsx
import { LocaleSelector } from '@/components/locale-selector'

function Header() {
  return (
    <header>
      <h1><Trans>My App</Trans></h1>
      <LocaleSelector />
    </header>
  )
}
```

### Alternative Select Version

```tsx
import { LocaleSelectorSelect } from '@/components/locale-selector'

function Settings() {
  return (
    <div>
      <label><Trans>Language:</Trans></label>
      <LocaleSelectorSelect />
    </div>
  )
}
```

## 🔧 Configuration

### Lingui Configuration (`lingui.config.ts`)

```typescript
const config: LinguiConfig = {
  locales: ['en', 'es', 'fr', 'de', 'zh', 'ja'],
  sourceLocale: 'en',
  catalogs: [
    {
      path: '<rootDir>/src/locales/{locale}/messages',
      include: ['src'],
      exclude: ['**/node_modules/**'],
    },
  ],
  format: 'po',
  compileNamespace: 'es',
}
```

### Adding New Languages

1. Add the locale code to `lingui.config.ts`
2. Add the language to the `locales` object in `src/lib/i18n.ts`
3. Run `pnpm extract` to create the new `.po` file
4. Translate the messages in the new `.po` file
5. Run `pnpm compile`

## 💡 Best Practices

### 1. Use Descriptive Message IDs

❌ **Don't:**
```tsx
<Trans>OK</Trans>
<Trans>Cancel</Trans>
```

✅ **Do:**
```tsx
<Trans>Confirm action</Trans>
<Trans>Cancel operation</Trans>
```

### 2. Keep Context in Mind

For words that might have different translations based on context, use descriptive messages:

❌ **Don't:**
```tsx
<Trans>Close</Trans> // Could mean "close door" or "close dialog"
```

✅ **Do:**
```tsx
<Trans>Close dialog</Trans>
<Trans>Close application</Trans>
```

### 3. Extract Messages Regularly

Run `pnpm extract` frequently during development to keep translation files up to date.

### 4. Use Comments for Context

Add comments in `.po` files to help translators:

```po
# Button text for confirming a dangerous action
msgid "Delete permanently"
msgstr ""
```

## 🧪 Testing Your Translations

1. Use the `TranslationDemo` component to test different translation patterns
2. Switch between languages using the LocaleSelector
3. Check that all text updates correctly
4. Test with longer translations to ensure UI doesn't break

## 📚 Additional Resources

- [Lingui Documentation](https://lingui.dev/)
- [Lingui React Guide](https://lingui.dev/tutorials/react)
- [PO File Format](https://www.gnu.org/software/gettext/manual/html_node/PO-Files.html)

## 🐛 Troubleshooting

### Missing Translations

If you see English text when expecting translations:
1. Run `pnpm extract` to ensure messages are extracted
2. Check that the `.po` file has the translation
3. Run `pnpm compile` to generate updated JavaScript files
4. Refresh your browser

### Build Issues

If you get TypeScript errors:
1. Ensure you've run `pnpm compile`
2. Check that message files exist in `src/locales/{locale}/messages.js`
3. Restart your development server

### Dynamic Imports Failing

If locale switching doesn't work:
1. Check browser console for import errors
2. Ensure all locale directories exist
3. Verify `pnpm compile` ran successfully 