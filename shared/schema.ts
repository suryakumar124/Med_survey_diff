import { pgTable, text, serial, integer, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Base User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  role: text("role").notNull().default("doctor"), // doctor, rep, client, admin
  status: text("status").notNull().default("pending"), // pending, active, inactive
  profilePicture: text("profile_picture"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Doctor entity
export const doctors = pgTable("doctors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  specialty: text("specialty"),
  totalPoints: integer("total_points").notNull().default(0),
  redeemedPoints: integer("redeemed_points").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Client entity (Pharma Company)
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  companyName: text("company_name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Representative entity
export const representatives = pgTable("representatives", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Doctor-Client relationship
export const doctorClientMappings = pgTable("doctor_client_mappings", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").notNull().references(() => doctors.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Doctor-Representative relationship
export const doctorRepMappings = pgTable("doctor_rep_mappings", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").notNull().references(() => doctors.id),
  representativeId: integer("representative_id").notNull().references(() => representatives.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Survey entity
export const surveys = pgTable("surveys", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  title: text("title").notNull(),
  description: text("description"),
  points: integer("points").notNull(),
  estimatedTime: integer("estimated_time").notNull(), // in minutes
  status: text("status").notNull().default("draft"), // draft, active, closed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Survey Question entity
export const surveyQuestions = pgTable("survey_questions", {
  id: serial("id").primaryKey(),
  surveyId: integer("survey_id").notNull().references(() => surveys.id),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull(), // text, scale, mcq, ranking, etc.
  options: text("options"), // JSON string for options
  required: boolean("required").notNull().default(false),
  orderIndex: integer("order_index").notNull(),
  conditionalLogic: text("conditional_logic"), // JSON string for logic
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Doctor Survey Response entity
export const doctorSurveyResponses = pgTable("doctor_survey_responses", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").notNull().references(() => doctors.id),
  surveyId: integer("survey_id").notNull().references(() => surveys.id),
  completed: boolean("completed").notNull().default(false),
  pointsEarned: integer("points_earned"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Question Response entity
export const questionResponses = pgTable("question_responses", {
  id: serial("id").primaryKey(),
  doctorSurveyResponseId: integer("doctor_survey_response_id").notNull().references(() => doctorSurveyResponses.id),
  questionId: integer("question_id").notNull().references(() => surveyQuestions.id),
  responseData: text("response_data").notNull(), // Could be text, number, or JSON string
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Redemption entity
export const redemptions = pgTable("redemptions", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").notNull().references(() => doctors.id),
  points: integer("points").notNull(),
  redemptionType: text("redemption_type").notNull(), // upi, amazon, etc.
  redemptionDetails: text("redemption_details").notNull(), // JSON string with details
  status: text("status").notNull().default("pending"), // pending, processed, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDoctorSchema = createInsertSchema(doctors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalPoints: true,
  redeemedPoints: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRepresentativeSchema = createInsertSchema(representatives).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSurveySchema = createInsertSchema(surveys).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSurveyQuestionSchema = createInsertSchema(surveyQuestions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDoctorSurveyResponseSchema = createInsertSchema(doctorSurveyResponses).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

export const insertQuestionResponseSchema = createInsertSchema(questionResponses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRedemptionSchema = createInsertSchema(redemptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Types based on schemas
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;

export type Doctor = typeof doctors.$inferSelect;
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Representative = typeof representatives.$inferSelect;
export type InsertRepresentative = z.infer<typeof insertRepresentativeSchema>;

export type Survey = typeof surveys.$inferSelect;
export type InsertSurvey = z.infer<typeof insertSurveySchema>;

export type SurveyQuestion = typeof surveyQuestions.$inferSelect;
export type InsertSurveyQuestion = z.infer<typeof insertSurveyQuestionSchema>;

export type DoctorSurveyResponse = typeof doctorSurveyResponses.$inferSelect;
export type InsertDoctorSurveyResponse = z.infer<typeof insertDoctorSurveyResponseSchema>;

export type QuestionResponse = typeof questionResponses.$inferSelect;
export type InsertQuestionResponse = z.infer<typeof insertQuestionResponseSchema>;

export type Redemption = typeof redemptions.$inferSelect;
export type InsertRedemption = z.infer<typeof insertRedemptionSchema>;

// Extended types for API responses
export type UserWithRole = User & {
  role: string;
  roleDetails?: Doctor | Client | Representative;
};

export type SurveyWithStats = Survey & {
  responseCount: number;
  completionRate: number;
};

export type DoctorWithStats = Doctor & {
  user: User;
  surveyCount: number;
  totalPoints: number;
  availablePoints: number;
};
