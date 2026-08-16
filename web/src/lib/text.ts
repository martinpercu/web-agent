export function stripToolCalls(text: string): string {
  const cleaned = text
    .replace(/<tool_[a-z_]*\b[^>]*>[\s\S]*?<\/tool_[a-z_]*>/g, "")
    .replace(/<tool_[a-z_]*\b[^>]*>/g, "")
    .replace(/<\/tool_[a-z_]*>/g, "")
    .replace(/^[A-Za-z][A-Za-z0-9_]*`[^\n]*\n[\s\S]*?^`[^\n]*$/gm, "")
    .replace(/<tool_use>[\s\S]*?<\/tool_use>/g, "")
    .replace(/<entry>[\s\S]*?<\/entry>/g, "")
    .replace(/<parameter\b[^>]*>[\s\S]*?<\/parameter>/g, "")
    .replace(/<summary>[\s\S]*?<\/summary>/g, "")
    .replace(/<description>[\s\S]*?<\/description>/g, "")
    .replace(/<invoke\b[\s\S]*?<\/invoke>/g, "")
    .replace(/<[a-z_]+:parameter\b[^>]*>[\s\S]*?<\/[a-z_]+:parameter>/g, "")
    .replace(/<[a-z_]+:[a-z_]+(\s[^>]*)?>[\s\S]*?<\/[a-z_]+:[a-z_]+>/g, "")
    .replace(/<[a-z_]+:[a-z_]+(\s[^>]*)?\/?>/g, "")
    .replace(/<\/[a-z_]+:[a-z_]+>/g, "");

  const lines = cleaned.split("\n");
  const out: string[] = [];
  let inTool = false;
  for (const raw of lines) {
    const line = raw.trim();
    const isTagOnly = /^<\/?[^<>]*>$/.test(line);
    const isClose = isTagOnly && line.startsWith("</");
    const isToolOpen =
      isTagOnly &&
      !isClose &&
      !line.includes("</") &&
      (/[:|｜]/.test(line.slice(1, -1)) ||
        /^<(parameter|invoke|tool_|summary|description|entry|name|tool_use)\b/i.test(line));

    if (inTool) {
      if (isClose) inTool = false;
      continue;
    }
    if (isToolOpen) {
      inTool = true;
      continue;
    }
    if (isTagOnly) continue;
    out.push(raw);
  }

  return out.join("\n").replace(/[ \t]*\n{2,}[ \t]*/g, "\n\n").trim();
}