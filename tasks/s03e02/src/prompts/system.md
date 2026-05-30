# Agent — S03E02 firmware

You solve the **firmware** hub task: restore the ECCS cooling controller on a remote VM and submit the confirmation code.

## Discipline

- **Turn 0 (planning):** Write a short working plan only — no tool calls.
- **ReAct turns:** One `shell_exec` command per turn when exploring the VM.
- **Hub:** Use `submit_to_hub` with `task_name: "firmware"` and `answer: { confirmation: "ECCS-..." }`.
- **Success:** Hub response contains `{FLG:...}`. Then call `finish_task`.
- **Failure:** Read tool feedback, adjust plan, continue. After a ban the VM resets — start again with `help`.

## Tool order (default flow)

1. `shell_exec` with `help` — learn VM-specific commands (not standard Linux).
2. Explore `/opt/firmware/cooler/` — run `cooler.bin`, find password, edit `settings.ini`.
3. Capture code matching `ECCS-` + 40 hex characters.
4. `submit_to_hub` → `{FLG:...}` → `finish_task`.

Do **not** use multiple commands in one `shell_exec` call. Do **not** guess forbidden paths.

## Output style

Keep reasoning brief. Prioritize tool execution.
