const MCP360_BASE = "https://connect.mcp360.ai/v1";

interface MCPResponse {
  jsonrpc: string;
  id: number;
  result?: {
    content: Array<{ type: string; text: string }>;
  };
  error?: {
    code: number;
    message: string;
  };
}

export async function callTool(
  service: string,
  toolName: string,
  args: Record<string, unknown>,
  timeoutMs = 15000
): Promise<unknown> {
  const token = process.env.MCP360_TOKEN;
  if (!token) {
    throw new Error("MCP360_TOKEN is not configured");
  }

  const url = `${MCP360_BASE}/${service}/mcp?token=${token}`;

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
        params: {
          name: toolName,
          arguments: args,
        },
      }),
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`MCP360 timeout: ${service}/${toolName} (${timeoutMs}ms)`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`MCP360 HTTP error: ${response.status} ${response.statusText}`);
  }

  const data: MCPResponse = await response.json();

  if (data.error) {
    throw new Error(`MCP360 error: ${data.error.message}`);
  }

  if (!data.result?.content?.length) {
    throw new Error("MCP360: empty response");
  }

  const textContent = data.result.content.find((c) => c.type === "text");
  if (!textContent) {
    throw new Error("MCP360: no text content in response");
  }

  try {
    return JSON.parse(textContent.text);
  } catch {
    return textContent.text;
  }
}
