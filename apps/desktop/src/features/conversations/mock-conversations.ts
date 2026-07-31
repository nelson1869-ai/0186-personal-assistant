import type { Conversation } from "../../types/chat";

export const mockConversations: Conversation[] = [
  {
    id: "weekly-plan",
    title: "Plan my week",
    updatedAt: "2026-07-31T08:30:00.000Z",
    messages: [
      {
        id: "weekly-user",
        role: "user",
        content: "Help me make a focused plan for the week.",
        status: "complete",
        createdAt: "2026-07-31T08:29:00.000Z",
      },
      {
        id: "weekly-assistant",
        role: "assistant",
        content: "Let’s start with your three most important outcomes, then protect time for each one.",
        status: "complete",
        createdAt: "2026-07-31T08:30:00.000Z",
      },
    ],
  },
  {
    id: "project-notes",
    title: "Organize project notes",
    updatedAt: "2026-07-30T15:10:00.000Z",
    messages: [
      {
        id: "notes-user",
        role: "user",
        content: "How should I structure notes for this project?",
        status: "complete",
        createdAt: "2026-07-30T15:09:00.000Z",
      },
      {
        id: "notes-assistant",
        role: "assistant",
        content: "Separate decisions, open questions, and next actions so each review has a clear purpose.",
        status: "complete",
        createdAt: "2026-07-30T15:10:00.000Z",
      },
    ],
  },
];
