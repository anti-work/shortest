import * as actions from "../../browser/actions/index";
import {
  Browser,
  BrowserActionOptions,
  BrowserActionResult,
  BrowserActions,
} from "../../core/browser/browser";

type ClaudeResponse = {
  action: string;
  coordinate?: [number, number];
  text?: string;
  url?: string;
  duration?: number;
};

/**
 * Adapter for transforming LLM actions to browser actions
 */
//maybe worth making it an implementation of Browser interface
export class LLMAdapter {
  constructor(private browser: Browser) {}

  async transformAndExecute(
    response: ClaudeResponse
  ): Promise<BrowserActionResult<any>> {
    switch (response.action) {
      case "key":
        return this.handleKeyPress(response);
      case "type":
        return this.handleTypeText(response);
      case "mouse_move":
        return this.handleMouseMove(response);
      case "left_click":
        return this.handleLeftClick(response);
      case "left_click_drag":
        return this.handleLeftClickDrag(response);
      case "right_click":
        return this.handleRightClick(response);
      case "middle_click":
        return this.handleMiddleClick(response);
      case "double_click":
        return this.handleDoubleClick(response);
      case "screenshot":
        return this.handleScreenshot();
      case "cursor_position":
        return this.handleCursorPosition();
      case "navigate":
        return this.handleNavigate(response);
      case "sleep":
        this.handleSleep(response);
      default:
        throw new Error(`Unsupported action: ${response.action}`);
    }
  }

  private async handleKeyPress(
    response: ClaudeResponse
  ): Promise<BrowserActionResult<BrowserActions.Navigate>> {
    if (!response.text) throw new Error("Text required for key press action.");
    const text = response.text.toLowerCase();
    const toPress = Array.isArray(actions.keyboardShortcuts[text])
      ? (actions.keyboardShortcuts[text] as string[])
      : ([actions.keyboardShortcuts[text] || text] as string[]);

    return await this.browser.pressKey(toPress);
  }

  private async handleTypeText(
    response: ClaudeResponse
  ): Promise<BrowserActionResult<BrowserActions.Navigate>> {
    if (!response.text) throw new Error("Text required for type action.");
    return await this.browser.type(response.text);
  }

  private async handleMouseMove(
    response: ClaudeResponse
  ): Promise<BrowserActionResult<BrowserActions.MoveCursor>> {
    if (!response.coordinate)
      throw new Error("Coordinate required for mouse_move action.");
    const [x, y] = response.coordinate;
    return await this.browser.moveCursor(x, y);
  }

  private async handleLeftClick(
    response: ClaudeResponse
  ): Promise<BrowserActionResult<BrowserActions.Click>> {
    const [x, y] = response.coordinate ?? [null, null];
    return await this.browser.click(x, y);
  }

  private async handleLeftClickDrag(
    response: ClaudeResponse
  ): Promise<BrowserActionResult<BrowserActions.Drag>> {
    if (!response.coordinate)
      throw new Error("Coordinate required for left_click_drag action.");
    const [x, y] = response.coordinate;
    return await this.browser.drag(x, y);
  }

  private async handleRightClick(
    _response: ClaudeResponse
  ): Promise<BrowserActionResult<BrowserActions.Click>> {
    throw new Error("Right click not supported yet.");
  }

  private async handleMiddleClick(
    _response: ClaudeResponse
  ): Promise<BrowserActionResult<BrowserActions.Click>> {
    throw new Error("Right click not supported yet.");
  }

  private async handleDoubleClick(
    response: ClaudeResponse
  ): Promise<BrowserActionResult<BrowserActions.Click>> {
    console.warn(
      "Double click not supported yet, left click will be used instead."
    );
    return await this.handleLeftClick(response);
  }

  private async handleScreenshot(): Promise<
    BrowserActionResult<BrowserActions.Screenshot>
  > {
    return await this.browser.screenshot();
  }

  private async handleCursorPosition(): Promise<
    BrowserActionResult<BrowserActions.GetState>
  > {
    const result = await this.browser.getState();
    const cursorPosition = result.metadata?.browserState?.cursor?.position;
    return {
      message: `Cursor position is: (${cursorPosition?.x}, ${cursorPosition?.y})`,
      payload: result.payload,
      metadata: result.metadata,
    };
  }

  private async handleNavigate(
    response: ClaudeResponse
  ): Promise<BrowserActionResult<BrowserActions.Navigate>> {
    if (!response.url) throw new Error("URL required for navigate action.");
    const options: BrowserActionOptions.Navigate = {
      shoultInitialize: true,
    };
    return await this.browser.navigate(response.url, options);
  }

  private async handleSleep(
    response: ClaudeResponse
  ): Promise<BrowserActionResult<BrowserActions.Sleep>> {
    return this.browser.sleep(response.duration ?? null);
  }
}