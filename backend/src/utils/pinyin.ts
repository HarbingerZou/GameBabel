import { pinyin } from "pinyin-pro";

export function toPinyinName(name: string): string {
  if (!name) return name;
  const hasChinese = /[一-鿿]/.test(name);
  if (!hasChinese) return name;

  const parts = pinyin(name, {
    toneType: "none",
    nonZh: "consecutive",
    type: "array",
  });

  return parts
    .map((p) => (p ? p.charAt(0).toUpperCase() + p.slice(1) : p))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
