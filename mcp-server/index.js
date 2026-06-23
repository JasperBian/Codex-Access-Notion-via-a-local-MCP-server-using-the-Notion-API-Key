import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API_KEY = process.env.NOTION_API_KEY;
if (!API_KEY) {
  console.error("ERROR: NOTION_API_KEY environment variable is required");
  process.exit(1);
}

const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  "Notion-Version": NOTION_VERSION,
  "Content-Type": "application/json",
};

async function notionFetch(path, options = {}) {
  const url = `${NOTION_API}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { ...headers, ...options.headers },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Notion API error ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

// Helper: extract plain text from Notion rich_text array
function extractText(richText) {
  if (!richText) return "";
  return richText.map((t) => t.plain_text).join("");
}

// Helper: format block content for display
function formatBlock(block) {
  const { type, id } = block;
  const content = block[type];
  if (!content) return `[${type}]`;

  switch (type) {
    case "paragraph":
      return extractText(content.rich_text) || "[empty paragraph]";
    case "heading_1":
      return `# ${extractText(content.rich_text)}`;
    case "heading_2":
      return `## ${extractText(content.rich_text)}`;
    case "heading_3":
      return `### ${extractText(content.rich_text)}`;
    case "bulleted_list_item":
      return `- ${extractText(content.rich_text)}`;
    case "numbered_list_item":
      return `1. ${extractText(content.rich_text)}`;
    case "to_do":
      const checked = content.checked ? "[x]" : "[ ]";
      return `${checked} ${extractText(content.rich_text)}`;
    case "toggle":
      return `> ${extractText(content.rich_text)}`;
    case "code":
      return "```" + (content.language || "") + "\n" + extractText(content.rich_text) + "\n```";
    case "callout":
      return `> **${content.icon?.emoji || ""}** ${extractText(content.rich_text)}`;
    case "quote":
      return `> ${extractText(content.rich_text)}`;
    case "divider":
      return "---";
    case "image":
      const caption = content.caption ? extractText(content.caption) : "";
      const url = content.external?.url || content.file?.url || "";
      return `![${caption}](${url})`;
    case "table":
      return `[Table: ${block.id}]`;
    case "table_row":
      const cells = content.cells.map((cell) => extractText(cell)).join(" | ");
      return `| ${cells} |`;
    case "child_page":
      return `[Subpage: ${extractText(content.title)}]`;
    case "child_database":
      return `[Database: ${extractText(content.title)}]`;
    default:
      return `[${type}: ${extractText(content?.rich_text || [])}]`;
  }
}

const server = new Server(
  { name: "notion-local-mcp", version: "1.0.0" },
  { capabilities: { tools: {}, resources: {} } }
);

// ─── TOOLS ────────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "notion_search",
      description: "Search your Notion workspace for pages and databases by query text",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query text" },
          page_size: { type: "number", description: "Max results (default 10)" },
        },
        required: ["query"],
      },
    },
    {
      name: "notion_retrieve_page",
      description: "Get the content and properties of a Notion page by ID",
      inputSchema: {
        type: "object",
        properties: {
          page_id: { type: "string", description: "32-char Notion page ID (or URL with ID)" },
          include_children: {
            type: "boolean",
            description: "Also fetch all child blocks (default true)",
          },
        },
        required: ["page_id"],
      },
    },
    {
      name: "notion_query_database",
      description: "Query a Notion database by ID with optional filters and sorts",
      inputSchema: {
        type: "object",
        properties: {
          database_id: { type: "string", description: "32-char Notion database ID" },
          filter: { type: "object", description: "Notion API filter object" },
          sorts: { type: "array", description: "Notion API sorts array" },
          page_size: { type: "number", description: "Max results (default 100)" },
        },
        required: ["database_id"],
      },
    },
    {
      name: "notion_create_page",
      description: "Create a new page under a parent page or in a database",
      inputSchema: {
        type: "object",
        properties: {
          parent_id: { type: "string", description: "Parent page or database ID" },
          parent_type: {
            type: "string",
            enum: ["page", "database"],
            description: "Parent type: 'page' or 'database'",
          },
          title: { type: "string", description: "Page title" },
          properties: { type: "object", description: "Additional Notion properties object" },
          content: {
            type: "array",
            description: "Array of Notion block objects for page content",
          },
        },
        required: ["parent_id", "parent_type", "title"],
      },
    },
    {
      name: "notion_append_blocks",
      description: "Append content blocks to an existing Notion page or block",
      inputSchema: {
        type: "object",
        properties: {
          block_id: { type: "string", description: "Block ID to append children to" },
          children: {
            type: "array",
            description: "Array of Notion block objects to append",
          },
        },
        required: ["block_id", "children"],
      },
    },
    {
      name: "notion_update_page_properties",
      description: "Update the properties of a Notion page",
      inputSchema: {
        type: "object",
        properties: {
          page_id: { type: "string", description: "Page ID to update" },
          properties: {
            type: "object",
            description: "Notion properties object with new values",
          },
        },
        required: ["page_id", "properties"],
      },
    },
  ],
}));

// ─── EXTRACT PAGE ID ──────────────────────────────────────────────────

