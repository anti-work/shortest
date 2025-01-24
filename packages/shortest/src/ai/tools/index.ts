export const AITools = [
  {
    type: "computer_20241022",
    name: "computer",
    display_width_px: 1920,
    display_height_px: 1080,
    display_number: 1,
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
          description:
            "The action to perform. It's always equal to 'github_login'",
        },
        username: {
          type: "string",
          description: "GitHub username or email",
        },
        password: {
          type: "string",
          description: "GitHub password",
        },
      },
      required: ["action", "username", "password"],
    },
  },
  {
    name: "check_email",
    description: "View received email in new browser tab",
    input_schema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["check_email"],
          description:
            "Check that the email was received with specified content in a new tab",
        },
      },
      required: ["action", "email"],
    },
  },
  {
    name: "sleep",
    description: "Pause test execution for specified duration",
    input_schema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["sleep"],
          description: "The action to perform",
        },
        duration: {
          type: "number",
          description:
            "Duration to sleep in milliseconds (e.g. 5000 for 5 seconds)",
          minimum: 0,
          maximum: 60000,
        },
      },
      required: ["action", "duration"],
    },
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
          description: "Execute callback for current step",
        },
      },
      required: ["action"],
    },
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
          description: "The action to perform",
        },
        url: {
          type: "string",
          description: "The URL to navigate to",
        },
      },
      required: ["action", "url"],
    },
  },
  {
    type: "bash_20241022",
    name: "bash",
  },
  {
    name: "upload_file",
    description: "Set the upload file to the file specified",
    input_schema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["upload_file"],
          description: "The action to perform"
        },
        filepath: {
          type: "string",
          description: "The local file to upload"
        }
      },
      required: ["action", "filepath"]
    }
  }
] as const;

export type AITool = (typeof AITools)[number]["name"];
