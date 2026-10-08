// Validates sanitized SVG payloads both on server and client before storage
const RULES: [RegExp, string][] = [
  [/<script[\s>/]/i, "élément <script>"],
  [/<foreignObject[\s>/]/i, "élément <foreignObject>"],
  [/<(iframe|embed|object|audio|video)[\s>/]/i, "élément embarqué"],
  [/\son[a-z]+\s*=/i, "attribut d'événement (on…)"],
  [/javascript\s*:/i, "URL javascript:"],
  [/\bdata\s*:\s*text\/html/i, "URL data:text/html"],
  [/(?:xlink:)?href\s*=\s*["']\s*(?!#)[^"'\s]/i, "lien externe (href)"],
  [/@import/i, "@import CSS"],
  [/url\(\s*["']?\s*(?!#)[^)\s]/i, "ressource externe url(…)"],
];

export function findUnsafeSvg(svg: string): string[] {
  return RULES.filter(([re]) => re.test(svg)).map(([, label]) => label);
}
