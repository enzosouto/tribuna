import { relations } from "drizzle-orm";
import {
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const matchStatusEnum = pgEnum("match_status", [
  "SCHEDULED",
  "TIMED",
  "LIVE",
  "FINISHED",
  "POSTPONED",
  "CANCELLED",
]);

export const matchEventTypeEnum = pgEnum("match_event_type", [
  "GOAL",
  "OWN_GOAL",
  "PENALTY_GOAL",
  "PENALTY_MISSED",
  "YELLOW_CARD",
  "RED_CARD",
  "SUBSTITUTION",
  "VAR",
]);

export const lineupRoleEnum = pgEnum("lineup_role", ["STARTER", "SUBSTITUTE", "COACH"]);

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const userStatusEnum = pgEnum("user_status", ["active", "banned"]);

export const notificationTypeEnum = pgEnum("notification_type", ["FOLLOW"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    username: text("username").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").notNull().default("user"),
    status: userStatusEnum("status").notNull().default("active"),
    bannedAt: timestamp("banned_at", { withTimezone: true }),
    passwordResetToken: text("password_reset_token"),
    passwordResetExpiresAt: timestamp("password_reset_expires_at", { withTimezone: true }),
    avatarUrl: text("avatar_url"),
    bio: text("bio"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    usernameUnique: uniqueIndex("users_username_unique").on(t.username),
    emailUnique: uniqueIndex("users_email_unique").on(t.email),
    resetTokenIdx: index("users_password_reset_token_idx").on(t.passwordResetToken),
  }),
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdIdx: index("sessions_user_id_idx").on(t.userId),
  }),
);

export const teams = pgTable(
  "teams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider"),
    externalId: text("external_id"),
    name: text("name").notNull(),
    shortName: text("short_name"),
    crestUrl: text("crest_url"),
    country: text("country"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    providerExternalUnique: uniqueIndex("teams_provider_external_unique").on(
      t.provider,
      t.externalId,
    ),
  }),
);

export const competitions = pgTable(
  "competitions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider"),
    externalId: text("external_id"),
    name: text("name").notNull(),
    code: text("code"),
    emblemUrl: text("emblem_url"),
    country: text("country"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    providerExternalUnique: uniqueIndex("competitions_provider_external_unique").on(
      t.provider,
      t.externalId,
    ),
  }),
);

export const seasons = pgTable(
  "seasons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    competitionId: uuid("competition_id")
      .notNull()
      .references(() => competitions.id, { onDelete: "cascade" }),
    year: text("year").notNull(),
    startDate: timestamp("start_date", { withTimezone: true }),
    endDate: timestamp("end_date", { withTimezone: true }),
  },
  (t) => ({
    competitionYearUnique: uniqueIndex("seasons_competition_year_unique").on(
      t.competitionId,
      t.year,
    ),
  }),
);

export const matches = pgTable(
  "matches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider"),
    externalId: text("external_id"),
    homeTeamId: uuid("home_team_id")
      .notNull()
      .references(() => teams.id),
    awayTeamId: uuid("away_team_id")
      .notNull()
      .references(() => teams.id),
    homeScore: integer("home_score"),
    awayScore: integer("away_score"),
    competitionId: uuid("competition_id")
      .notNull()
      .references(() => competitions.id),
    seasonId: uuid("season_id").references(() => seasons.id),
    round: text("round"),
    stadium: text("stadium"),
    dateTime: timestamp("date_time", { withTimezone: true }).notNull(),
    status: matchStatusEnum("status").notNull().default("SCHEDULED"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    providerExternalUnique: uniqueIndex("matches_provider_external_unique").on(
      t.provider,
      t.externalId,
    ),
    dateTimeIdx: index("matches_date_time_idx").on(t.dateTime),
    statusIdx: index("matches_status_idx").on(t.status),
    competitionIdx: index("matches_competition_idx").on(t.competitionId),
  }),
);

export const matchEvents = pgTable(
  "match_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    type: matchEventTypeEnum("type").notNull(),
    minute: integer("minute"),
    teamId: uuid("team_id").references(() => teams.id),
    playerName: text("player_name"),
    assistName: text("assist_name"),
    detail: text("detail"),
  },
  (t) => ({
    matchIdIdx: index("match_events_match_id_idx").on(t.matchId),
  }),
);

