/** Frontend contracts mirror the Spring EarnResponse, PlayerResponse and WalletResponse DTOs. */
export type GameMode = 'HOLDEM' | 'BLACKJACK';
export type Currency = 'SOFT' | 'HARD';
export type CardSuit = 'HEARTS' | 'DIAMONDS' | 'CLUBS' | 'SPADES';
export type CardRank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
export interface Card { rank: CardRank; suit: CardSuit }
export interface HiddenCard { suit: 'BACK'; rank?: number }
export type VisibleCard = Card | HiddenCard | null;
export type HandAction = 'CHECK' | 'CALL' | 'RAISE' | 'FOLD' | 'HIT' | 'STAND';
export interface Player { id: string; username: string; email: string; devMode: boolean }
export interface Wallet { walletId: string; playerId: string; softBalance: number; hardBalance: number; gemBalance: number; unlimited: boolean }
export interface Seat { name: string; cards: VisibleCard[]; folded: boolean; total: number | null; hand: string | null }
export interface ShowdownReveal { close: boolean; winners: string[]; winningHand: string; playerHand: string; opponentHand: string; extreme: boolean }
export interface Round {
  id: string; game: GameMode; stage: 'YOUR_TURN' | 'FLOP' | 'TURN' | 'RIVER' | 'COMPLETE';
  version: number; stake: number; committed: number; pot: number; payout: number;
  outcome: string | null; message: string; cards: Card[]; board: Card[]; opponents: Seat[];
  total: number | null; hand: string | null; pressure: number; actions: HandAction[];
  showdown: ShowdownReveal | null; toCall: number; currency: Currency;
}
export interface EarnState {
  daily: { coins: number; claimed: boolean; resetsAt: string };
  stats: { handsPlayed: number; wins: number; netCoins: number; netGems: number };
  round: Round | null;
}
