import { z } from "zod";

export default function apiBasedTools(server) {
  const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000/api";

  // Helper function to make HTTP requests
  async function makeRequest(method, url, data = null, options = {}) {
    const config = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    // Merge other options except headers (which we already handled)
    const { headers: _, ...otherOptions } = options;
    Object.assign(config, otherOptions);

    if (data) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);
      const result = await response.text();

      let jsonResult;
      try {
        jsonResult = JSON.parse(result);
      } catch {
        jsonResult = result;
      }

      return {
        status: response.status,
        data: jsonResult,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (error) {
      return {
        status: 0,
        error: error.message,
      };
    }
  }

  // Issues Tools

  server.registerTool(
    "issues-list",
    {
      title: "List Issues",
      description: "Get a list of issues with optional filtering",
      inputSchema: {
        status: z
          .enum(["not_started", "in_progress", "done"])
          .optional()
          .describe("Filter by status"),
        assigned_user_id: z
          .string()
          .optional()
          .describe("Filter by assigned user ID"),
        tag_ids: z.string().optional().describe("Comma-separated tag IDs"),
        search: z
          .string()
          .optional()
          .describe("Search in title and description"),
        page: z.number().optional().describe("Page number (default: 1)"),
        limit: z
          .number()
          .optional()
          .describe("Items per page (default: 10, max: 100)"),
        priority: z
          .enum(["low", "medium", "high"])
          .optional()
          .describe("Filter by priority"),
        created_by_user_id: z
          .string()
          .optional()
          .describe("Filter by creator user ID"),
        apiKey: z.string().describe("API key for authentication"),
      },
    },
    async (params) => {
      const { apiKey, ...queryParams } = params;
      const searchParams = new URLSearchParams();

      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value);
        }
      });

      const url = `${API_BASE_URL}/issues${
        searchParams.toString() ? `?${searchParams.toString()}` : ""
      }`;

      const result = await makeRequest("GET", url, null, {
        headers: { "x-api-key": apiKey },
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  server.registerTool(
    "issues-create",
    {
      title: "Create Issue",
      description: "Create a new issue",
      inputSchema: {
        title: z.string().describe("Issue title"),
        description: z.string().optional().describe("Issue description"),
        status: z
          .enum(["not_started", "in_progress", "done"])
          .optional()
          .describe("Issue status"),
        priority: z
          .enum(["low", "medium", "high", "urgent"])
          .optional()
          .describe("Issue priority"),
        assigned_user_id: z.string().optional().describe("Assigned user ID"),
        tag_ids: z.array(z.number()).optional().describe("Array of tag IDs"),
        apiKey: z.string().describe("API key for authentication"),
      },
    },
    async (params) => {
      const { apiKey, ...issueData } = params;

      const result = await makeRequest(
        "POST",
        `${API_BASE_URL}/issues`,
        issueData,
        { headers: { "x-api-key": apiKey } }
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  server.registerTool(
    "issues-get",
    {
      title: "Get Issue by ID",
      description: "Get a specific issue by its ID",
      inputSchema: {
        id: z.number().describe("Issue ID"),
        apiKey: z.string().describe("API key for authentication"),
      },
    },
    async ({ id, apiKey }) => {
      const result = await makeRequest(
        "GET",
        `${API_BASE_URL}/issues/${id}`,
        null,
        { headers: { "x-api-key": apiKey } }
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  server.registerTool(
    "issues-update",
    {
      title: "Update Issue",
      description: "Update an existing issue",
      inputSchema: {
        id: z.number().describe("Issue ID"),
        title: z.string().optional().describe("Issue title"),
        description: z.string().optional().describe("Issue description"),
        status: z
          .enum(["not_started", "in_progress", "done"])
          .optional()
          .describe("Issue status"),
        priority: z
          .enum(["low", "medium", "high"])
          .optional()
          .describe("Issue priority"),
        assigned_user_id: z.string().optional().describe("Assigned user ID"),
        tag_ids: z.array(z.number()).optional().describe("Array of tag IDs"),
        apiKey: z.string().describe("API key for authentication"),
      },
    },
    async (params) => {
      const { id, apiKey, ...updateData } = params;

      const result = await makeRequest(
        "PUT",
        `${API_BASE_URL}/issues/${id}`,
        updateData,
        { headers: { "x-api-key": apiKey } }
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  server.registerTool(
    "issues-delete",
    {
      title: "Delete Issue",
      description: "Delete an issue by ID",
      inputSchema: {
        id: z.number().describe("Issue ID"),
        apiKey: z.string().describe("API key for authentication"),
      },
    },
    async ({ id, apiKey }) => {
      const result = await makeRequest(
        "DELETE",
        `${API_BASE_URL}/issues/${id}`,
        null,
        { headers: { "x-api-key": apiKey } }
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  // Tags Tools

  server.registerTool(
    "tags-list",
    {
      title: "List Tags",
      description: "Get all available tags",
      inputSchema: {
        apiKey: z.string().describe("API key for authentication"),
      },
    },
    async ({ apiKey }) => {
      const result = await makeRequest("GET", `${API_BASE_URL}/tags`, null, {
        headers: { "x-api-key": apiKey },
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  server.registerTool(
    "tags-create",
    {
      title: "Create Tag",
      description: "Create a new tag",
      inputSchema: {
        name: z.string().describe("Tag name"),
        color: z.string().describe("Tag color (hex format)"),
        apiKey: z.string().describe("API key for authentication"),
      },
    },
    async (params) => {
      const { apiKey, ...tagData } = params;

      const result = await makeRequest(
        "POST",
        `${API_BASE_URL}/tags`,
        tagData,
        { headers: { "x-api-key": apiKey } }
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  server.registerTool(
    "tags-delete",
    {
      title: "Delete Tag",
      description: "Delete a tag by ID",
      inputSchema: {
        id: z.number().describe("Tag ID"),
        apiKey: z.string().describe("API key for authentication"),
      },
    },
    async ({ id, apiKey }) => {
      const result = await makeRequest(
        "DELETE",
        `${API_BASE_URL}/tags/${id}`,
        null,
        { headers: { "x-api-key": apiKey } }
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  // Users Tools

  server.registerTool(
    "users-list",
    {
      title: "List Users",
      description: "Get all users",
      inputSchema: {
        apiKey: z.string().describe("API key for authentication"),
      },
    },
    async ({ apiKey }) => {
      const result = await makeRequest("GET", `${API_BASE_URL}/users`, null, {
        headers: { "x-api-key": apiKey },
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  // API Key Tools

  server.registerTool(
    "api-key-verify",
    {
      title: "Verify API Key",
      description: "Verify if an API key is valid",
      inputSchema: {
        apiKey: z.string().describe("API key to verify"),
      },
    },
    async ({ apiKey }) => {
      const result = await makeRequest(
        "POST",
        `${API_BASE_URL}/auth/api-key/verify`,
        { key: apiKey }
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  // Health Check Tools

  server.registerTool(
    "health-status",
    {
      title: "Health Status",
      description: "Get the health status of the API",
    },
    async () => {
      const result = await makeRequest(
        "GET",
        `${API_BASE_URL.replace("/api", "")}/health`
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  server.registerTool(
    "health-ready",
    {
      title: "Readiness Probe",
      description: "Check if the API is ready to serve requests",
    },
    async () => {
      const result = await makeRequest(
        "GET",
        `${API_BASE_URL.replace("/api", "")}/health/ready`
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  server.registerTool(
    "health-live",
    {
      title: "Liveness Probe",
      description: "Check if the API is alive",
    },
    async () => {
      const result = await makeRequest(
        "GET",
        `${API_BASE_URL.replace("/api", "")}/health/live`
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  server.registerTool(
    "issues-standup",
    {
      title: "Generate Standup Report",
      description:
        "Fetches all issues and formats them into a human-readable daily standup report grouped by status and sorted by priority. Optionally filter by assigned user.",
      inputSchema: {
        assigned_user_id: z
          .string()
          .optional()
          .describe("Filter standup to a specific user's issues"),
        apiKey: z.string().describe("API key for authentication"),
      },
    },
    async ({ assigned_user_id, apiKey }) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const priorityEmoji = { urgent: "🔴", high: "🟠", medium: "🟡", low: "🟢" };

      const params = new URLSearchParams({ limit: "100" });
      if (assigned_user_id) params.append("assigned_user_id", assigned_user_id);

      const result = await makeRequest(
        "GET",
        `${API_BASE_URL}/issues?${params.toString()}`,
        null,
        { headers: { "x-api-key": apiKey } }
      );

      if (result.status !== 200 || !result.data?.data) {
        return {
          content: [{ type: "text", text: `Failed to fetch issues:\n${JSON.stringify(result, null, 2)}` }],
        };
      }

      const issues = result.data.data;
      const byStatus = { done: [], in_progress: [], not_started: [] };

      for (const issue of issues) {
        const bucket = byStatus[issue.status] ?? byStatus.not_started;
        bucket.push(issue);
      }

      for (const bucket of Object.values(byStatus)) {
        bucket.sort(
          (a, b) =>
            (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99)
        );
      }

      const fmt = (list) =>
        list.length === 0
          ? "  _None_"
          : list
              .map(
                (i) =>
                  `  ${priorityEmoji[i.priority] ?? "⚪"} [#${i.id}] ${i.title}${i.assigned_user_id ? ` _(${i.assigned_user_id})_` : ""}`
              )
              .join("\n");

      const today = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const report = [
        `# Standup Report — ${today}`,
        "",
        `## ✅ Done (${byStatus.done.length})`,
        fmt(byStatus.done),
        "",
        `## 🔧 In Progress (${byStatus.in_progress.length})`,
        fmt(byStatus.in_progress),
        "",
        `## 📋 Not Started (${byStatus.not_started.length})`,
        fmt(byStatus.not_started),
        "",
        `---`,
        `_Total: ${issues.length} issue(s)${assigned_user_id ? ` for user \`${assigned_user_id}\`` : ""}_`,
      ].join("\n");

      return {
        content: [{ type: "text", text: report }],
      };
    }
  );

  server.registerTool(
    "issues-changelog",
    {
      title: "Generate Changelog",
      description:
        "Fetches all done issues and formats them as a release changelog grouped by tags. Ideal for generating release notes. Optionally scope to a version label.",
      inputSchema: {
        version: z
          .string()
          .optional()
          .describe("Version label to include in the changelog header (e.g. v1.2.0)"),
        apiKey: z.string().describe("API key for authentication"),
      },
    },
    async ({ version, apiKey }) => {
      const [issuesResult, tagsResult] = await Promise.all([
        makeRequest("GET", `${API_BASE_URL}/issues?status=done&limit=100`, null, {
          headers: { "x-api-key": apiKey },
        }),
        makeRequest("GET", `${API_BASE_URL}/tags`, null, {
          headers: { "x-api-key": apiKey },
        }),
      ]);

      if (issuesResult.status !== 200 || !issuesResult.data?.data) {
        return {
          content: [{ type: "text", text: `Failed to fetch issues:\n${JSON.stringify(issuesResult, null, 2)}` }],
        };
      }

      const issues = issuesResult.data.data;
      const tagMap = {};
      if (tagsResult.status === 200 && Array.isArray(tagsResult.data)) {
        for (const tag of tagsResult.data) {
          tagMap[tag.id] = tag.name;
        }
      }

      // Group issues by their first tag; untagged issues go to "General"
      const groups = {};
      for (const issue of issues) {
        const tagName =
          issue.tags?.length > 0
            ? (tagMap[issue.tags[0].id] ?? issue.tags[0].name ?? "General")
            : "General";

        if (!groups[tagName]) groups[tagName] = [];
        groups[tagName].push(issue);
      }

      const priorityEmoji = { urgent: "🔴", high: "🟠", medium: "🟡", low: "🟢" };
      const releaseDate = new Date().toISOString().split("T")[0];
      const heading = version
        ? `# Changelog — ${version} (${releaseDate})`
        : `# Changelog — ${releaseDate}`;

      const sections = Object.entries(groups)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([tag, list]) => {
          const lines = list.map(
            (i) => `- ${priorityEmoji[i.priority] ?? "⚪"} ${i.title} ([#${i.id}])`
          );
          return `## ${tag}\n${lines.join("\n")}`;
        });

      const summary = `_${issues.length} issue(s) shipped_`;
      const changelog = [heading, "", ...sections, "", "---", summary].join("\n");

      return {
        content: [{ type: "text", text: changelog }],
      };
    }
  );
}
