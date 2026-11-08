# Sweet Match

A small, free-to-play browser match-3 puzzle prototype inspired by the match-three genre. It uses original branding and emoji-based visuals, with no ads, account, build step, or paid services.

## Play

Open `index.html` in a modern browser, or publish the repository with GitHub Pages. Swap two adjacent sweets to match at least three. Reach the level target before you run out of moves. The Hint button uses a simple search to find a valid swap; boards are generated without starting matches and with at least one valid move.

## Files

- `index.html` — game markup
- `style.css` — responsive styling
- `main.js` — board generation, matches, gravity, levels, and hints

Progress is not sent to a server. This prototype does not use a machine-learning model; its hint and board-generation logic are lightweight rule-based search.

## License

MIT. See [LICENSE](LICENSE).
