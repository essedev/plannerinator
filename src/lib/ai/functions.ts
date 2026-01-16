/**
 * AI Tool Definitions for OpenRouter
 *
 * These tools allow the AI assistant to interact with the application:
 * - Create, update, delete entities (tasks, events, notes, projects)
 * - Search across all entities
 * - Get statistics and insights
 *
 * Uses OpenAI-compatible function calling format for OpenRouter
 * @see https://openrouter.ai/docs/features/tool-calling
 */

export const aiTools = [
  {
    type: "function",
    function: {
      name: "create_task",
      description:
        "Create one or multiple tasks. Use this when the user wants to add tasks to their todo list. " +
        "Tasks can have titles, descriptions, due dates, priorities, and be assigned to projects.",
      parameters: {
        type: "object",
        properties: {
          tasks: {
            type: "array",
            description: "Array of tasks to create",
            items: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                  description: "Task title (required, max 200 chars)",
                },
                description: {
                  type: "string",
                  description: "Detailed task description (optional)",
                },
                dueDate: {
                  type: "string",
                  description:
                    "ISO 8601 date-time string for when the task is due (e.g., '2025-01-15T14:00:00Z'). " +
                    "Convert natural language dates like 'tomorrow', 'next week' to specific dates.",
                },
                duration: {
                  type: "number",
                  description: "Estimated duration in minutes (optional)",
                },
                priority: {
                  type: "string",
                  enum: ["low", "medium", "high", "urgent"],
                  description: "Task priority level (default: medium)",
                },
                projectName: {
                  type: "string",
                  description:
                    "Name of the project to assign this task to. Will search for matching project. " +
                    "If not found, task will be created without a project.",
                },
                tags: {
                  type: "array",
                  items: { type: "string" },
                  description: "Array of tag names to attach to this task",
                },
              },
              required: ["title"],
            },
          },
        },
        required: ["tasks"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "create_event",
      description:
        "Create one or multiple calendar events. Use this when the user wants to schedule meetings, appointments, or events. " +
        "Events must have a start time and can optionally have an end time, location, and be assigned to projects.",
      parameters: {
        type: "object",
        properties: {
          events: {
            type: "array",
            description: "Array of events to create",
            items: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                  description: "Event title (required, max 200 chars)",
                },
                description: {
                  type: "string",
                  description: "Event description with details",
                },
                startTime: {
                  type: "string",
                  description:
                    "ISO 8601 date-time string for event start (required). " +
                    "Convert 'tomorrow at 3pm' to '2025-01-15T15:00:00Z'.",
                },
                endTime: {
                  type: "string",
                  description:
                    "ISO 8601 date-time string for event end. If not provided, will use startTime + 1 hour.",
                },
                location: {
                  type: "string",
                  description:
                    "Physical or virtual location (e.g., 'Room 201', 'https://zoom.us/j/123')",
                },
                allDay: {
                  type: "boolean",
                  description: "Whether this is an all-day event (default: false)",
                },
                projectName: {
                  type: "string",
                  description:
                    "Name of project to assign this event to. Will search for matching project.",
                },
                tags: {
                  type: "array",
                  items: { type: "string" },
                  description: "Array of tag names",
                },
              },
              required: ["title", "startTime"],
            },
          },
        },
        required: ["events"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "create_note",
      description:
        "Create a note or document. Use when the user wants to save text, ideas, documentation, code snippets, or research. " +
        "Notes can be categorized by type and assigned to projects.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Note title (optional, will auto-generate from content if not provided)",
          },
          content: {
            type: "string",
            description: "The actual note content (required). Supports Markdown formatting.",
          },
          type: {
            type: "string",
            enum: ["note", "document", "research", "idea", "snippet"],
            description: "Type/category of note (default: note)",
          },
          projectName: {
            type: "string",
            description: "Project to assign this note to",
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Tags for categorization",
          },
        },
        required: ["content"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "create_project",
      description:
        "Create a new project. Projects are containers for organizing related tasks, events, and notes. " +
        "Use when the user wants to start tracking a new initiative, goal, or area of work.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Project name (required, unique identifier)",
          },
          description: {
            type: "string",
            description: "Detailed project description and goals",
          },
          status: {
            type: "string",
            enum: ["planning", "active", "on_hold", "completed", "cancelled"],
            description: "Current project status (default: active)",
          },
          color: {
            type: "string",
            description: "Color code for visual identification (e.g., '#3B82F6')",
          },
          startDate: {
            type: "string",
            description: "ISO 8601 date when project starts",
          },
          endDate: {
            type: "string",
            description: "ISO 8601 target completion date",
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Project tags",
          },
        },
        required: ["name"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "query_entities",
      description:
        "Retrieve a list of entities directly without text search. " +
        "Use when the user asks for 'all', 'latest', 'recent', or lists of items. " +
        "Examples: 'show me my notes', 'list all tasks', 'what are my recent projects'. " +
        "This is more efficient than search_entities when no specific search term is needed.",
      parameters: {
        type: "object",
        properties: {
          entityTypes: {
            type: "array",
            items: {
              type: "string",
              enum: ["task", "event", "note", "project"],
            },
            description: "Types of entities to retrieve (required)",
          },
          filters: {
            type: "object",
            description: "Optional filters to narrow results",
            properties: {
              status: {
                type: "string",
                description: "Filter by status (e.g., 'todo', 'done', 'active')",
              },
              priority: {
                type: "string",
                description: "Filter by priority (low, medium, high, urgent)",
              },
              projectName: {
                type: "string",
                description: "Filter by project name",
              },
              dateRange: {
                type: "object",
                properties: {
                  start: {
                    type: "string",
                    description: "ISO 8601 date for range start",
                  },
                  end: {
                    type: "string",
                    description: "ISO 8601 date for range end",
                  },
                },
              },
            },
          },
          sortBy: {
            type: "string",
            enum: ["createdAt", "updatedAt", "dueDate", "startTime", "title"],
            description: "Field to sort by (default: updatedAt)",
          },
          sortOrder: {
            type: "string",
            enum: ["asc", "desc"],
            description: "Sort order (default: desc for most recent first)",
          },
          limit: {
            type: "number",
            description: "Maximum number of results per entity type (default: 10, max: 50)",
          },
          includeDeleted: {
            type: "boolean",
            description:
              "Include deleted entities in results (default: false). Only set to true if user explicitly asks for deleted items.",
          },
          includeArchived: {
            type: "boolean",
            description:
              "Include archived entities in results (default: false). Only set to true if user explicitly asks for archived items.",
          },
        },
        required: ["entityTypes"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "search_entities",
      description:
        "Search across entities using a text query. " +
        "Use when the user provides a specific search term or wants to find items matching keywords. " +
        "Examples: 'find tasks about meeting', 'search notes containing API'. " +
        "For listing without search, use query_entities instead.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query string to match against titles, descriptions, and content",
          },
          entityTypes: {
            type: "array",
            items: {
              type: "string",
              enum: ["task", "event", "note", "project"],
            },
            description: "Limit search to specific entity types. If empty, searches all types.",
          },
          filters: {
            type: "object",
            description: "Additional filters to narrow results",
            properties: {
              status: {
                type: "string",
                description: "Filter by status (e.g., 'todo', 'done', 'active')",
              },
              priority: {
                type: "string",
                description: "Filter by priority (low, medium, high, urgent)",
              },
              projectName: {
                type: "string",
                description: "Filter by project name",
              },
              tags: {
                type: "array",
                items: { type: "string" },
                description: "Filter by tags (returns items with ANY of these tags)",
              },
              dateRange: {
                type: "object",
                properties: {
                  start: {
                    type: "string",
                    description: "ISO 8601 date for range start",
                  },
                  end: {
                    type: "string",
                    description: "ISO 8601 date for range end",
                  },
                },
              },
            },
          },
          limit: {
            type: "number",
            description: "Maximum number of results to return (default: 10, max: 50)",
          },
          includeDeleted: {
            type: "boolean",
            description:
              "Include deleted entities in search results (default: false). Only set to true if user explicitly asks for deleted items.",
          },
          includeArchived: {
            type: "boolean",
            description:
              "Include archived entities in search results (default: false). Only set to true if user explicitly asks for archived items.",
          },
        },
        required: ["query"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "update_task",
      description:
        "Update an existing task's properties. Use when the user wants to modify a task's title, status, due date, or priority. " +
        "Can mark tasks as complete, change priorities, reschedule, etc.",
      parameters: {
        type: "object",
        properties: {
          taskIdentifier: {
            type: "string",
            description:
              "Task ID (UUID) or partial title to identify the task. If title, will search for matches.",
          },
          updates: {
            type: "object",
            description: "Properties to update",
            properties: {
              title: {
                type: "string",
                description: "New task title",
              },
              description: {
                type: "string",
                description: "New description",
              },
              status: {
                type: "string",
                enum: ["todo", "in_progress", "done", "cancelled"],
                description: "New status. Use 'done' to mark as complete.",
              },
              dueDate: {
                type: "string",
                description: "New due date (ISO 8601)",
              },
              priority: {
                type: "string",
                enum: ["low", "medium", "high", "urgent"],
                description: "New priority level",
              },
            },
          },
        },
        required: ["taskIdentifier", "updates"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "update_event",
      description:
        "Update an existing event's properties. Use when the user wants to modify an event's title, time, location, or description. " +
        "Can reschedule events, change locations, update details, etc.",
      parameters: {
        type: "object",
        properties: {
          eventIdentifier: {
            type: "string",
            description:
              "Event ID (UUID) or partial title to identify the event. If title, will search for matches.",
          },
          updates: {
            type: "object",
            description: "Properties to update",
            properties: {
              title: {
                type: "string",
                description: "New event title",
              },
              description: {
                type: "string",
                description: "New description",
              },
              startTime: {
                type: "string",
                description: "New start time (ISO 8601)",
              },
              endTime: {
                type: "string",
                description: "New end time (ISO 8601)",
              },
              location: {
                type: "string",
                description: "New location",
              },
              allDay: {
                type: "boolean",
                description: "Whether this is an all-day event",
              },
            },
          },
        },
        required: ["eventIdentifier", "updates"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "update_note",
      description:
        "Update an existing note's properties. Use when the user wants to modify a note's title, content, or type. " +
        "Can edit note content, change titles, update categorization, etc.",
      parameters: {
        type: "object",
        properties: {
          noteIdentifier: {
            type: "string",
            description:
              "Note ID (UUID) or partial title to identify the note. If title, will search for matches.",
          },
          updates: {
            type: "object",
            description: "Properties to update",
            properties: {
              title: {
                type: "string",
                description: "New note title",
              },
              content: {
                type: "string",
                description: "New note content (supports Markdown)",
              },
              type: {
                type: "string",
                enum: ["note", "document", "research", "idea", "snippet"],
                description: "New note type/category",
              },
            },
          },
        },
        required: ["noteIdentifier", "updates"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "update_project",
      description:
        "Update an existing project's properties. Use when the user wants to modify a project's name, status, dates, or description. " +
        "Can change project status, update timelines, rename projects, etc.",
      parameters: {
        type: "object",
        properties: {
          projectIdentifier: {
            type: "string",
            description:
              "Project ID (UUID) or project name to identify the project. If name, will search for matches.",
          },
          updates: {
            type: "object",
            description: "Properties to update",
            properties: {
              name: {
                type: "string",
                description: "New project name",
              },
              description: {
                type: "string",
                description: "New project description",
              },
              status: {
                type: "string",
                enum: ["planning", "active", "on_hold", "completed", "cancelled"],
                description: "New project status",
              },
              color: {
                type: "string",
                description: "New color code (e.g., '#3B82F6')",
              },
              startDate: {
                type: "string",
                description: "New start date (ISO 8601)",
              },
              endDate: {
                type: "string",
                description: "New end date (ISO 8601)",
              },
            },
          },
        },
        required: ["projectIdentifier", "updates"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "delete_entity",
      description:
        "Delete an entity (task, event, note, or project). " +
        "IMPORTANT: Always ask for user confirmation before deleting unless they explicitly said 'delete' or 'remove'. " +
        "Deleted items are moved to trash and can be restored.",
      parameters: {
        type: "object",
        properties: {
          entityType: {
            type: "string",
            enum: ["task", "event", "note", "project"],
            description: "Type of entity to delete",
          },
          entityIdentifier: {
            type: "string",
            description:
              "Entity ID (UUID) or name/title to identify what to delete. Will search if not a UUID.",
          },
        },
        required: ["entityType", "entityIdentifier"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "get_statistics",
      description:
        "Get productivity statistics and insights. Use when the user asks questions about their progress, " +
        "completion rates, overdue items, or wants a summary of their work. " +
        "Can filter by project for project-specific stats.",
      parameters: {
        type: "object",
        properties: {
          metric: {
            type: "string",
            enum: [
              "tasks_completed_today",
              "tasks_completed_this_week",
              "tasks_completed_this_month",
              "overdue_tasks",
              "upcoming_events",
              "project_progress",
              "tasks_by_priority",
              "tasks_by_status",
            ],
            description: "The metric/statistic to retrieve",
          },
          projectName: {
            type: "string",
            description: "Optional: Filter stats by specific project name",
          },
        },
        required: ["metric"],
      },
    },
  },
];
