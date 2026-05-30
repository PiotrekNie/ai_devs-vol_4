# Firmware task (S03E02)

## Goal

Start the cooling controller binary on a restricted Linux VM and send the confirmation code to Centrala.

| Item | Value |
| --- | --- |
| Binary | `/opt/firmware/cooler/cooler.bin` |
| Success output | Code `ECCS-` + 40 hexadecimal characters |
| Hub task name | `firmware` |
| Submit shape | `{ "confirmation": "<ECCS-...>" }` |

## VM security rules (mandatory)

- You are a normal user — no root privileges.
- **Never** read or write under `/etc`, `/root`, or `/proc/`.
- If a directory contains `.gitignore`, do **not** touch listed paths.
- Violations cause an API **ban** and VM reset to initial state.

## Exploration strategy

1. **First command:** `help` — this VM uses custom commands; file editing may differ from standard Linux.
2. Locate and run `/opt/firmware/cooler/cooler.bin` (path argument is enough to start it).
3. Find the application password (stored in several places on the VM).
4. Fix `settings.ini` so cooling runs correctly.
5. Use `reboot` only if the system is badly misconfigured.

## shell_exec rules

- Exactly **one** shell command per tool call.
- Wait for each result before the next command.
- If output mentions ban / blocked / forbidden — VM reset; run `help` again and avoid the same mistake.

## Submit

When you have the `ECCS-...` code:

```json
submit_to_hub({
  "task_name": "firmware",
  "answer": { "confirmation": "ECCS-..." }
})
```

Call `finish_task` only after `{FLG:...}` appears in the hub tool result.
