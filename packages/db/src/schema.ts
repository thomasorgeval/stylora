import { index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

import * as authSchema from './auth-schema.js'

const { organization, user } = authSchema

export const databaseEngine = pgEnum('database_engine', ['postgresql'])

export const databaseSslMode = pgEnum('database_ssl_mode', ['disable', 'prefer', 'require', 'verify-ca', 'verify-full'])

export const databaseConnectionTestStatus = pgEnum('database_connection_test_status', ['success', 'failure'])

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    createdByUserId: text('created_by_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('projects_organization_id_idx').on(table.organizationId),
    uniqueIndex('projects_organization_slug_idx').on(table.organizationId, table.slug),
  ],
)

export const databaseConnections = pgTable(
  'database_connections',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    engine: databaseEngine('engine').default('postgresql').notNull(),
    host: text('host').notNull(),
    port: integer('port').default(5432).notNull(),
    databaseName: text('database_name').notNull(),
    username: text('username').notNull(),
    passwordEncrypted: text('password_encrypted').notNull(),
    sslMode: databaseSslMode('ssl_mode').default('prefer').notNull(),
    connectionOptions: jsonb('connection_options').$type<Record<string, unknown>>(),
    lastTestedAt: timestamp('last_tested_at', { withTimezone: true }),
    lastTestStatus: databaseConnectionTestStatus('last_test_status'),
    createdByUserId: text('created_by_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('database_connections_project_id_idx').on(table.projectId),
    uniqueIndex('database_connections_project_name_idx').on(table.projectId, table.name),
  ],
)

export const schema = {
  ...authSchema,
  projects,
  databaseConnections,
}
