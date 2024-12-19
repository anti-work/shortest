import { Button } from "@/components/ui/button";
import { ArrowRight, PenTool, Zap, Clock } from "lucide-react";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
              QA via natural language
              <span className="block text-orange-500">AI tests</span>
            </h1>
            <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl max-w-2xl mx-auto">
              Write tests in plain English and let AI handle the execution. Built on Playwright
              with seamless GitHub integration.
            </p>
            <div className="mt-8 flex justify-center">
              <SignedOut>
                <a href="https://github.com/anti-work/shortest" target="_blank">
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white border border-orange-600 rounded-full text-lg px-8 py-4 inline-flex items-center justify-center">
                    View on GitHub
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
              </SignedOut>
              <SignedIn>
                <a href="/dashboard">
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white border border-orange-600 rounded-full text-lg px-8 py-4 inline-flex items-center justify-center">
                    View Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
              </SignedIn>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            <div>
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                <PenTool className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  Natural Language Testing
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  Write tests in plain English - no need to learn complex testing frameworks or APIs.
                  <span className="font-bold text-green-500"> Simple and intuitive</span>.
                </p>
              </div>
            </div>

            <div className="mt-10 lg:mt-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                <Clock className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  AI-Powered QA
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  Powered by Anthropic's Claude API to understand and execute your QA tests
                  <span className="font-bold text-green-500"> with high reliability</span>.
                </p>
              </div>
            </div>

            <div className="mt-10 lg:mt-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                <Zap className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-gray-900">
                  Built on Playwright
                </h2>
                <p className="mt-2 text-base text-gray-500">
                  Leverages Playwright's robust testing engine
                  <span className="font-bold text-green-500"> with GitHub integration</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Write tests in plain English</h3>
              <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto">
                <code>{`import { shortest } from '@antiwork/shortest'

shortest('Login to the app using email and password', {
  username: process.env.GITHUB_USERNAME,
  password: process.env.GITHUB_PASSWORD
})`}</code>
              </pre>
              <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Simple configuration</h3>
              <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto">
                <code>{`import type { ShortestConfig } from '@antiwork/shortest';

export default {
  headless: false,
  baseUrl: 'http://localhost:3000',
  testDir: 'app/__tests__',
  anthropicKey: process.env.ANTHROPIC_API_KEY
} satisfies ShortestConfig;`}</code>
              </pre>
            </div>
            <div className="mt-8 lg:mt-0">
              <h2 className="text-3xl font-bold text-gray-900">Ready to simplify your testing?</h2>
              <p className="mt-3 text-lg text-gray-500">
                Write tests in natural language, powered by AI. Focus on describing your test cases
                while Shortest handles the execution details.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Ready to get started?
              </h2>
              <p className="mt-3 max-w-3xl text-lg text-gray-500">
                Start writing natural language tests today and let AI handle the implementation.
                Focus on describing your test scenarios while Shortest takes care of the rest.
              </p>
            </div>
            <div className="mt-8 lg:mt-0 flex justify-center lg:justify-end">
              <SignedOut>
                <a
                  href="https://github.com/anti-work/shortest"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="bg-white hover:bg-gray-100 text-black border border-gray-200 rounded-full text-xl px-12 py-6 inline-flex items-center justify-center">
                    Get started
                    <ArrowRight className="ml-3 h-6 w-6" />
                  </Button>
                </a>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard">
                  <Button className="bg-white hover:bg-gray-100 text-black border border-gray-200 rounded-full text-xl px-12 py-6 inline-flex items-center justify-center">
                    View Dashboard
                    <ArrowRight className="ml-3 h-6 w-6" />
                  </Button>
                </Link>
              </SignedIn>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
