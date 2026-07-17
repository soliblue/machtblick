# Pin Scheduler Sol Ultra

## Goal

Run the weekly Bundestag refresh with `gpt-5.6-sol` at `ultra` reasoning effort.

## Status

Done.

## Contract

- Pin model and effort in the systemd service template.
- Reinstall and reload the user units.
- Do not trigger a refresh run.

## Log

- Lead: Added explicit scheduler model and effort environment variables.
- Lead: Reinstalled the user units and verified the loaded service environment.
