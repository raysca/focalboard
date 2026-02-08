import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

// -- Better Auth tables --
// These must be defined in Drizzle schema so the Drizzle adapter can find them.
// Better Auth is the source of truth for these tables.

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .notNull()
    .default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

// -- Focalboard extension: user_profiles --
// Extends Better Auth's `user` table with Focalboard-specific fields.
export const userProfiles = sqliteTable(
  "user_profiles",
  {
    userId: text("user_id").primaryKey(),
    username: text("username").notNull().default(""),
    nickname: text("nickname").notNull().default(""),
    firstName: text("first_name").notNull().default(""),
    lastName: text("last_name").notNull().default(""),
    isBot: integer("is_bot", { mode: "boolean" }).notNull().default(false),
    isGuest: integer("is_guest", { mode: "boolean" }).notNull().default(false),
    roles: text("roles").notNull().default(""),
    props: text("props", { mode: "json" })
      .notNull()
      .$type<Record<string, unknown>>()
      .default({}),
    createAt: integer("create_at", { mode: "number" }).notNull().default(0),
    updateAt: integer("update_at", { mode: "number" }).notNull().default(0),
    deleteAt: integer("delete_at", { mode: "number" }).notNull().default(0),
  },
  (table) => [index("idx_user_profiles_username").on(table.username)],
);

// -- Blocks --
export const blocks = sqliteTable(
  "blocks",
  {
    id: text("id").primaryKey(),
    parentId: text("parent_id").notNull().default(""),
    createdBy: text("created_by").notNull().default(""),
    modifiedBy: text("modified_by").notNull().default(""),
    schema: integer("schema", { mode: "number" }).notNull().default(0),
    type: text("type").notNull().default(""),
    title: text("title").notNull().default(""),
    fields: text("fields", { mode: "json" })
      .notNull()
      .$type<Record<string, unknown>>()
      .default({}),
    boardId: text("board_id").notNull().default(""),
    createAt: integer("create_at", { mode: "number" }).notNull().default(0),
    updateAt: integer("update_at", { mode: "number" }).notNull().default(0),
    deleteAt: integer("delete_at", { mode: "number" }).notNull().default(0),
  },
  (table) => [
    index("idx_blocks_board_id").on(table.boardId),
    index("idx_blocks_parent_id").on(table.parentId),
    index("idx_blocks_type").on(table.type),
    index("idx_blocks_board_id_parent_id").on(table.boardId, table.parentId),
  ],
);

// -- Blocks History --
export const blocksHistory = sqliteTable(
  "blocks_history",
  {
    id: text("id").notNull(),
    parentId: text("parent_id").notNull().default(""),
    createdBy: text("created_by").notNull().default(""),
    modifiedBy: text("modified_by").notNull().default(""),
    schema: integer("schema", { mode: "number" }).notNull().default(0),
    type: text("type").notNull().default(""),
    title: text("title").notNull().default(""),
    fields: text("fields", { mode: "json" })
      .notNull()
      .$type<Record<string, unknown>>()
      .default({}),
    boardId: text("board_id").notNull().default(""),
    createAt: integer("create_at", { mode: "number" }).notNull().default(0),
    updateAt: integer("update_at", { mode: "number" }).notNull().default(0),
    deleteAt: integer("delete_at", { mode: "number" }).notNull().default(0),
    insertAt: integer("insert_at", { mode: "number" }).notNull().default(0),
  },
  (table) => [
    index("idx_blocks_history_id").on(table.id),
    index("idx_blocks_history_board_id").on(table.boardId),
    index("idx_blocks_history_insert_at").on(table.insertAt),
  ],
);

// -- Boards --
export const boards = sqliteTable(
  "boards",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id").notNull().default(""),
    channelId: text("channel_id").notNull().default(""),
    createdBy: text("created_by").notNull().default(""),
    modifiedBy: text("modified_by").notNull().default(""),
    type: text("type").notNull().default(""),
    minimumRole: text("minimum_role").notNull().default(""),
    title: text("title").notNull().default(""),
    description: text("description").notNull().default(""),
    icon: text("icon").notNull().default(""),
    showDescription: integer("show_description", { mode: "boolean" })
      .notNull()
      .default(false),
    isTemplate: integer("is_template", { mode: "boolean" })
      .notNull()
      .default(false),
    templateVersion: integer("template_version", { mode: "number" })
      .notNull()
      .default(0),
    properties: text("properties", { mode: "json" })
      .notNull()
      .$type<Record<string, unknown>>()
      .default({}),
    cardProperties: text("card_properties", { mode: "json" })
      .notNull()
      .$type<Array<Record<string, unknown>>>()
      .default([]),
    createAt: integer("create_at", { mode: "number" }).notNull().default(0),
    updateAt: integer("update_at", { mode: "number" }).notNull().default(0),
    deleteAt: integer("delete_at", { mode: "number" }).notNull().default(0),
  },
  (table) => [
    index("idx_boards_team_id").on(table.teamId),
    index("idx_boards_channel_id").on(table.channelId),
    index("idx_boards_is_template").on(table.isTemplate),
  ],
);

