export const AITools = [
  {
    type: "computer_20241022",
    name: "computer",
    display_width_px: 1920,
    display_height_px: 1080,
    display_number: 1
  },
  {
    name: "github_login",
    description: "Handle GitHub OAuth login with 2FA",
    input_schema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["github_login"],
          description: "The action to perform. It's always equal to 'github_login'"
        },
        username: {
          type: "string",
          description: "GitHub username or email"
        },
        password: {
          type: "string",
          description: "GitHub password"
        }
      },
      required: ["action", "username", "password"]
    }
  },
  {
    name: "generate_email",
    description: "Generate temporary email address for testing",
    input_schema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["generate_email"],
          description: "Generate a temporary email address"
        }
      },
      required: ["action"]
    }
  },
  {
    name: "render_email",
    description: "Fetch, decode and render received email in browser",
    input_schema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["render_email"],
          description: "Render the received email in a new tab"
        }
      },
      required: ["action"]
    }
  },
  {
    name: "sleep_milliseconds",
    description: "Pause test execution for specified duration",
    input_schema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["sleep_milliseconds"],
          description: "The action to perform"
        },
        duration: {
          type: "number",
          description: "Duration to sleep in milliseconds (e.g. 5000 for 5 seconds)",
          minimum: 0,
          maximum: 60000
        }
      },
      required: ["action", "duration"]
    }
  },
  {
    name: "run_callback",
    description: "Run callback function for current test step",
    input_schema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["run_callback"],
          description: "Execute callback for current step"
        }
      },
      required: ["action"]
    }
  },
  {
    name: "navigate",
    description: "Navigate to URLs in new browser tabs",
    input_schema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["navigate"],
          description: "The action to perform"
        },
        url: {
          type: "string",
          description: "The URL to navigate to"
        }
      },
      required: ["action", "url"]
    }
  }
] as const;

export type AITool = typeof AITools[number]['name'];
