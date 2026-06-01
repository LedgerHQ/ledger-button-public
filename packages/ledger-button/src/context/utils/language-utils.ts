import { type LangKey } from "./../constants/languages.js";

export function capitalizeFirstLetterWhenCased(
  text: string,
  locale: string,
): string {
  const chars = [...text];
  if (chars.length === 0) {
    return text;
  }
  const first = chars[0];
  if (!/^\p{L}$/u.test(first)) {
    return text;
  }
  const upper = first.toLocaleUpperCase(locale);
  return upper + chars.slice(1).join("");
}

export function getLanguageDisplayName(code: LangKey): string {
  try {
    const raw =
      new Intl.DisplayNames([code], { type: "language" }).of(code) ?? code;
    return capitalizeFirstLetterWhenCased(raw, code);
  } catch {
    return code;
  }
}
