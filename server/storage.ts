import {
  User, InsertUser, Doctor, InsertDoctor, Client, InsertClient,
  Representative, InsertRepresentative, Survey, InsertSurvey,
  SurveyQuestion, InsertSurveyQuestion, DoctorSurveyResponse,
  InsertDoctorSurveyResponse, QuestionResponse, InsertQuestionResponse,
  Redemption, InsertRedemption, UserWithRole
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

const MemoryStore = createMemoryStore(session);

// Interface for storage operations
export interface IStorage {
  // Session store
  sessionStore: session.Store;

  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getUserWithRole(id: number): Promise<UserWithRole | undefined>;

  // Doctor operations
  getDoctor(id: number): Promise<Doctor | undefined>;
  getDoctorByUserId(userId: number): Promise<Doctor | undefined>;
  createDoctor(doctor: InsertDoctor): Promise<Doctor>;
  updateDoctor(id: number, doctor: Partial<Doctor>): Promise<Doctor | undefined>;
  getAllDoctors(): Promise<Doctor[]>;
  getDoctorsByClientId(clientId: number): Promise<Doctor[]>;
  getDoctorsByRepId(repId: number): Promise<Doctor[]>;

  // Client operations
  getClient(id: number): Promise<Client | undefined>;
  getClientByUserId(userId: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<Client>): Promise<Client | undefined>;
  getAllClients(): Promise<Client[]>;

  // Representative operations
  getRepresentative(id: number): Promise<Representative | undefined>;
  getRepresentativeByUserId(userId: number): Promise<Representative | undefined>;
  createRepresentative(representative: InsertRepresentative): Promise<Representative>;
  updateRepresentative(id: number, representative: Partial<Representative>): Promise<Representative | undefined>;
  getRepresentativesByClientId(clientId: number): Promise<Representative[]>;

  // Survey operations
  getSurvey(id: number): Promise<Survey | undefined>;
  createSurvey(survey: InsertSurvey): Promise<Survey>;
  updateSurvey(id: number, survey: Partial<Survey>): Promise<Survey | undefined>;
  getSurveysByClientId(clientId: number): Promise<Survey[]>;
  getSurveysForDoctor(doctorId: number): Promise<Survey[]>;

  // Survey Question operations
  getSurveyQuestion(id: number): Promise<SurveyQuestion | undefined>;
  createSurveyQuestion(question: InsertSurveyQuestion): Promise<SurveyQuestion>;
  updateSurveyQuestion(id: number, question: Partial<SurveyQuestion>): Promise<SurveyQuestion | undefined>;
  getSurveyQuestionsBySurveyId(surveyId: number): Promise<SurveyQuestion[]>;
  deleteSurveyQuestion(id: number): Promise<boolean>;


  // Doctor Survey Response operations
  getDoctorSurveyResponse(id: number): Promise<DoctorSurveyResponse | undefined>;
  createDoctorSurveyResponse(response: InsertDoctorSurveyResponse): Promise<DoctorSurveyResponse>;
  updateDoctorSurveyResponse(id: number, response: Partial<DoctorSurveyResponse>): Promise<DoctorSurveyResponse | undefined>;
  getDoctorSurveyResponsesByDoctorId(doctorId: number): Promise<DoctorSurveyResponse[]>;
  getDoctorSurveyResponsesBySurveyId(surveyId: number): Promise<DoctorSurveyResponse[]>;

  // Question Response operations
  getQuestionResponse(id: number): Promise<QuestionResponse | undefined>;
  createQuestionResponse(response: InsertQuestionResponse): Promise<QuestionResponse>;
  updateQuestionResponse(id: number, response: Partial<QuestionResponse>): Promise<QuestionResponse | undefined>;
  getQuestionResponsesByDoctorSurveyResponseId(doctorSurveyResponseId: number): Promise<QuestionResponse[]>;

  // Redemption operations
  getRedemption(id: number): Promise<Redemption | undefined>;
  createRedemption(redemption: InsertRedemption): Promise<Redemption>;
  updateRedemption(id: number, redemption: Partial<Redemption>): Promise<Redemption | undefined>;
  getRedemptionsByDoctorId(doctorId: number): Promise<Redemption[]>;

  // Mapping operations
  addDoctorToClient(doctorId: number, clientId: number): Promise<boolean>;
  removeDoctorFromClient(doctorId: number, clientId: number): Promise<boolean>;
  addDoctorToRepresentative(doctorId: number, representativeId: number): Promise<boolean>;
  removeDoctorFromRepresentative(doctorId: number, representativeId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  sessionStore: session.Store;
  private users: Map<number, User>;
  private doctors: Map<number, Doctor>;
  private clients: Map<number, Client>;
  private representatives: Map<number, Representative>;
  private surveys: Map<number, Survey>;
  private surveyQuestions: Map<number, SurveyQuestion>;
  private doctorSurveyResponses: Map<number, DoctorSurveyResponse>;
  private questionResponses: Map<number, QuestionResponse>;
  private redemptions: Map<number, Redemption>;
  private doctorClientMappings: Map<string, boolean>;
  private doctorRepMappings: Map<string, boolean>;

  private userId: number = 1;
  private doctorId: number = 1;
  private clientId: number = 1;
  private representativeId: number = 1;
  private surveyId: number = 1;
  private surveyQuestionId: number = 1;
  private doctorSurveyResponseId: number = 1;
  private questionResponseId: number = 1;
  private redemptionId: number = 1;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    this.users = new Map();
    this.doctors = new Map();
    this.clients = new Map();
    this.representatives = new Map();
    this.surveys = new Map();
    this.surveyQuestions = new Map();
    this.doctorSurveyResponses = new Map();
    this.questionResponses = new Map();
    this.redemptions = new Map();
    this.doctorClientMappings = new Map();
    this.doctorRepMappings = new Map();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userId++;
    const timestamp = new Date();
    const newUser: User = {
      ...user,
      id,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const updatedUser: User = {
      ...user,
      ...userData,
      updatedAt: new Date(),
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUserWithRole(id: number): Promise<UserWithRole | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    let roleDetails: Doctor | Client | Representative | undefined;

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
    return this.doctors.get(id);
  }

  async getDoctorByUserId(userId: number): Promise<Doctor | undefined> {
    return Array.from(this.doctors.values()).find(
      (doctor) => doctor.userId === userId
    );
  }

  async createDoctor(doctor: InsertDoctor): Promise<Doctor> {
    const id = this.doctorId++;
    const timestamp = new Date();
    const newDoctor: Doctor = {
      ...doctor,
      id,
      totalPoints: 0,
      redeemedPoints: 0,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    this.doctors.set(id, newDoctor);
    return newDoctor;
  }

  async updateDoctor(id: number, doctorData: Partial<Doctor>): Promise<Doctor | undefined> {
    const doctor = await this.getDoctor(id);
    if (!doctor) return undefined;

    const updatedDoctor: Doctor = {
      ...doctor,
      ...doctorData,
      updatedAt: new Date(),
    };

    this.doctors.set(id, updatedDoctor);
    return updatedDoctor;
  }

  async getAllDoctors(): Promise<Doctor[]> {
    return Array.from(this.doctors.values());
  }

  async getDoctorsByClientId(clientId: number): Promise<Doctor[]> {
    const doctors = await this.getAllDoctors();
    return doctors.filter(doctor =>
      this.doctorClientMappings.has(`${doctor.id}-${clientId}`)
    );
  }

  async getDoctorsByRepId(repId: number): Promise<Doctor[]> {
    const doctors = await this.getAllDoctors();
    return doctors.filter(doctor =>
      this.doctorRepMappings.has(`${doctor.id}-${repId}`)
    );
  }

  // Client operations
  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getClientByUserId(userId: number): Promise<Client | undefined> {
    return Array.from(this.clients.values()).find(
      (client) => client.userId === userId
    );
  }

  async createClient(client: InsertClient): Promise<Client> {
    const id = this.clientId++;
    const timestamp = new Date();
    const newClient: Client = {
      ...client,
      id,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    this.clients.set(id, newClient);
    return newClient;
  }

  async updateClient(id: number, clientData: Partial<Client>): Promise<Client | undefined> {
    const client = await this.getClient(id);
    if (!client) return undefined;

    const updatedClient: Client = {
      ...client,
      ...clientData,
      updatedAt: new Date(),
    };

    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async getAllClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  // Representative operations
  async getRepresentative(id: number): Promise<Representative | undefined> {
    return this.representatives.get(id);
  }

  async getRepresentativeByUserId(userId: number): Promise<Representative | undefined> {
    return Array.from(this.representatives.values()).find(
      (rep) => rep.userId === userId
    );
  }

  async createRepresentative(representative: InsertRepresentative): Promise<Representative> {
    const id = this.representativeId++;
    const timestamp = new Date();
    const newRepresentative: Representative = {
      ...representative,
      id,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    this.representatives.set(id, newRepresentative);
    return newRepresentative;
  }

  async updateRepresentative(id: number, repData: Partial<Representative>): Promise<Representative | undefined> {
    const rep = await this.getRepresentative(id);
    if (!rep) return undefined;

    const updatedRep: Representative = {
      ...rep,
      ...repData,
      updatedAt: new Date(),
    };

    this.representatives.set(id, updatedRep);
    return updatedRep;
  }

  async getRepresentativesByClientId(clientId: number): Promise<Representative[]> {
    return Array.from(this.representatives.values()).filter(
      (rep) => rep.clientId === clientId
    );
  }

  // Survey operations
  async getSurvey(id: number): Promise<Survey | undefined> {
    return this.surveys.get(id);
  }

  async createSurvey(survey: InsertSurvey): Promise<Survey> {
    const id = this.surveyId++;
    const timestamp = new Date();
    const newSurvey: Survey = {
      ...survey,
      id,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    this.surveys.set(id, newSurvey);
    return newSurvey;
  }

  async updateSurvey(id: number, surveyData: Partial<Survey>): Promise<Survey | undefined> {
    const survey = await this.getSurvey(id);
    if (!survey) return undefined;

    const updatedSurvey: Survey = {
      ...survey,
      ...surveyData,
      updatedAt: new Date(),
    };

    this.surveys.set(id, updatedSurvey);
    return updatedSurvey;
  }

  async getSurveysByClientId(clientId: number): Promise<Survey[]> {
    return Array.from(this.surveys.values()).filter(
      (survey) => survey.clientId === clientId
    );
  }

  async getSurveysForDoctor(doctorId: number): Promise<Survey[]> {
    // Get all surveys from clients the doctor is associated with
    const doctor = await this.getDoctor(doctorId);
    if (!doctor) return [];

    const allSurveys = Array.from(this.surveys.values());
    const clientSurveys = allSurveys.filter(survey => {
      return this.doctorClientMappings.has(`${doctorId}-${survey.clientId}`);
    });

    return clientSurveys;
  }

  // Survey Question operations
  async getSurveyQuestion(id: number): Promise<SurveyQuestion | undefined> {
    return this.surveyQuestions.get(id);
  }

  async createSurveyQuestion(question: InsertSurveyQuestion): Promise<SurveyQuestion> {
    const id = this.surveyQuestionId++;
    const timestamp = new Date();
    const newQuestion: SurveyQuestion = {
      ...question,
      id,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    this.surveyQuestions.set(id, newQuestion);
    return newQuestion;
  }

  async updateSurveyQuestion(id: number, questionData: Partial<SurveyQuestion>): Promise<SurveyQuestion | undefined> {
    const question = await this.getSurveyQuestion(id);
    if (!question) return undefined;

    const updatedQuestion: SurveyQuestion = {
      ...question,
      ...questionData,
      updatedAt: new Date(),
    };

    this.surveyQuestions.set(id, updatedQuestion);
    return updatedQuestion;
  }

  async deleteSurveyQuestion(id: number): Promise<boolean> {
    return this.surveyQuestions.delete(id);
  }
 

  async getSurveyQuestionsBySurveyId(surveyId: number): Promise<SurveyQuestion[]> {
    return Array.from(this.surveyQuestions.values())
      .filter(question => question.surveyId === surveyId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  // Doctor Survey Response operations
  async getDoctorSurveyResponse(id: number): Promise<DoctorSurveyResponse | undefined> {
    return this.doctorSurveyResponses.get(id);
  }

  async createDoctorSurveyResponse(response: InsertDoctorSurveyResponse): Promise<DoctorSurveyResponse> {
    const id = this.doctorSurveyResponseId++;
    const timestamp = new Date();
    const newResponse: DoctorSurveyResponse = {
      ...response,
      id,
      startedAt: timestamp,
      completedAt: response.completed ? timestamp : undefined
    };
    this.doctorSurveyResponses.set(id, newResponse);
    return newResponse;
  }

  async updateDoctorSurveyResponse(id: number, responseData: Partial<DoctorSurveyResponse>): Promise<DoctorSurveyResponse | undefined> {
    const response = await this.getDoctorSurveyResponse(id);
    if (!response) return undefined;

    // If completed is being set to true and it wasn't before, set completedAt
    const completedAt =
      responseData.completed && !response.completed
        ? new Date()
        : response.completedAt;

    const updatedResponse: DoctorSurveyResponse = {
      ...response,
      ...responseData,
      completedAt
    };

    this.doctorSurveyResponses.set(id, updatedResponse);
    return updatedResponse;
  }

  async getDoctorSurveyResponsesByDoctorId(doctorId: number): Promise<DoctorSurveyResponse[]> {
    return Array.from(this.doctorSurveyResponses.values()).filter(
      (response) => response.doctorId === doctorId
    );
  }

  async getDoctorSurveyResponsesBySurveyId(surveyId: number): Promise<DoctorSurveyResponse[]> {
    return Array.from(this.doctorSurveyResponses.values()).filter(
      (response) => response.surveyId === surveyId
    );
  }

  // Question Response operations
  async getQuestionResponse(id: number): Promise<QuestionResponse | undefined> {
    return this.questionResponses.get(id);
  }

  async createQuestionResponse(response: InsertQuestionResponse): Promise<QuestionResponse> {
    const id = this.questionResponseId++;
    const timestamp = new Date();
    const newResponse: QuestionResponse = {
      ...response,
      id,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    this.questionResponses.set(id, newResponse);
    return newResponse;
  }

  async updateQuestionResponse(id: number, responseData: Partial<QuestionResponse>): Promise<QuestionResponse | undefined> {
    const response = await this.getQuestionResponse(id);
    if (!response) return undefined;

    const updatedResponse: QuestionResponse = {
      ...response,
      ...responseData,
      updatedAt: new Date(),
    };

    this.questionResponses.set(id, updatedResponse);
    return updatedResponse;
  }

  async getQuestionResponsesByDoctorSurveyResponseId(doctorSurveyResponseId: number): Promise<QuestionResponse[]> {
    return Array.from(this.questionResponses.values()).filter(
      (response) => response.doctorSurveyResponseId === doctorSurveyResponseId
    );
  }

  // Redemption operations
  async getRedemption(id: number): Promise<Redemption | undefined> {
    return this.redemptions.get(id);
  }

  async createRedemption(redemption: InsertRedemption): Promise<Redemption> {
    const id = this.redemptionId++;
    const timestamp = new Date();
    const newRedemption: Redemption = {
      ...redemption,
      id,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    this.redemptions.set(id, newRedemption);
    return newRedemption;
  }

  async updateRedemption(id: number, redemptionData: Partial<Redemption>): Promise<Redemption | undefined> {
    const redemption = await this.getRedemption(id);
    if (!redemption) return undefined;

    const updatedRedemption: Redemption = {
      ...redemption,
      ...redemptionData,
      updatedAt: new Date(),
    };

    this.redemptions.set(id, updatedRedemption);
    return updatedRedemption;
  }

  async getRedemptionsByDoctorId(doctorId: number): Promise<Redemption[]> {
    return Array.from(this.redemptions.values()).filter(
      (redemption) => redemption.doctorId === doctorId
    );
  }

  // Mapping operations
  async addDoctorToClient(doctorId: number, clientId: number): Promise<boolean> {
    const doctor = await this.getDoctor(doctorId);
    const client = await this.getClient(clientId);

    if (!doctor || !client) return false;

    this.doctorClientMappings.set(`${doctorId}-${clientId}`, true);
    return true;
  }

  async removeDoctorFromClient(doctorId: number, clientId: number): Promise<boolean> {
    return this.doctorClientMappings.delete(`${doctorId}-${clientId}`);
  }

  async addDoctorToRepresentative(doctorId: number, representativeId: number): Promise<boolean> {
    const doctor = await this.getDoctor(doctorId);
    const rep = await this.getRepresentative(representativeId);

    if (!doctor || !rep) return false;

    this.doctorRepMappings.set(`${doctorId}-${representativeId}`, true);
    return true;
  }

  async removeDoctorFromRepresentative(doctorId: number, representativeId: number): Promise<boolean> {
    return this.doctorRepMappings.delete(`${doctorId}-${representativeId}`);
  }
}

// Import the DatabaseStorage
import { DatabaseStorage } from "./storage-db";

// Comment out MemStorage and use DatabaseStorage instead
// export const storage = new MemStorage();
export const storage = new DatabaseStorage();
