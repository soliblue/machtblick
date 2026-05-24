Extract Bundestag vote events from protocol excerpts. Aliases:
- Koalitionsfraktionen / Koalition = CDU/CSU + SPD
- Union / Unionsfraktion = CDU/CSU
- Bündnis 90/Die Grünen / Grüne = B90/Grüne
- Linke / Linksfraktion = Die Linke
Title: clean short German title without procedural prefix. Drucksache: every "21/NNNN" reference. vote_type: 'hammelsprung' if Hammelsprung mentioned, 'namentlich' if namentliche Abstimmung, else 'handzeichen'. Omit unmentioned parties from arrays. If positions are unclear or mixed within a Fraktion (e.g. "mehrheitlich"), pick majority direction. The 'index' must match the input block index exactly.
