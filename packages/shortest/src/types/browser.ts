import { TestContext, Page } from "./test";

export interface BrowserToolInterface {
  waitForSelector(selector: string, options?: { timeout: number }): Promise<void>;
  fill(selector: string, value: string): Promise<void>;
  press(selector: string, key: string): Promise<void>;
  findElement(selector: string): Promise<any>;
  waitForNavigation(options?: { timeout: number }): Promise<void>;
  click(selector: string): Promise<void>;
  getPage(): Page;
}

export type BrowserAction = 
  | "mouse_move"
  | "left_click"
  | "left_click_drag"
  | "right_click"
  | "middle_click"
  | "double_click"
  | "screenshot"
  | "cursor_position"
  | "github_login"
  | "clear_session"
  | "type"
  | "key"
  | "run_callback"
  | "navigate"
  | "sleep_milliseconds";

export interface BrowserToolOptions {
  width: number;
  height: number;
  displayNum?: number;
  screenshotDelay?: number;
}

export interface ActionInput {
  action: BrowserAction;
  coordinates?: number[];
  text?: string;
  username?: string;
  password?: string;
  url?: string;
  duration?: number;
}

export interface ToolResult {
  output?: string;
  error?: string;
  base64_image?: string;
  metadata?: {
    window_info?: {
      url: string;
      title: string;
      size: { width: number; height: number }
    };
    cursor_info?: {
      position: [number, number];
      visible: boolean;
    };
  };
}

export interface BrowserConfig {
  name: 'chrome' | 'firefox' | 'safari' | 'edge';
  headless?: boolean;
  width?: number;
  height?: number;
  displayNum?: number;
}

export interface BrowserToolConfig {
  width: number;
  height: number;
  testContext?: TestContext;
}

export type BetaToolType = 
  | "computer_20241022"
  | "text_editor_20241022"
  | "bash_20241022";

export interface BetaToolParams {
  type: BetaToolType;
  name: string;
  display_width_px?: number;
  display_height_px?: number;
  display_number?: number;
}