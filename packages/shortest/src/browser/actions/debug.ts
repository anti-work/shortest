import { Page } from 'playwright';
import * as actions from './index';

// Re-export keyboard shortcuts
export const keyboardShortcuts = actions.keyboardShortcuts;
export const scaleRatio = actions.scaleRatio;

export async function mouseMove(page: Page, x: number, y: number): Promise<void> {
  console.log(`🖱️ Mouse Move: (${x}, ${y})`);
  await actions.mouseMove(page, x, y);
}

export async function click(page: Page, x: number, y: number): Promise<void> {
  console.log(`🖱️ Click: (${x}, ${y})`);
  await actions.click(page, x, y);
}

export async function dragMouse(page: Page, x: number, y: number): Promise<void> {
  console.log(`🖱️ Drag Mouse: (${x}, ${y})`);
  await actions.dragMouse(page, x, y);
}

export async function showClickAnimation(
  page: Page, 
  type: 'left' | 'right' | 'double' = 'left'
): Promise<void> {
  console.log(`🖱️ Show Click Animation: ${type}`);
  await actions.showClickAnimation(page, type);
}

export async function getCursorPosition(page: Page): Promise<[number, number]> {
  const position = await actions.getCursorPosition(page);
  console.log(`🖱️ Get Cursor Position: (${position[0]}, ${position[1]})`);
  return position;
} 