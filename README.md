# Shortest
**[shortest.com](https://shortest.com)**

AI-powered natural language end-to-end testing framework.

## Features
- Natural language E2E testing framework
- AI-powered test execution using Anthropic Claude API
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

### If you installed shortest without `-g` flag, you can run tests as follows:
```bash
npx shortest    # for npm
pnpm shortest   # for pnpm
yarn shortest   # for yarn
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

2. Write your test in your test directory: `app/__tests__/login.test.ts`

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
import { shortest } from '@antiwork/shortest';

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

And you're done!

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

# Local Development Setup Guide

This guide will help you set up the Shortest web app for local development.

### Prerequisites
- React >=19.0.0 (if using with Next.js 14+ or Server Actions)
- Next.js >=14.0.0 (if using Server Components/Actions)

⚠️ **Known Issues**
- Using this package with React 18 in Next.js 14+ projects may cause type conflicts with Server Actions and `useFormStatus`
- If you encounter type errors with form actions or React hooks, ensure you're using React 19

### Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/anti-work/shortest.git
   cd shortest
   ```

2. Install dependencies:
   ```bash
   npm install -g pnpm
   pnpm install
   ```

#### For Gumroad Vercel Team Members:
1. Run `vercel env pull` to get the latest environment variables
- https://vercel.com/docs/deployments/local-env#environment-variables-for-local-development

#### For Other Contributors:
1. Run `pnpm run setup` to configure the environment variables.
2. The setup wizard will ask you for information. Refer to "Services Configuration" section below for more details.

#### Set up the database:
   ```bash
   pnpm drizzle-kit generate
   pnpm db:migrate
   pnpm db:seed # creates stripe products, currently unused
   ```

### Services Configuration

You'll need to set up the following services for local development. If you're not a Gumroad Vercel team member, you'll need to either run the setup wizard `pnpm run setup` or manually configure each of these services and add the corresponding environment variables to your `.env.local` file:

<details>
<summary>Clerk</summary>

1. Go to [clerk.com](https://clerk.com) and create a new app.
2. Name it whatever you like and **disable all login methods except GitHub**.
   ![Clerk App Login](https://github.com/user-attachments/assets/1de7aebc-8e9d-431a-ae13-af60635307a1)
3. Once created, copy the environment variables to your `.env.local` file.
   ![Clerk Env Variables](https://github.com/user-attachments/assets/df3381e6-017a-4e01-8bd3-5793e5f5d31e)

</details>

<details>
<summary>Vercel Postgres</summary>

1. Go to your dashboard at [vercel.com](https://vercel.com).
2. Navigate to the Storage tab and click the `Create Database` button.
   ![Vercel Create Database](https://github.com/user-attachments/assets/acdf3ba7-31a6-498b-860c-171018d5ba02)
3. Choose `Postgres` from the `Browse Storage` menu.
   ![Neon Postgres](https://github.com/user-attachments/assets/9ad2a391-5213-4f31-a6c3-b9e54c69bb2e)
4. Copy your environment variables from the `Quickstart` `.env.local` tab.
   ![Vercel Postgres .env.local](https://github.com/user-attachments/assets/e48f1d96-2fd6-4e2e-aaa6-eeb5922cc521)

</details>

<details>
<summary>Anthropic</summary>

1. Go to your dashboard at [anthropic.com](https://anthropic.com) and grab your API Key.
   - Note: If you've never done this before, you will need to answer some questions and likely load your account with a balance. Not much is needed to test the app.
   ![Anthropic API Key](https://github.com/user-attachments/assets/0905ed4b-5815-4d50-bf43-8713a4397674)

</details>

<details>
<summary>Stripe</summary>

1. Go to your `Developers` dashboard at [stripe.com](https://stripe.com).
2. Turn on `Test mode`.
3. Go to the `API Keys` tab and copy your `Secret key`.
   ![Stripe Secret Key](https://github.com/user-attachments/assets/0830b226-f2c2-4b92-a28f-f4682ad03ec0)
4. Go to the terminal of your project and type `pnpm run stripe:webhooks`. It will prompt you to login with a code then give you your `STRIPE_WEBHOOK_SECRET`.
   ![Stripe Webhook Secret](https://github.com/user-attachments/assets/b02531ed-5c31-40ba-8483-32880aa3ca36)

</details>

<details>
<summary>GitHub OAuth</summary>

1. Create a GitHub OAuth App:
   - Go to your GitHub account settings.
   - Navigate to `Developer settings` > `OAuth Apps` > `New OAuth App`.
   - Fill in the application details:
     - **Application name**: Choose any name for your app
     - **Homepage URL**: Set to `http://localhost:3000` for local development
     - **Authorization callback URL**: Use the Clerk-provided callback URL (found in below image)
   ![Github OAuth App](https://github.com/user-attachments/assets/1af635fd-dedc-401c-a45a-159cb20bb209)

2. Configure Clerk with GitHub OAuth:
   - Go to your Clerk dashboard.
   - Navigate to `Configure` > `SSO Connections` > `GitHub`.
   - Select `Use custom credentials`
   - Enter your `Client ID` and `Client Secret` from the GitHub OAuth app you just created.
   - Add `repo` to the `Scopes`
   ![Clerk Custom Credentials](https://github.com/user-attachments/assets/31d414e1-4e1e-4725-8649-ec1826c6e53e)

</details>

### Running the Application

Once you have set up the environment variables and installed dependencies, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app in action.


## Building Shortest Package Locally

```bash
pnpm build:pkg
pnpm install
```

## Setup Shortest CLI for local development
```bash
# packages/shortest
cd packages/shortest
pnpm link --global

# root
cd ../..
pnpm link --global shortest
```

## Test Cli Locally

1. Create a temporary test directory outside your project:
```bash
cd ~/shortest-test
```

2. Pack shortest package locally:
```bash
cd /packages/shortest
pnpm pack
```

3. Install the packed tarball in your test directory:
```bash
cd ~/test-cli
npm init -y
npm install ../packages/shortest/antiwork-shortest-{version}.tgz
# or to run globally
npm install -g ../packages/shortest/antiwork-shortest-{version}.tgz
```

4. Try cli
```bash
npx shortest -h
# or
./node_modules/.bin/shortest -h
# or if you have installed shortest globally
shortest -h
```