// -- Boards History --
export const boardsHistory = sqliteTable(
  "boards_history",
  {
    id: text("id").notNull(),
    teamId: text("team_id").notNull().default(""),
    channelId: text("channel_id").notNull().default(""),
    createdBy: text("created_by").notNull().default(""),
    modifiedBy: text("modified_by").notNull().default(""),
    type: text("type").notNull().default(""),
    minimumRole: text("minimum_role").notNull().default(""),
    title: text("title").notNull().default(""),
    description: text("description").notNull().default(""),
    icon: text("icon").notNull().default(""),
    showDescription: integer("show_description", { mode: "boolean" })
      .notNull()
      .default(false),
    isTemplate: integer("is_template", { mode: "boolean" })
      .notNull()
      .default(false),
    templateVersion: integer("template_version", { mode: "number" })
      .notNull()
      .default(0),
    properties: text("properties", { mode: "json" })
      .notNull()
      .$type<Record<string, unknown>>()
      .default({}),
    cardProperties: text("card_properties", { mode: "json" })
      .notNull()
      .$type<Array<Record<string, unknown>>>()
      .default([]),
    createAt: integer("create_at", { mode: "number" }).notNull().default(0),
    updateAt: integer("update_at", { mode: "number" }).notNull().default(0),
    deleteAt: integer("delete_at", { mode: "number" }).notNull().default(0),
    insertAt: integer("insert_at", { mode: "number" }).notNull().default(0),
  },
  (table) => [
    index("idx_boards_history_id").on(table.id),
    index("idx_boards_history_team_id").on(table.teamId),
    index("idx_boards_history_insert_at").on(table.insertAt),
  ],
);

// -- Board Members --
export const boardMembers = sqliteTable(
  "board_members",
  {
    boardId: text("board_id").notNull(),
    userId: text("user_id").notNull(),
    roles: text("roles").notNull().default(""),
    minimumRole: text("minimum_role").notNull().default(""),
    schemeAdmin: integer("scheme_admin", { mode: "boolean" })
      .notNull()
      .default(false),
    schemeEditor: integer("scheme_editor", { mode: "boolean" })
      .notNull()
      .default(false),
    schemeCommenter: integer("scheme_commenter", { mode: "boolean" })
      .notNull()
      .default(false),
    schemeViewer: integer("scheme_viewer", { mode: "boolean" })
      .notNull()
      .default(false),
  },
  (table) => [
    index("idx_board_members_user_id").on(table.userId),
    index("idx_board_members_board_id").on(table.boardId),
  ],
);

// -- Board Members History --
export const boardMembersHistory = sqliteTable(
  "board_members_history",
  {
    boardId: text("board_id").notNull(),
    userId: text("user_id").notNull(),
    action: text("action").notNull().default(""),
    insertAt: integer("insert_at", { mode: "number" }).notNull().default(0),
  },
  (table) => [
    index("idx_board_members_history_board_id").on(table.boardId),
    index("idx_board_members_history_user_id").on(table.userId),
    index("idx_board_members_history_insert_at").on(table.insertAt),
  ],
);

// -- Categories --
export const categories = sqliteTable(
  "categories",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull().default(""),
    userId: text("user_id").notNull().default(""),
    teamId: text("team_id").notNull().default(""),
    createAt: integer("create_at", { mode: "number" }).notNull().default(0),
    updateAt: integer("update_at", { mode: "number" }).notNull().default(0),
    deleteAt: integer("delete_at", { mode: "number" }).notNull().default(0),
    collapsed: integer("collapsed", { mode: "boolean" })
      .notNull()
      .default(false),
    sortOrder: integer("sort_order", { mode: "number" }).notNull().default(0),
    sorting: text("sorting").notNull().default(""),
    type: text("type").notNull().default(""),
  },
  (table) => [
    index("idx_categories_user_id").on(table.userId),
    index("idx_categories_team_id").on(table.teamId),
    index("idx_categories_user_team").on(table.userId, table.teamId),
  ],
);

// -- Category Boards --
export const categoryBoards = sqliteTable(
  "category_boards",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().default(""),
    categoryId: text("category_id").notNull().default(""),
    boardId: text("board_id").notNull().default(""),
    hidden: integer("hidden", { mode: "boolean" }).notNull().default(false),
    createAt: integer("create_at", { mode: "number" }).notNull().default(0),
    updateAt: integer("update_at", { mode: "number" }).notNull().default(0),
    deleteAt: integer("delete_at", { mode: "number" }).notNull().default(0),
    sortOrder: integer("sort_order", { mode: "number" }).notNull().default(0),
  },
  (table) => [
    index("idx_category_boards_category_id").on(table.categoryId),
    index("idx_category_boards_board_id").on(table.boardId),
    index("idx_category_boards_user_id").on(table.userId),
  ],
);

