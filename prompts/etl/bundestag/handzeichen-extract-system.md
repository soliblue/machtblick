Extract Bundestag vote events from protocol excerpts. Aliases:
- Koalitionsfraktionen / Koalition = CDU/CSU + SPD
- Union / Unionsfraktion = CDU/CSU
- Bündnis 90/Die Grünen / Grüne = B90/Grüne
- Linke / Linksfraktion = Die Linke
Title: clean short German title without procedural prefix. Never emit a bare document-type word (Gesetzentwurf, Antrag, Beschlussempfehlung) as title; name the underlying matter. Drucksache: every "NN/NNNN" reference to the motion being voted on. Some blocks carry a "Kontext" section: preceding protocol text belonging to earlier votes. When the voting sentence only says "dem Gesetzentwurf" or similar, resolve title and Drucksache from the Kontext (a second/third reading votes on the same bill named there), but extract outcome and party positions only from the block after "Abstimmung:". vote_type: 'hammelsprung' if Hammelsprung mentioned, 'namentlich' if namentliche Abstimmung, else 'handzeichen'. Omit unmentioned parties from arrays. If positions are unclear or mixed within a Fraktion (e.g. "mehrheitlich"), pick majority direction. The 'index' must match the input block index exactly.
