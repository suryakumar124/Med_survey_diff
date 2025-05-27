import {
  User, InsertUser, Doctor, InsertDoctor, Client, InsertClient,
  Representative, InsertRepresentative, Survey, InsertSurvey,
  SurveyQuestion, InsertSurveyQuestion, DoctorSurveyResponse,
  InsertDoctorSurveyResponse, QuestionResponse, InsertQuestionResponse,
  Redemption, InsertRedemption, UserWithRole,
  users, doctors, clients, representatives, surveys, surveyQuestions,
  doctorSurveyResponses, questionResponses, redemptions, doctorClientMappings,
  doctorRepMappings,
  surveyTags, surveyRedemptionOptions, SurveyTag, InsertSurveyTag,
  SurveyRedemptionOption, InsertSurveyRedemptionOption
} from "@shared/schema";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "./db";
import { IStorage } from "./storage";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db
      .insert(users)
      .values(user)
      .returning();
    return newUser;
  }



  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getUserWithRole(id: number): Promise<UserWithRole | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) return undefined;

    let roleDetails;
    if (user.role === 'doctor') {
      roleDetails = await this.getDoctorByUserId(id);
    } else if (user.role === 'client') {
      roleDetails = await this.getClientByUserId(id);
    } else if (user.role === 'rep') {
      roleDetails = await this.getRepresentativeByUserId(id);
    }

    return {
      ...user,
      roleDetails
    };
  }

  // Doctor operations
  async getDoctor(id: number): Promise<Doctor | undefined> {
    const [doctor] = await db.select().from(doctors).where(eq(doctors.id, id));
    return doctor;
  }

  async getDoctorByUserId(userId: number): Promise<Doctor | undefined> {
    const [doctor] = await db.select().from(doctors).where(eq(doctors.userId, userId));
    return doctor;
  }

  async createDoctor(doctor: InsertDoctor): Promise<Doctor> {
    const [newDoctor] = await db
      .insert(doctors)
      .values({
        ...doctor,
        totalPoints: 0,
        redeemedPoints: 0
      })
      .returning();
    return newDoctor;
  }



  async updateDoctor(id: number, doctorData: Partial<Doctor>): Promise<Doctor | undefined> {
    const [updatedDoctor] = await db
      .update(doctors)
      .set({ ...doctorData, updatedAt: new Date() })
      .where(eq(doctors.id, id))
      .returning();
    return updatedDoctor;
  }

  async getAllDoctors(): Promise<Doctor[]> {
    return db.select().from(doctors);
  }

  async getDoctorsByClientId(clientId: number): Promise<Doctor[]> {
    const mappings = await db
      .select()
      .from(doctorClientMappings)
      .where(eq(doctorClientMappings.clientId, clientId));

    if (mappings.length === 0) return [];

    const doctorIds = mappings.map(m => m.doctorId);
    return db
      .select()
      .from(doctors)
      .where(inArray(doctors.id, doctorIds));
  }

  async getDoctorsByRepId(repId: number): Promise<Doctor[]> {
    const mappings = await db
      .select()
      .from(doctorRepMappings)
      .where(eq(doctorRepMappings.representativeId, repId));

    if (mappings.length === 0) return [];

    const doctorIds = mappings.map(m => m.doctorId);
    return db
      .select()
      .from(doctors)
      .where(inArray(doctors.id, doctorIds));
  }

  // Client operations
  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async getClientByUserId(userId: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.userId, userId));
    return client;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db
      .insert(clients)
      .values(client)
      .returning();
    return newClient;
  }

  async updateClient(id: number, clientData: Partial<Client>): Promise<Client | undefined> {
    const [updatedClient] = await db
      .update(clients)
      .set({ ...clientData, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return updatedClient;
  }

  async getAllClients(): Promise<Client[]> {
    return db.select().from(clients);
  }

  // Representative operations
  async getRepresentative(id: number): Promise<Representative | undefined> {
    const [rep] = await db.select().from(representatives).where(eq(representatives.id, id));
    return rep;
  }

  async getRepresentativeByUserId(userId: number): Promise<Representative | undefined> {
    const [rep] = await db.select().from(representatives).where(eq(representatives.userId, userId));
    return rep;
  }

  async createRepresentative(representative: InsertRepresentative): Promise<Representative> {
    const [newRep] = await db
      .insert(representatives)
      .values(representative)
      .returning();
    return newRep;
  }

  async updateRepresentative(id: number, repData: Partial<Representative>): Promise<Representative | undefined> {
    const [updatedRep] = await db
      .update(representatives)
      .set({ ...repData, updatedAt: new Date() })
      .where(eq(representatives.id, id))
      .returning();
    return updatedRep;
  }

  async getRepresentativesByClientId(clientId: number): Promise<Representative[]> {
    return db
      .select()
      .from(representatives)
      .where(eq(representatives.clientId, clientId));
  }

  // Survey operations
  async getSurvey(id: number): Promise<Survey | undefined> {
    const [survey] = await db.select().from(surveys).where(eq(surveys.id, id));
    return survey;
  }

  async createSurvey(survey: InsertSurvey): Promise<Survey> {
    const [newSurvey] = await db
      .insert(surveys)
      .values(survey)
      .returning();
    return newSurvey;
  }

  async updateSurvey(id: number, surveyData: Partial<Survey>): Promise<Survey | undefined> {
    const [updatedSurvey] = await db
      .update(surveys)
      .set({ ...surveyData, updatedAt: new Date() })
      .where(eq(surveys.id, id))
      .returning();
    return updatedSurvey;
  }

  async getSurveysByClientId(clientId: number): Promise<Survey[]> {
    return db
      .select()
      .from(surveys)
      .where(eq(surveys.clientId, clientId));
  }

  async getSurveysForDoctor(doctorId: number): Promise<Survey[]> {
    // Get mappings for this doctor
    const mappings = await db
      .select()
      .from(doctorClientMappings)
      .where(eq(doctorClientMappings.doctorId, doctorId));

    if (mappings.length === 0) return [];

    // Get surveys from all clients the doctor is associated with
    const clientIds = mappings.map(m => m.clientId);
    return db
      .select()
      .from(surveys)
      .where(inArray(surveys.clientId, clientIds));
  }

  // Survey Question operations
  async getSurveyQuestion(id: number): Promise<SurveyQuestion | undefined> {
    const [question] = await db.select().from(surveyQuestions).where(eq(surveyQuestions.id, id));
    return question;
  }

  async createSurveyQuestion(question: InsertSurveyQuestion): Promise<SurveyQuestion> {
    const [newQuestion] = await db
      .insert(surveyQuestions)
      .values(question)
      .returning();
    return newQuestion;
  }

  async updateSurveyQuestion(id: number, questionData: Partial<SurveyQuestion>): Promise<SurveyQuestion | undefined> {
    const [updatedQuestion] = await db
      .update(surveyQuestions)
      .set({ ...questionData, updatedAt: new Date() })
      .where(eq(surveyQuestions.id, id))
      .returning();
    return updatedQuestion;
  }

  async getSurveyQuestionsBySurveyId(surveyId: number): Promise<SurveyQuestion[]> {
    return db
      .select()
      .from(surveyQuestions)
      .where(eq(surveyQuestions.surveyId, surveyId))
      .orderBy(surveyQuestions.orderIndex);
  }

  // Doctor Survey Response operations
  async getDoctorSurveyResponse(id: number): Promise<DoctorSurveyResponse | undefined> {
    const [response] = await db.select().from(doctorSurveyResponses).where(eq(doctorSurveyResponses.id, id));
    return response;
  }


  async createDoctorSurveyResponse(response: InsertDoctorSurveyResponse): Promise<DoctorSurveyResponse> {
    const [newResponse] = await db
      .insert(doctorSurveyResponses)
      .values({
        ...response,
        startedAt: new Date(),
        completedAt: response.completed ? new Date() : null
      })
      .returning();
    return newResponse;
  }

  async updateDoctorSurveyResponse(id: number, responseData: Partial<DoctorSurveyResponse>): Promise<DoctorSurveyResponse | undefined> {
    // If completed is being set to true and it wasn't before, set completedAt
    let completedAt = responseData.completedAt;
    if (responseData.completed) {
      const [existingResponse] = await db
        .select()
        .from(doctorSurveyResponses)
        .where(eq(doctorSurveyResponses.id, id));

      if (existingResponse && !existingResponse.completed) {
        completedAt = new Date();
      }
    }

    const [updatedResponse] = await db
      .update(doctorSurveyResponses)
      .set({ ...responseData, completedAt })
      .where(eq(doctorSurveyResponses.id, id))
      .returning();
    return updatedResponse;
  }

  async getDoctorSurveyResponsesByDoctorId(doctorId: number): Promise<DoctorSurveyResponse[]> {
    return db
      .select()
      .from(doctorSurveyResponses)
      .where(eq(doctorSurveyResponses.doctorId, doctorId));
  }

  async getDoctorSurveyResponsesBySurveyId(surveyId: number): Promise<DoctorSurveyResponse[]> {
    return db
      .select()
      .from(doctorSurveyResponses)
      .where(eq(doctorSurveyResponses.surveyId, surveyId));
  }


  async getRedemptionsByStatus(status: string): Promise<Redemption[]> {
    return db
      .select()
      .from(redemptions)
      .where(eq(redemptions.status, status));
  }
  async getRedemptionsByDoctorId(doctorId: number): Promise<Redemption[]> {
    return db
      .select()
      .from(redemptions)
      .where(eq(redemptions.doctorId, doctorId));
  }


  // Question Response operations
  async getQuestionResponse(id: number): Promise<QuestionResponse | undefined> {
    const [response] = await db.select().from(questionResponses).where(eq(questionResponses.id, id));
    return response;
  }

  async createQuestionResponse(response: InsertQuestionResponse): Promise<QuestionResponse> {
    const [newResponse] = await db
      .insert(questionResponses)
      .values(response)
      .returning();
    return newResponse;
  }

  async updateQuestionResponse(id: number, responseData: Partial<QuestionResponse>): Promise<QuestionResponse | undefined> {
    const [updatedResponse] = await db
      .update(questionResponses)
      .set({ ...responseData, updatedAt: new Date() })
      .where(eq(questionResponses.id, id))
      .returning();
    return updatedResponse;
  }

  async deleteSurveyQuestion(id: number): Promise<boolean> {
    await db
      .delete(surveyQuestions)
      .where(eq(surveyQuestions.id, id));
    return true;
  }

  // Survey Tags operations
  async getSurveyTags(surveyId: number): Promise<SurveyTag[]> {
    return db
      .select()
      .from(surveyTags)
      .where(eq(surveyTags.surveyId, surveyId));
  }

  async createSurveyTag(tag: InsertSurveyTag): Promise<SurveyTag> {
    const [newTag] = await db
      .insert(surveyTags)
      .values(tag)
      .returning();
    return newTag;
  }

  async deleteSurveyTag(surveyId: number, tag: string): Promise<boolean> {
    await db
      .delete(surveyTags)
      .where(and(
        eq(surveyTags.surveyId, surveyId),
        eq(surveyTags.tag, tag)
      ));
    return true;
  }

  // Survey Redemption Options operations
  async getSurveyRedemptionOptions(surveyId: number): Promise<SurveyRedemptionOption[]> {
    return db
      .select()
      .from(surveyRedemptionOptions)
      .where(eq(surveyRedemptionOptions.surveyId, surveyId));
  }

  async createSurveyRedemptionOption(option: InsertSurveyRedemptionOption): Promise<SurveyRedemptionOption> {
    const [newOption] = await db
      .insert(surveyRedemptionOptions)
      .values(option)
      .returning();
    return newOption;
  }

  async deleteSurveyRedemptionOption(surveyId: number, redemptionType: string): Promise<boolean> {
    await db
      .delete(surveyRedemptionOptions)
      .where(and(
        eq(surveyRedemptionOptions.surveyId, surveyId),
        eq(surveyRedemptionOptions.redemptionType, redemptionType)
      ));
    return true;
  }

  async getQuestionResponsesByDoctorSurveyResponseId(doctorSurveyResponseId: number): Promise<QuestionResponse[]> {
    return db
      .select()
      .from(questionResponses)
      .where(eq(questionResponses.doctorSurveyResponseId, doctorSurveyResponseId));
  }

  // Redemption operations
  async getRedemption(id: number): Promise<Redemption | undefined> {
    const [redemption] = await db.select().from(redemptions).where(eq(redemptions.id, id));
    return redemption;
  }

  async createRedemption(redemption: InsertRedemption): Promise<Redemption> {
    const [newRedemption] = await db
      .insert(redemptions)
      .values(redemption)
      .returning();
    return newRedemption;
  }

  async updateRedemption(id: number, redemptionData: Partial<Redemption>): Promise<Redemption | undefined> {
    const [updatedRedemption] = await db
      .update(redemptions)
      .set({ ...redemptionData, updatedAt: new Date() })
      .where(eq(redemptions.id, id))
      .returning();
    return updatedRedemption;
  }

  // async getRedemptionsByDoctorId(doctorId: number): Promise<Redemption[]> {
  //   return db
  //     .select()
  //     .from(redemptions)
  //     .where(eq(redemptions.doctorId, doctorId));
  // }

  // Mapping operations
  async addDoctorToClient(doctorId: number, clientId: number): Promise<boolean> {
    // Check if mapping already exists
    const [existingMapping] = await db
      .select()
      .from(doctorClientMappings)
      .where(and(
        eq(doctorClientMappings.doctorId, doctorId),
        eq(doctorClientMappings.clientId, clientId)
      ));

    if (existingMapping) return true; // Already exists

    await db
      .insert(doctorClientMappings)
      .values({ doctorId, clientId });
    return true;
  }

  async removeDoctorFromClient(doctorId: number, clientId: number): Promise<boolean> {
    await db
      .delete(doctorClientMappings)
      .where(and(
        eq(doctorClientMappings.doctorId, doctorId),
        eq(doctorClientMappings.clientId, clientId)
      ));
    return true;
  }

  async addDoctorToRepresentative(doctorId: number, representativeId: number): Promise<boolean> {
    // Check if mapping already exists
    const [existingMapping] = await db
      .select()
      .from(doctorRepMappings)
      .where(and(
        eq(doctorRepMappings.doctorId, doctorId),
        eq(doctorRepMappings.representativeId, representativeId)
      ));

    if (existingMapping) return true; // Already exists

    await db
      .insert(doctorRepMappings)
      .values({ doctorId, representativeId });
    return true;
  }

  async removeDoctorFromRepresentative(doctorId: number, representativeId: number): Promise<boolean> {
    await db
      .delete(doctorRepMappings)
      .where(and(
        eq(doctorRepMappings.doctorId, doctorId),
        eq(doctorRepMappings.representativeId, representativeId)
      ));
    return true;
  }
}