// -- Subscriptions --
export const subscriptions = sqliteTable(
  "subscriptions",
  {
    blockType: text("block_type").notNull(),
    blockId: text("block_id").notNull(),
    subscriberType: text("subscriber_type").notNull(),
    subscriberId: text("subscriber_id").notNull(),
    notifiedAt: integer("notified_at", { mode: "number" })
      .notNull()
      .default(0),
    createAt: integer("create_at", { mode: "number" }).notNull().default(0),
    deleteAt: integer("delete_at", { mode: "number" }).notNull().default(0),
  },
  (table) => [
    index("idx_subscriptions_subscriber_id").on(table.subscriberId),
    index("idx_subscriptions_block_id").on(table.blockId),
  ],
);

// -- Notification Hints --
export const notificationHints = sqliteTable(
  "notification_hints",
  {
    blockType: text("block_type").notNull(),
    blockId: text("block_id").notNull(),
    modifiedById: text("modified_by_id").notNull().default(""),
    createAt: integer("create_at", { mode: "number" }).notNull().default(0),
    notifyAt: integer("notify_at", { mode: "number" }).notNull().default(0),
  },
  (table) => [
    index("idx_notification_hints_block_id").on(table.blockId),
    index("idx_notification_hints_notify_at").on(table.notifyAt),
  ],
);

// -- Sharing --
export const sharing = sqliteTable("sharing", {
  id: text("id").primaryKey(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
  token: text("token").notNull().default(""),
  modifiedBy: text("modified_by").notNull().default(""),
  updateAt: integer("update_at", { mode: "number" }).notNull().default(0),
});

// -- File Info --
export const fileInfo = sqliteTable(
  "file_info",
  {
    id: text("id").primaryKey(),
    createAt: integer("create_at", { mode: "number" }).notNull().default(0),
    deleteAt: integer("delete_at", { mode: "number" }).notNull().default(0),
    name: text("name").notNull().default(""),
    extension: text("extension").notNull().default(""),
    size: integer("size", { mode: "number" }).notNull().default(0),
    archived: integer("archived", { mode: "boolean" })
      .notNull()
      .default(false),
    path: text("path").notNull().default(""),
  },
  (table) => [index("idx_file_info_create_at").on(table.createAt)],
);

// -- Preferences --
export const preferences = sqliteTable(
  "preferences",
  {
    userId: text("userid").notNull(),
    category: text("category").notNull(),
    name: text("name").notNull(),
    value: text("value").notNull().default(""),
  },
  (table) => [
    index("idx_preferences_user_id").on(table.userId),
    index("idx_preferences_category").on(table.category),
  ],
);

// -- Teams --
export const teams = sqliteTable("teams", {
  id: text("id").primaryKey(),
  title: text("title").notNull().default(""),
  signupToken: text("signup_token").notNull().default(""),
  settings: text("settings", { mode: "json" })
    .notNull()
    .$type<Record<string, unknown>>()
    .default({}),
  modifiedBy: text("modified_by").notNull().default(""),
  updateAt: integer("update_at", { mode: "number" }).notNull().default(0),
});

// -- System Settings --
export const systemSettings = sqliteTable("system_settings", {
  id: text("id").primaryKey(),
  value: text("value").notNull().default(""),
});

// -- Card Dependencies --
export const cardDependencies = sqliteTable(
  "card_dependencies",
  {
    id: text("id").primaryKey(),
    sourceCardId: text("source_card_id").notNull(),
    targetCardId: text("target_card_id").notNull(),
    dependencyType: text("dependency_type").notNull(), // 'blocks' | 'blocked_by' | 'related' | 'duplicate' | 'parent' | 'child'
    createdBy: text("created_by").notNull(),
    createdAt: integer("created_at", { mode: "number" }).notNull(),
    updatedAt: integer("updated_at", { mode: "number" }).notNull(),
    deletedAt: integer("deleted_at", { mode: "number" }).notNull().default(0),
    boardId: text("board_id").notNull(),
    metadata: text("metadata", { mode: "json" })
      .$type<Record<string, unknown>>()
      .default({}),
  },
  (table) => [
    index("idx_card_deps_source").on(table.sourceCardId, table.deletedAt),
    index("idx_card_deps_target").on(table.targetCardId, table.deletedAt),
    index("idx_card_deps_board").on(table.boardId, table.deletedAt),
    index("idx_card_deps_type").on(table.dependencyType, table.deletedAt),
    index("idx_card_deps_inverse").on(
      table.targetCardId,
      table.sourceCardId,
      table.dependencyType,
      table.deletedAt
    ),
  ]
);
