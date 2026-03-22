import "../config.js";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { runAgentTurn } from "./src/agent.ts";
import { WORKSPACE_DOC } from "./src/config.ts";
import { fetchAndCacheDocs } from "./src/docs/fetchDocs.ts";
import { imagePathsToStructuredJson } from "./src/native/vision.ts";
import { submitSendit } from "./src/verify/submit.ts";

const TASK_FACTS = {
  senderId: "450202122",
  origin: "Gdańsk",
  destination: "Żarnowiec",
  cargoDescription: "kasety z paliwem do reaktora",
  massRaw: "2,8 tony",
};

function todayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function main() {
  console.log("Pobieranie dokumentacji SPK do workspace/doc/ …");
  const { imagePaths } = await fetchAndCacheDocs();

  const zalE = await readFile(path.join(WORKSPACE_DOC, "zalacznik-E.md"), "utf8").catch(
    () => "",
  );

  let ocrJson = "[]";
  if (imagePaths.length > 0) {
    console.log(`OCR (${imagePaths.length}) plików graficznych …`);
    const ocr = await imagePathsToStructuredJson(imagePaths);
    ocrJson = JSON.stringify(ocr.pages, null, 2);
  }

  const instructions = `Jesteś agentem przygotowującym deklarację SPK dla zadania Centrali (sendit).

## Dane przesyłki (stałe)
- Nadawca (identyfikator): ${TASK_FACTS.senderId}
- Punkt nadawczy: ${TASK_FACTS.origin}
- Punkt docelowy: ${TASK_FACTS.destination}
- Zawartość: ${TASK_FACTS.cargoDescription}
- Masa: ${TASK_FACTS.massRaw} → użyj unit_normalization, potem zweryfikuj count_fee
- Uwagi specjalne: brak (pole tekstowe może być puste lub słowo "brak" — nie wymyślaj treści)

## Reguły
1. Przeczytaj kontekst: Załącznik E (wzór), OCR tras wyłączonych, mapę zalacznik-F.
2. Trasa Gdańsk–Żarnowiec: w OCR tras wyłączonych jest **X-01** (bezpośredni odcinek). Dla przesyłek kategorii A i B trasy do Żarnowca są dopuszczalne mimo wyłączenia (§8.3 dokumentacji).
3. Kategoria: **A** (strategiczna — paliwo / zasilanie reaktora). Nie używaj kategorii zakazanej.
4. Opłata: dla A i B obowiązuje **zwolnienie z opłat** (0 PP). Wywołaj count_fee aby to potwierdzić (massKg, distanceKm ~80 dla X-01, regionalBoundaries: 0).
5. WDP: liczba **dodatkowych wagonów** ponad standardowy skład 2×500 kg (dla 2800 kg → 6 wagonów łącznie → **4** dodatkowe). Dla kat. A/B nie są one **płatne** (stawka 0 PP), ale pole WDP musi odzwierciedlać skład — wpisz **4**, nie 0.
6. Na końcu wywołaj **fill_declaration** z polami zgodnymi z obliczeniami. Nie zmieniaj nagłówków ani separatorów wzoru.

### Załącznik E (wzór)
${zalE || "(brak pliku — użyj narzędzi)"}

### JSON z OCR grafik (trasy wyłączone itd.)
${ocrJson}
`;

  const query = `Przygotuj deklarację: DATA=${todayYmd()}. Wywołaj narzędzia po kolei: unit_normalization, count_fee, na końcu fill_declaration.`;

  let history: unknown[] = [];

  for (let attempt = 1; attempt <= 10; attempt++) {
    console.log(`\n--- Agent, próba ${attempt}/10 ---`);
    const { declaration, conversationHistory } = await runAgentTurn(
      attempt === 1 ? query : "Popraw deklarację zgodnie z komunikatem Hubu z poprzedniej wiadomości.",
      history,
      instructions,
    );
    history = conversationHistory;

    if (!declaration?.trim()) {
      console.error("Brak wyniku fill_declaration — kończę.");
      process.exit(1);
    }

    console.log("\n--- Deklaracja (skrót) ---\n", declaration.slice(0, 400), "\n…");

    const result = await submitSendit(declaration);
    console.log("Odpowiedź Hub:", result);

    const msg = typeof result.message === "string" ? result.message : "";
    if (result.code === 0 && msg.includes("{FLG:")) {
      console.log("\nSukces:", msg);
      return;
    }

    const hint = msg || JSON.stringify(result);
    history.push({
      role: "user",
      content: `Hub odrzucił deklarację. Komunikat: ${hint}`,
    });
  }

  console.error("Przekroczono limit 10 prób weryfikacji.");
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
