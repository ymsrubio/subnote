# Sections are aligned power-of-two blocks

Sections are sized as powers of two and start on a page boundary matching their size, exactly like subnets, rather than as arbitrary back-to-back page ranges. This mirrors the paper method it automates: Setup places Sections largest first so nothing is wasted, and Sections added later take the first aligned free block, leaving skipped pages for smaller Sections. The cost is that a Section can get more pages than asked for. Placements never move after Setup because the Title Page is already written on paper.

## Considered Options

- Any size, back to back: more flexible, but loses the clean splitting and predictable boundaries that make the paper system hard to get wrong.
- Power-of-two sizes without alignment: neat sizes, but freed and skipped pages no longer combine into reusable blocks.
