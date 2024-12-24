# Shortest

AI-powered natural language end-to-end testing framework.

## Features
- Natural language test writing
- AI-powered test execution using Claude computer use API
- Built on Playwright
- GitHub integration with 2FA support

## Installation
```bash
npm install -D @antiwork/shortest
# or
pnpm add -D @antiwork/shortest
# or
yarn add -D @antiwork/shortest
```

Add `.shortest/` to your `.gitignore`:
```bash
echo ".shortest/" >> .gitignore
```

## Quick Start

1. Determine your test entry and add your Anthropic API key in config file: `shortest.config.ts`

```typescript
import type { ShortestConfig } from '@antiwork/shortest';

export default {
  headless: false,
  baseUrl: 'http://localhost:3000',
  testDir: 'app/__tests__',
  anthropicKey: process.env.ANTHROPIC_API_KEY
} satisfies ShortestConfig; 
```

2. Write your test in the test directory: `app/__tests__/login.test.ts`
```typescript
import { shortest } from '@antiwork/shortest'

shortest('Login to the app using email and password', { username: process.env.GITHUB_USERNAME, password: process.env.GITHUB_PASSWORD })
```

## Using callback functions
You can also use callback functions to add additoinal assertions and other logic. AI will execute the callback function after the test
execution in browser is completed.

```typescript
import { shortest } from '@antiwork/shortest';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

shortest('Login to the app using username and password', {
  username: process.env.USERNAME,
  password: process.env.PASSWORD
}).after(async ({ page }) => {    
  // Get current user's clerk ID from the page
  const clerkId = await page.evaluate(() => {
    return window.localStorage.getItem('clerk-user');
  }); 

  if (!clerkId) {
    throw new Error('User not found in database');
  }

  // Query the database
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  expect(user).toBeDefined();
});
```

## Lifecycle hooks
You can use lifecycle hooks to run code before and after the test.

```typescript
import { shrotest } from '@antiwork/shortest';

shortest.beforeAll(async ({ page }) => {
  await clerkSetup({
    frontendApiUrl: process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://localhost:3000",
  });
});

shortest.beforeEach(async ({ page }) => {
  await clerk.signIn({
    page,
    signInParams: { 
      strategy: "email_code", 
      identifier: "iffy+clerk_test@example.com" 
    },
  });
});

shortest.afterEach(async ({ page }) => {
  await page.close();
});

shortest.afterAll(async ({ page }) => {
  await clerk.signOut({ page });
});
```

## Running Tests
```bash
shortest                    # Run all tests
shortest login.test.ts     # Run specific test
shortest --headless        # Run in headless mode using cli
```

### If you installed shortest without `-g` flag, you can run tests as follows:
```bash
npx shortest    # for npm
pnpm shortest   # for pnpm
yarn shortest   # for yarn
```

## GitHub 2FA Login Setup
Shortest currently supports login using Github 2FA. For GitHub authentication tests:

1. Go to your repository settings
2. Navigate to "Password and Authentication"
3. Click on "Authenticator App"
4. Select "Use your authenticator app"
5. Click "Setup key" to obtain the OTP secret
6. Add the OTP secret to your `.env.local` file or use the Shortest CLI to add it
7. Enter the 2FA code displayed in your terminal into Github's Authenticator setup page to complete the process
```bash
shortest --github-code --secret=<OTP_SECRET>
```

## Environment Setup
Required in `.env.local`:
```bash
ANTHROPIC_API_KEY=your_api_key
GITHUB_TOTP_SECRET=your_secret  # Only for GitHub auth tests
```

## CI Setup
You can run shortest in your CI/CD pipeline by running tests in headless mode. Make sure to add your Anthropic API key to your CI/CD pipeline secrets.

## Documentation
Visit [GitHub](https://github.com/anti-work/shortest) for detailed docs

### Prerequisites
- React >=19.0.0 (if using with Next.js 14+ or Server Actions)
- Next.js >=14.0.0 (if using Server Components/Actions)

⚠️ **Known Issues**
- Using this package with React 18 in Next.js 14+ projects may cause type conflicts with Server Actions and `useFormStatus`
- If you encounter type errors with form actions or React hooks, ensure you're using React 19