export const matchStatistics = pgTable(
  "match_statistics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id),
    possession: integer("possession"),
    shots: integer("shots"),
    shotsOnTarget: integer("shots_on_target"),
    corners: integer("corners"),
    fouls: integer("fouls"),
    yellowCards: integer("yellow_cards"),
    redCards: integer("red_cards"),
    offsides: integer("offsides"),
  },
  (t) => ({
    matchTeamUnique: uniqueIndex("match_statistics_match_team_unique").on(t.matchId, t.teamId),
  }),
);

export const matchLineups = pgTable(
  "match_lineups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id),
    playerName: text("player_name").notNull(),
    shirtNumber: integer("shirt_number"),
    position: text("position"),
    role: lineupRoleEnum("role").notNull().default("STARTER"),
  },
  (t) => ({
    matchIdIdx: index("match_lineups_match_id_idx").on(t.matchId),
  }),
);

export const ratings = pgTable(
  "ratings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    value: numeric("value", { precision: 2, scale: 1 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userMatchUnique: uniqueIndex("ratings_user_match_unique").on(t.userId, t.matchId),
  }),
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    rating: numeric("rating", { precision: 2, scale: 1 }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userMatchUnique: uniqueIndex("reviews_user_match_unique").on(t.userId, t.matchId),
    matchIdIdx: index("reviews_match_id_idx").on(t.matchId),
  }),
);

export const reviewLikes = pgTable(
  "review_likes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reviewId: uuid("review_id")
      .notNull()
      .references(() => reviews.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    reviewUserUnique: uniqueIndex("review_likes_review_user_unique").on(t.reviewId, t.userId),
  }),
);

export const follows = pgTable(
  "follows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    followerId: uuid("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followingId: uuid("following_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    followerFollowingUnique: uniqueIndex("follows_follower_following_unique").on(
      t.followerId,
      t.followingId,
    ),
  }),
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    recipientCreatedIdx: index("notifications_recipient_created_idx").on(
      t.recipientId,
      t.createdAt,
    ),
  }),
);

export const watchlist = pgTable(
  "watchlist",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userMatchUnique: uniqueIndex("watchlist_user_match_unique").on(t.userId, t.matchId),
  }),
);

export const favorites = pgTable(
  "favorites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userMatchUnique: uniqueIndex("favorites_user_match_unique").on(t.userId, t.matchId),
  }),
);

export const lists = pgTable("lists", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  coverUrl: text("cover_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const listMatches = pgTable(
  "list_matches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listId: uuid("list_id")
      .notNull()
      .references(() => lists.id, { onDelete: "cascade" }),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    listMatchUnique: uniqueIndex("list_matches_list_match_unique").on(t.listId, t.matchId),
  }),
);

export const usersRelations = relations(users, ({ many }) => ({
  ratings: many(ratings),
  reviews: many(reviews),
  followers: many(follows, { relationName: "following" }),
  following: many(follows, { relationName: "follower" }),
  watchlist: many(watchlist),
  lists: many(lists),
  notifications: many(notifications, { relationName: "recipient" }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  recipient: one(users, {
    fields: [notifications.recipientId],
    references: [users.id],
    relationName: "recipient",
  }),
  actor: one(users, { fields: [notifications.actorId], references: [users.id] }),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  homeTeam: one(teams, { fields: [matches.homeTeamId], references: [teams.id] }),
  awayTeam: one(teams, { fields: [matches.awayTeamId], references: [teams.id] }),
  competition: one(competitions, {
    fields: [matches.competitionId],
    references: [competitions.id],
  }),
  season: one(seasons, { fields: [matches.seasonId], references: [seasons.id] }),
  events: many(matchEvents),
  statistics: many(matchStatistics),
  lineups: many(matchLineups),
  ratings: many(ratings),
  reviews: many(reviews),
}));

export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
  match: one(matches, { fields: [reviews.matchId], references: [matches.id] }),
  likes: many(reviewLikes),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.followerId],
    references: [users.id],
    relationName: "follower",
  }),
  following: one(users, {
    fields: [follows.followingId],
    references: [users.id],
    relationName: "following",
  }),
}));

export const listsRelations = relations(lists, ({ one, many }) => ({
  author: one(users, { fields: [lists.userId], references: [users.id] }),
  matches: many(listMatches),
}));
