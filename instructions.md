# Multiplayer Minesweeper Implementation Plan

## Project Setup

### 1. Initialize Project Structure

- Create new Vite + React + TypeScript project
- Set up project structure with folders: `src/lib`, `src/hooks`, `src/components`, `src/types`, `src/utils`
- Configure Vite with React plugin
- Set up TypeScript configuration

### 2. Install Dependencies

- Install core dependencies: `react`, `react-dom`, `@supabase/supabase-js`
- Install dev dependencies: `@vitejs/plugin-react`, TypeScript types
- Set up environment variable handling for Supabase credentials

### 3. Basic Deployment Setup (GitHub Pages)

- Set up GitHub repository for the project
- Store `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in GitHub Secrets
- Create GitHub Actions workflow (`.github/workflows/deploy.yml`) that:
- Builds project with `vite build` (using secrets as environment variables)
- Deploys `dist/` folder to GitHub Pages
- Configure repository settings for GitHub Pages
- Test deployment pipeline with a simple "Hello World" app
- Note: Values are baked into build at compile time (this is expected and safe for Supabase anon key)
- The anon key will be visible in built JS files (this is intentional - Supabase protects data via RLS policies)

## Supabase Setup

### 4. Database Schema

- Create Supabase project
- Define `games` table with schema:
- `id` (UUID, primary key)
- `player1_id` (TEXT)
- `player2_id` (TEXT)
- `current_turn` (TEXT: 'player1' or 'player2')
- `turn_phase` (TEXT: 'place_mine' or 'reveal_cell')
- `game_state` (JSONB: board with revealed cells, flags, dynamically placed mine positions with player attribution)
- `status` (TEXT: 'waiting', 'active', 'finished')
- `winner` (TEXT: 'player1', 'player2', or NULL)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- Enable Realtime on the `games` table
- Create indexes for performance
- Game flow: Each turn consists of placing a mine, then revealing a cell. After reveal, game state is evaluated, changes pushed, and turn passes to next player

### 4. Supabase Client Configuration

- Create `src/lib/supabase.ts` with Supabase client initialization
- Set up environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Export configured client for use throughout app

## Core Game Logic

### 5. Game Types and Interfaces

- Create `src/types/game.ts` with TypeScript interfaces:
- `Cell` type (has mine with `minePlacedBy`, revealed, flagged with `flagPlacedBy`, adjacent mines count)
- `GameState` type (board array, game status, turn info, turn phase)
- `Game` type (database record structure matching schema: id, player1_id, player2_id, current_turn, turn_phase, game_state, status, winner, created_at, updated_at)
- `Move` type (row, col, action: 'place_mine' | 'reveal_cell')

**Cell Structure:**

```typescript
{
  hasMine: boolean;
  minePlacedBy: "player1" | "player2" | null; // Who placed the mine
  revealed: boolean;
  flagged: boolean;
  flagPlacedBy: "player1" | "player2" | null; // Who placed the flag (private to that player)
  adjacentMines: number;
}
```

### 6. Player Identification (No Auth Required!)

- Create `src/utils/playerId.ts` with simple player ID management:
- `getPlayerId()` - Get or generate a player ID from localStorage (8-char random string)
- `isPlayer1(game)` - Check if current browser is player1
- `isPlayer2(game)` - Check if current browser is player2
- `getPlayerRole(game)` - Returns "player1", "player2", or "spectator"
- **No authentication needed** - each browser/device gets a unique ID in localStorage
- Perfect for hackathon/demo projects and GitHub Pages deployment

### 7. Minesweeper Game Logic

- Create `src/utils/minesweeper.ts` with core game functions:
- `generateEmptyBoard(rows, cols)` - Generate empty board without mines
- `placeMine(board, row, col, playerId)` - Place a mine on the board with player attribution
- `revealCell(board, row, col)` - Reveal cell and cascade reveal adjacent cells that aren't bordered by mines
- `toggleFlag(board, row, col)` - Toggle flag on cell
- `checkWinCondition(board, revealingPlayer)` - Check if opponent hit a mine (revealing player wins)
- `checkLoseCondition(board, row, col)` - Check if mine was revealed (revealing player loses)
- `countAdjacentMines(board, row, col)` - Count mines around a cell
- `isValidMineePlacement(board, row, col)` - Validate mine placement (cell not revealed, not already has mine)

## React Components

### 8. Game Board Component

- Create `src/components/GameBoard.tsx`:
- Render grid of cells
- Display current turn indicator and turn phase (place mine or reveal)
- Handle mine placement click during 'place_mine' phase
- Handle cell reveal click during 'reveal_cell' phase
- Handle right click (flag) at any time
- Show game status (waiting, active, finished)
- Disable interactions when not player's turn
- Show phase-specific instructions ("Place your mine" or "Reveal a cell")
- The Gameboard will present a different view depending on the player (hide opponent's mines)

### 9. Cell Component

- Create `src/components/Cell.tsx`:
- Render individual cell with appropriate styling
- Show revealed state (number, mine, empty)
- Show flag state (only if `flagPlacedBy` matches current player's role)
- Show hidden state
- Handle click events (disabled when not player's turn)
- Flags are private: only render flag icon if `cell.flagPlacedBy === playerRole`

### 10. Game Lobby Component

- Create `src/components/GameLobby.tsx`:
- Allow player to create new game (uses `getPlayerId()` for player1_id)
- Display game code/ID for sharing
- Allow second player to join via game ID (uses `getPlayerId()` for player2_id)
- Show waiting state until both players join

### 11. Player Status Component

- Create `src/components/PlayerStatus.tsx`:
- Display current player's turn
- Show both players' status
- Display game result (winner/loser)
- Use `getPlayerRole()` to determine if viewing as player1, player2, or spectator

## Real-time Hooks

### 12. Game State Hook

- Create `src/hooks/useRealtimeGame.ts`:
- Fetch initial game state from Supabase
- Subscribe to real-time updates via `postgres_changes` event
- Manage local game state
- Provide `placeMine` function for placing mines
- Provide `revealCell` function for revealing cells
- Provide `toggleFlag` function for flagging cells (unlimited per turn, any phase, private to player)
- Handle turn phase transitions (place_mine → reveal_cell → next player's turn)
- Handle turn switching logic after reveal phase completes
- Evaluate win/loss conditions after each reveal
- Clean up subscriptions on unmount

**Flag Behavior:**

- Flags can be placed/removed unlimited times during your turn
- Flags work in BOTH phases (place_mine and reveal_cell)
- Flagging does not consume your turn or advance the phase
- Flags are private - only visible to the player who placed them (via `flagPlacedBy` field)
- Only restriction: must be your turn and game must be active

### 13. Game Management Hook

- Create `src/hooks/useGame.ts`:
- Handle game creation (use `getPlayerId()` for player1_id)
- Handle joining existing games (use `getPlayerId()` for player2_id)
- Manage player IDs via localStorage
- Handle game state synchronization

## Main Application

### 14. App Component

- Create `src/App.tsx`:
- Route between lobby and game board
- Manage game ID state (player ID handled by `getPlayerId()`)
- Handle game lifecycle (create, join, play)

### 15. Entry Point

- Update `src/main.tsx`:
- Set up React root
- Import global styles
- Render App component

## Styling

### 16. Game Styling

- Create `src/index.css` with:
- Board grid layout
- Cell styling (hidden, revealed, flagged states)
- Turn indicator styling
- Responsive design
- Color scheme for different cell states
- Use DaisyUI for themes

## Testing & Validation

### 17. Move Validation

- Add client-side validation:
- Check if it's player's turn (use `getPlayerRole()`)
- Validate cell coordinates
- For `placeMine`: Check turn_phase is 'place_mine', cell not revealed, cell doesn't already have mine
- For `revealCell`: Check turn_phase is 'reveal_cell', cell not already revealed
- Prevent flagging revealed cells
- Ensure actions match current turn phase

### 18. Error Handling

- Add error handling for:
- Supabase connection failures
- Invalid game states
- Network interruptions
- Reconnection logic

## Deployment

### 19. Build Configuration

- Configure Vite build settings
- Set up environment variable handling for production
- Test production build locally

### 20. Deployment Setup

- **Option A (Free)**: Deploy via GitHub Actions to Netlify (bypasses private org restriction)
- Create GitHub Actions workflow to build and deploy
- Configure Netlify site with manual deployment
- Set environment variables in Netlify dashboard

- **Option B (Free)**: Deploy static build to GitHub Pages
- Store `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in GitHub Secrets
- Create GitHub Actions workflow that:
- Builds project with `vite build` (using secrets as environment variables)
- Deploys `dist/` folder to GitHub Pages
- Note: Values are baked into build at compile time (this is expected and safe for Supabase anon key)
- The anon key will be visible in built JS files (this is intentional - Supabase protects data via RLS policies)

- **Option C (Free)**: Deploy to Cloudflare Pages
- Connect repository to Cloudflare Pages
- Configure build settings (Vite)
- Set environment variables in Cloudflare dashboard

- **Option D**: Use Netlify/Vercel Pro plan for private org repos
- Configure environment variables in deployment platform
- Test deployed application

## Documentation

### 21. Create Documentation

- Create README with setup instructions
- Document environment variables needed
- Document Supabase setup steps
- Include game rules and how to play
