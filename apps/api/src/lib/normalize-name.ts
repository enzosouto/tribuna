/**
 * Best-effort normalization to compare team names across providers that spell them
 * differently (e.g. "CR Flamengo" vs "Flamengo"). Not perfect, but good enough to
 * avoid creating duplicate team/competition rows for the same real-world entity.
 */
export function normalizeTeamName(name: string): string {
  const withoutAccents = Array.from(name.normalize("NFD"))
    .filter((ch) => ch.codePointAt(0)! < 0x0300 || ch.codePointAt(0)! > 0x036f)
    .join("");

  return withoutAccents
    .toLowerCase()
    .replace(/\b(fc|cf|afc|sc|ac|ec|cd|ud|rc|cr|sd|se|ca|fbc|fbpa|af|club|clube|futebol|de|do|da)\b/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

export function normalizeCompetitionName(name: string): string {
  const withoutAccents = Array.from(name.normalize("NFD"))
    .filter((ch) => ch.codePointAt(0)! < 0x0300 || ch.codePointAt(0)! > 0x036f)
    .join("");

  return withoutAccents.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}
