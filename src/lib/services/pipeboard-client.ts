interface PipeboardResponse {
  jsonrpc: string;
  id: number;
  result?: {
    content?: Array<{ type: string; text: string }>;
    result?: string;
    [key: string]: unknown;
  };
  error?: {
    code: number;
    message: string;
  };
}

export async function callPipeboard(
  endpoint: string,
  toolName: string,
  args: Record<string, unknown>,
  timeoutMs = 30000
): Promise<unknown> {
  const token = process.env.PIPEBOARD_TOKEN;
  if (!token) throw new Error("PIPEBOARD_TOKEN is not configured");

  const url = `${endpoint}${endpoint.includes("?") ? "&" : "?"}token=${token}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: toolName, arguments: args },
      }),
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Pipeboard timeout: ${toolName} (${timeoutMs}ms)`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`Pipeboard HTTP error: ${response.status} ${response.statusText}`);
  }

  const data: PipeboardResponse = await response.json();

  if (data.error) {
    throw new Error(`Pipeboard error: ${data.error.message}`);
  }

  // Handle different response formats
  if (data.result?.content?.length) {
    const textContent = data.result.content.find((c) => c.type === "text");
    if (textContent) {
      try { return JSON.parse(textContent.text); } catch { return textContent.text; }
    }
  }

  if (data.result?.result) {
    try { return JSON.parse(data.result.result); } catch { return data.result.result; }
  }

  return data.result;
}

export const META_ADS_ENDPOINT = "https://mcp.pipeboard.co/meta-ads-mcp";
export const GOOGLE_ADS_ENDPOINT = "https://google-ads.mcp.pipeboard.co/";
