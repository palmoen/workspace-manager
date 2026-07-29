import { customAlphabet } from "nanoid";

// Utelater 0, O, 1, I, L for å unngå forveksling ved manuell inntasting
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const generate = customAlphabet(ALPHABET, 8);

export function generateAssetId(): string {
  return `AC-${generate()}`;
}