function extractPageId(input) {
  // If it's a Notion URL, extract the ID
  const urlMatch = input.match(/([a-f0-9]{32})(?:\?|$|#)/i);
  if (urlMatch) return urlMatch[1];
  // If it's already a clean ID (with or without hyphens)
  const clean = input.replace(/-/g, "");
  if (/^[a-f0-9]{32}$/i.test(clean)) return clean;
  return input;
}

// ─── HANDLE TOOL CALLS ───────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // ── Search ──────────────────────────────────────────────────────
      case "notion_search": {
        const data = await notionFetch("/search", {
          method: "POST",
          body: JSON.stringify({
            query: args.query,
            page_size: args.page_size || 10,
          }),
        });
        const results = data.results.map((item) => ({
          id: item.id,
          type: item.object,
          title: extractText(
            item.properties?.title?.title ||
              item.properties?.Name?.title ||
              []
          ),
          url: item.url,
          last_edited: item.last_edited_time,
        }));
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      }

      // ── Retrieve Page ───────────────────────────────────────────────
      case "notion_retrieve_page": {
        const pageId = extractPageId(args.page_id);

        // Get page metadata
        const page = await notionFetch(`/pages/${pageId}`);

        // Get page content blocks
        const includeChildren = args.include_children !== false;
        let blocks = [];
        if (includeChildren) {
          const blockData = await notionFetch(
            `/blocks/${pageId}/children?page_size=100`
          );
          blocks = blockData.results;

          // Handle pagination for blocks
          let cursor = blockData.next_cursor;
          while (cursor) {
            const more = await notionFetch(
              `/blocks/${pageId}/children?page_size=100&start_cursor=${cursor}`
            );
            blocks = blocks.concat(more.results);
            cursor = more.next_cursor;
          }
        }

        // Format page info
        const title =
          extractText(
            page.properties?.title?.title ||
              page.properties?.Name?.title ||
              []
          ) || "Untitled";

        const formattedBlocks = blocks.map(formatBlock).join("\n");

        // Extract properties summary
        const propertiesSummary = {};
        for (const [key, val] of Object.entries(page.properties || {})) {
          if (val.type === "title" || val.type === "Name") continue;
          propertiesSummary[key] = formatPropertyValue(val);
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  id: page.id,
                  title,
                  url: page.url,
                  created_time: page.created_time,
                  last_edited_time: page.last_edited_time,
                  properties: propertiesSummary,
                  content: formattedBlocks,
                  blocks_raw: blocks,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // ── Query Database ──────────────────────────────────────────────
      case "notion_query_database": {
        const body = {
          page_size: args.page_size || 100,
        };
        if (args.filter) body.filter = args.filter;
        if (args.sorts) body.sorts = args.sorts;

        const data = await notionFetch(
          `/databases/${args.database_id}/query`,
          {
            method: "POST",
            body: JSON.stringify(body),
          }
        );

        const rows = data.results.map((row) => {
          const summary = { id: row.id, url: row.url };
          for (const [key, val] of Object.entries(row.properties || {})) {
            summary[key] = formatPropertyValue(val);
          }
          return summary;
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(rows, null, 2),
            },
          ],
        };
      }

      // ── Create Page ─────────────────────────────────────────────────
      case "notion_create_page": {
        const parentId = extractPageId(args.parent_id);
        const isDb = args.parent_type === "database";

        const body = {
          parent: isDb
            ? { type: "database_id", database_id: parentId }
            : { type: "page_id", page_id: parentId },
          properties: {
            title: {
              title: [{ type: "text", text: { content: args.title } }],
            },
            ...(args.properties || {}),
          },
        };

        if (args.content) {
          body.children = args.content;
        }

        const result = await notionFetch("/pages", {
          method: "POST",
          body: JSON.stringify(body),
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  id: result.id,
                  url: result.url,
                  title: args.title,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // ── Append Blocks ───────────────────────────────────────────────
      case "notion_append_blocks": {
        const result = await notionFetch(
          `/blocks/${args.block_id}/children`,
          {
            method: "PATCH",
            body: JSON.stringify({ children: args.children }),
          }
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  blocks_added: result.results?.length || 0,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // ── Update Page Properties ──────────────────────────────────────
      case "notion_update_page_properties": {
        const result = await notionFetch(
          `/pages/${extractPageId(args.page_id)}`,
          {
            method: "PATCH",
            body: JSON.stringify({ properties: args.properties }),
          }
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ success: true, id: result.id }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

// ─── HELPER: format property value ────────────────────────────────────

function formatPropertyValue(prop) {
  switch (prop.type) {
    case "title":
      return extractText(prop.title);
    case "rich_text":
      return extractText(prop.rich_text);
    case "number":
      return prop.number;
    case "select":
      return prop.select?.name || null;
    case "multi_select":
      return (prop.multi_select || []).map((s) => s.name);
    case "date":
      return prop.date?.start
        ? `${prop.date.start}${prop.date.end ? ` → ${prop.date.end}` : ""}`
        : null;
    case "checkbox":
      return prop.checkbox;
    case "url":
      return prop.url;
    case "email":
      return prop.email;
    case "phone_number":
      return prop.phone_number;
    case "status":
      return prop.status?.name || null;
    case "people":
      return (prop.people || []).map((p) => p.name || p.id);
    case "files":
      return (prop.files || []).map((f) => f.name);
    case "relation":
      return (prop.relation || []).map((r) => r.id);
    case "created_time":
      return prop.created_time;
    case "created_by":
      return prop.created_by?.name || prop.created_by?.id;
    case "last_edited_time":
      return prop.last_edited_time;
    case "last_edited_by":
      return prop.last_edited_by?.name || prop.last_edited_by?.id;
    default:
      return `[${prop.type}]`;
  }
}

// ─── START ────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
