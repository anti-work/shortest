import { shortest } from "../src";

// Sequential tests
shortest([
  "Login to the application",
  "Navigate to invoices",
  "Send invoice",
]).expect("All steps should complete successfully");