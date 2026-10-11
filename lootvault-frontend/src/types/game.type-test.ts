import type { Card, GameMode, HandAction } from './game';
import type { ButtonProps } from '../components/Button';

// Compile-time regression checks. This module is never imported by the app.
export function verifyContracts() {
  const valid: Card = { rank: 14, suit: 'SPADES' };
  // @ts-expect-error A deck cannot contain rank 15.
  const rank: Card = { rank: 15, suit: 'SPADES' };
  // @ts-expect-error An unknown suit cannot enter a typed card renderer.
  const suit: Card = { rank: 14, suit: 'STARS' };
  // @ts-expect-error This action is not supported by the server.
  const action: HandAction = 'DOUBLE';
  // @ts-expect-error A misspelled mode is rejected before a request is made.
  const mode: GameMode = 'BLACKJAK';
  // @ts-expect-error Buttons expose only the supported visual variants.
  const button: ButtonProps = { variant: 'mint' };
  return { valid, rank, suit, action, mode, button };
}
