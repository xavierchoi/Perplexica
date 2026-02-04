import { sql } from 'drizzle-orm';
import { text, integer, sqliteTable, index } from 'drizzle-orm/sqlite-core';
import { Block } from '../types';
import { SearchSources } from '../agents/search/types';

export const messages = sqliteTable(
  'messages',
  {
    id: integer('id').primaryKey(),
    messageId: text('messageId').notNull(),
    chatId: text('chatId').notNull(),
    backendId: text('backendId').notNull(),
    query: text('query').notNull(),
    createdAt: text('createdAt').notNull(),
    responseBlocks: text('responseBlocks', { mode: 'json' })
      .$type<Block[]>()
      .default(sql`'[]'`),
    status: text({ enum: ['answering', 'completed', 'error'] }).default(
      'answering',
    ),
  },
  (table) => ({
    chatIdIdx: index('messages_chat_id_idx').on(table.chatId),
    messageIdIdx: index('messages_message_id_idx').on(table.messageId),
    backendIdIdx: index('messages_backend_id_idx').on(table.backendId),
  }),
);

interface DBFile {
  name: string;
  fileId: string;
}

export const spaces = sqliteTable(
  'spaces',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    createdAt: text('createdAt').notNull(),
    userId: text('userId'), // 멀티유저 대비
  },
  (table) => ({
    userIdIdx: index('spaces_user_id_idx').on(table.userId),
  }),
);

export const chats = sqliteTable(
  'chats',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    createdAt: text('createdAt').notNull(),
    spaceId: text('spaceId').references(() => spaces.id, {
      onDelete: 'set null',
    }),
    sources: text('sources', {
      mode: 'json',
    })
      .$type<SearchSources[]>()
      .default(sql`'[]'`),
    files: text('files', { mode: 'json' })
      .$type<DBFile[]>()
      .default(sql`'[]'`),
    shareId: text('shareId'),
    isPublic: integer('isPublic', { mode: 'boolean' }).default(false),
    userId: text('userId'), // 멀티유저 대비
  },
  (table) => ({
    spaceIdIdx: index('chats_space_id_idx').on(table.spaceId),
    shareIdIdx: index('chats_share_id_idx').on(table.shareId),
    userIdIdx: index('chats_user_id_idx').on(table.userId),
  }),
);

export type MemoryType = 'preference' | 'fact' | 'instruction';

export const memories = sqliteTable(
  'memories',
  {
    id: text('id').primaryKey(),
    type: text('type').$type<MemoryType>().notNull(),
    content: text('content').notNull(),
    keywords: text('keywords', { mode: 'json' })
      .$type<string[]>()
      .default(sql`'[]'`),
    createdAt: text('createdAt').notNull(),
    updatedAt: text('updatedAt').notNull(),
    isActive: integer('isActive', { mode: 'boolean' }).default(true),
    userId: text('userId'), // 멀티유저 대비
  },
  (table) => ({
    typeIdx: index('memories_type_idx').on(table.type),
    isActiveIdx: index('memories_is_active_idx').on(table.isActive),
    userIdIdx: index('memories_user_id_idx').on(table.userId),
  }),
);

export type TaskScheduleType = 'once' | 'daily' | 'weekly' | 'monthly' | 'cron';
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';

export const tasks = sqliteTable(
  'tasks',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    query: text('query').notNull(),
    scheduleType: text('scheduleType').$type<TaskScheduleType>().notNull(),
    cronExpression: text('cronExpression'),
    spaceId: text('spaceId').references(() => spaces.id, {
      onDelete: 'set null',
    }),
    isActive: integer('isActive', { mode: 'boolean' }).default(true),
    lastRunAt: text('lastRunAt'),
    nextRunAt: text('nextRunAt'),
    createdAt: text('createdAt').notNull(),
    updatedAt: text('updatedAt').notNull(),
    userId: text('userId'), // 멀티유저 대비
  },
  (table) => ({
    spaceIdIdx: index('tasks_space_id_idx').on(table.spaceId),
    isActiveIdx: index('tasks_is_active_idx').on(table.isActive),
    nextRunAtIdx: index('tasks_next_run_at_idx').on(table.nextRunAt),
    userIdIdx: index('tasks_user_id_idx').on(table.userId),
  }),
);

export const taskResults = sqliteTable(
  'task_results',
  {
    id: text('id').primaryKey(),
    taskId: text('taskId')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    status: text('status').$type<TaskStatus>().notNull(),
    resultSummary: text('resultSummary'),
    sources: text('sources', { mode: 'json' })
      .$type<{ title: string; url: string }[]>()
      .default(sql`'[]'`),
    error: text('error'),
    startedAt: text('startedAt').notNull(),
    completedAt: text('completedAt'),
  },
  (table) => ({
    taskIdIdx: index('task_results_task_id_idx').on(table.taskId),
    statusIdx: index('task_results_status_idx').on(table.status),
  }),
);
