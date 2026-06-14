/**
 * Generate real, copy-pasteable code samples from an API's URL.
 * Each snippet is plain string interpolation — no template engine,
 * no highlight library; the receiving page wraps them in <pre><code>.
 */
import type { ApiSummary } from "@/types"

export interface CodeSamples {
  curl: string
  fetch: string
  python: string
  go: string
}

const HEADER = (kind: "curl" | "js" | "py" | "go"): string => {
  switch (kind) {
    case "curl": return "curl"
    case "js":   return "JavaScript"
    case "py":   return "Python"
    case "go":   return "Go"
  }
}

export function codeSamples(api: ApiSummary): Array<{
  id: keyof CodeSamples
  label: string
  code: string
}> {
  const url = api.url
  const safeUrl = url.replace(/"/g, '\\"')
  return [
    {
      id: "curl",
      label: HEADER("curl"),
      code: `curl -X GET "${safeUrl}"`,
    },
    {
      id: "fetch",
      label: HEADER("js"),
      code:
        `const res = await fetch("${safeUrl}")\n` +
        `if (!res.ok) throw new Error(\`HTTP \${res.status}\`)\n` +
        `const data = await res.json()\n` +
        `console.log(data)`,
    },
    {
      id: "python",
      label: HEADER("py"),
      code:
        `import requests\n\n` +
        `r = requests.get("${safeUrl}", timeout=10)\n` +
        `r.raise_for_status()\n` +
        `data = r.json()\n` +
        `print(data)`,
    },
    {
      id: "go",
      label: HEADER("go"),
      code:
        `package main\n\n` +
        `import (\n` +
        `\t"fmt"\n` +
        `\t"io"\n` +
        `\t"net/http"\n` +
        `)\n\n` +
        `func main() {\n` +
        `\tres, err := http.Get("${safeUrl}")\n` +
        `\tif err != nil { panic(err) }\n` +
        `\tdefer res.Body.Close()\n` +
        `\tbody, _ := io.ReadAll(res.Body)\n` +
        `\tfmt.Println(string(body))\n` +
        `}`,
    },
  ]
}
