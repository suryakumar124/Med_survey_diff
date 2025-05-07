import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { LoginData, insertSurveySchema, insertSurveyQuestionSchema, insertRedemptionSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized: Please log in" });
  };

  // Middleware to check if user has specific role
  const hasRole = (roles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized: Please log in" });
      }
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
      }
      next();
    };
  };

  // Client Routes
  app.get("/api/clients", isAuthenticated, async (req, res) => {
    try {
      const clients = await storage.getAllClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", isAuthenticated, async (req, res) => {
    try {
      const client = await storage.getClient(parseInt(req.params.id));
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  // Representative Routes
  app.get("/api/representatives", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role === "client") {
        const client = await storage.getClientByUserId(req.user.id);
        if (client) {
          const representatives = await storage.getRepresentativesByClientId(client.id);
          return res.json(representatives);
        }
      }
      
      // Admins can see all representatives
      if (req.user.role === "admin") {
        const representatives = await storage.getRepresentativesByClientId(parseInt(req.query.clientId as string) || 0);
        return res.json(representatives);
      }
      
      res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch representatives" });
    }
  });

  app.get("/api/representatives/:id", isAuthenticated, async (req, res) => {
    try {
      const representative = await storage.getRepresentative(parseInt(req.params.id));
      if (!representative) {
        return res.status(404).json({ message: "Representative not found" });
      }
      
      // Check permissions
      if (req.user.role === "client") {
        const client = await storage.getClientByUserId(req.user.id);
        if (!client || client.id !== representative.clientId) {
          return res.status(403).json({ message: "Forbidden: Not your representative" });
        }
      }
      
      res.json(representative);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch representative" });
    }
  });

  // Doctor Routes
  app.get("/api/doctors", isAuthenticated, async (req, res) => {
    try {
      let doctors = [];
      
      if (req.user.role === "client") {
        const client = await storage.getClientByUserId(req.user.id);
        if (client) {
          doctors = await storage.getDoctorsByClientId(client.id);
        }
      } else if (req.user.role === "rep") {
        const rep = await storage.getRepresentativeByUserId(req.user.id);
        if (rep) {
          doctors = await storage.getDoctorsByRepId(rep.id);
        }
      } else if (req.user.role === "admin") {
        doctors = await storage.getAllDoctors();
      } else {
        return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
      }
      
      // Enrich doctor data with user info
      const enrichedDoctors = await Promise.all(
        doctors.map(async (doctor) => {
          const user = await storage.getUser(doctor.userId);
          return { ...doctor, user };
        })
      );
      
      res.json(enrichedDoctors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch doctors" });
    }
  });

  app.get("/api/doctors/:id", isAuthenticated, async (req, res) => {
    try {
      const doctor = await storage.getDoctor(parseInt(req.params.id));
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }
      
      // Check permissions
      if (req.user.role === "doctor" && req.user.id !== doctor.userId) {
        return res.status(403).json({ message: "Forbidden: Not your profile" });
      }
      
      // Get associated user info
      const user = await storage.getUser(doctor.userId);
      if (!user) {
        return res.status(404).json({ message: "Doctor user not found" });
      }
      
      // Return doctor with user info
      const { password, ...userWithoutPassword } = user;
      res.json({ ...doctor, user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch doctor" });
    }
  });

  // Survey Routes
  app.get("/api/surveys", isAuthenticated, async (req, res) => {
    try {
      let surveys = [];
      
      if (req.user.role === "client") {
        const client = await storage.getClientByUserId(req.user.id);
        if (client) {
          surveys = await storage.getSurveysByClientId(client.id);
        }
      } else if (req.user.role === "doctor") {
        const doctor = await storage.getDoctorByUserId(req.user.id);
        if (doctor) {
          surveys = await storage.getSurveysForDoctor(doctor.id);
        }
      } else if (req.user.role === "admin") {
        // Admin can filter by client
        if (req.query.clientId) {
          surveys = await storage.getSurveysByClientId(parseInt(req.query.clientId as string));
        } else {
          // Get all surveys from all clients
          const clients = await storage.getAllClients();
          for (const client of clients) {
            const clientSurveys = await storage.getSurveysByClientId(client.id);
            surveys = [...surveys, ...clientSurveys];
          }
        }
      } else if (req.user.role === "rep") {
        const rep = await storage.getRepresentativeByUserId(req.user.id);
        if (rep) {
          surveys = await storage.getSurveysByClientId(rep.clientId);
        }
      }
      
      // Enrich survey data with response stats
      const enrichedSurveys = await Promise.all(
        surveys.map(async (survey) => {
          const responses = await storage.getDoctorSurveyResponsesBySurveyId(survey.id);
          const completedResponses = responses.filter(response => response.completed);
          return {
            ...survey,
            responseCount: responses.length,
            completedCount: completedResponses.length,
            completionRate: responses.length > 0 ? (completedResponses.length / responses.length) * 100 : 0
          };
        })
      );
      
      res.json(enrichedSurveys);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch surveys" });
    }
  });

  app.post("/api/surveys", hasRole(["client", "admin"]), async (req, res) => {
    try {
      // Validate survey data
      let surveyData;
      try {
        surveyData = insertSurveySchema.parse(req.body);
      } catch (error) {
        if (error instanceof ZodError) {
          const validationError = fromZodError(error);
          return res.status(400).json({ message: validationError.message });
        }
        throw error;
      }
      
      // If client is creating, use their client ID
      if (req.user.role === "client") {
        const client = await storage.getClientByUserId(req.user.id);
        if (!client) {
          return res.status(404).json({ message: "Client not found" });
        }
        surveyData.clientId = client.id;
      }
      
      // Create survey
      const survey = await storage.createSurvey(surveyData);
      
      // Create survey questions if provided
      if (req.body.questions && Array.isArray(req.body.questions)) {
        for (let i = 0; i < req.body.questions.length; i++) {
          const questionData = {
            ...req.body.questions[i],
            surveyId: survey.id,
            orderIndex: i
          };
          
          try {
            const validatedQuestion = insertSurveyQuestionSchema.parse(questionData);
            await storage.createSurveyQuestion(validatedQuestion);
          } catch (error) {
            if (error instanceof ZodError) {
              // Just log validation errors for questions
              console.error(`Question validation error: ${error.message}`);
            } else {
              throw error;
            }
          }
        }
      }
      
      res.status(201).json(survey);
    } catch (error) {
      res.status(500).json({ message: "Failed to create survey" });
    }
  });

  app.get("/api/surveys/:id", isAuthenticated, async (req, res) => {
    try {
      const surveyId = parseInt(req.params.id);
      const survey = await storage.getSurvey(surveyId);
      if (!survey) {
        return res.status(404).json({ message: "Survey not found" });
      }
      
      // Check permissions
      if (req.user.role === "client") {
        const client = await storage.getClientByUserId(req.user.id);
        if (!client || client.id !== survey.clientId) {
          return res.status(403).json({ message: "Forbidden: Not your survey" });
        }
      } else if (req.user.role === "doctor") {
        const doctor = await storage.getDoctorByUserId(req.user.id);
        if (!doctor) {
          return res.status(403).json({ message: "Forbidden: Doctor not found" });
        }
        
        // Check if doctor has access to this survey
        const doctorSurveys = await storage.getSurveysForDoctor(doctor.id);
        if (!doctorSurveys.some(s => s.id === surveyId)) {
          return res.status(403).json({ message: "Forbidden: Survey not available" });
        }
      } else if (req.user.role === "rep") {
        const rep = await storage.getRepresentativeByUserId(req.user.id);
        if (!rep || rep.clientId !== survey.clientId) {
          return res.status(403).json({ message: "Forbidden: Not your client's survey" });
        }
      }
      
      // Get survey questions
      const questions = await storage.getSurveyQuestionsBySurveyId(surveyId);
      
      // Get response stats
      const responses = await storage.getDoctorSurveyResponsesBySurveyId(surveyId);
      const completedResponses = responses.filter(r => r.completed);
      
      // Return survey with questions and stats
      res.json({
        ...survey,
        questions,
        responseCount: responses.length,
        completedCount: completedResponses.length,
        completionRate: responses.length > 0 ? (completedResponses.length / responses.length) * 100 : 0
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch survey" });
    }
  });

  // Survey Response Routes
  app.post("/api/surveys/:id/responses", hasRole(["doctor"]), async (req, res) => {
    try {
      const surveyId = parseInt(req.params.id);
      const survey = await storage.getSurvey(surveyId);
      if (!survey) {
        return res.status(404).json({ message: "Survey not found" });
      }
      
      // Get doctor
      const doctor = await storage.getDoctorByUserId(req.user.id);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }
      
      // Check if doctor already completed this survey
      const existingResponses = await storage.getDoctorSurveyResponsesByDoctorId(doctor.id);
      const existingResponse = existingResponses.find(r => r.surveyId === surveyId && r.completed);
      if (existingResponse) {
        return res.status(400).json({ message: "Survey already completed" });
      }
      
      // Create or update survey response
      let response = existingResponses.find(r => r.surveyId === surveyId && !r.completed);
      if (!response) {
        // New response
        response = await storage.createDoctorSurveyResponse({
          doctorId: doctor.id,
          surveyId,
          completed: true,
          pointsEarned: survey.points
        });
      } else {
        // Update existing response
        response = await storage.updateDoctorSurveyResponse(response.id, {
          completed: true,
          pointsEarned: survey.points
        });
      }
      
      // Save question responses
      if (req.body.responses && Array.isArray(req.body.responses)) {
        for (const questionResponse of req.body.responses) {
          await storage.createQuestionResponse({
            doctorSurveyResponseId: response.id,
            questionId: questionResponse.questionId,
            responseData: JSON.stringify(questionResponse.data)
          });
        }
      }
      
      // Update doctor's points
      await storage.updateDoctor(doctor.id, {
        totalPoints: doctor.totalPoints + survey.points
      });
      
      res.status(201).json(response);
    } catch (error) {
      res.status(500).json({ message: "Failed to submit survey response" });
    }
  });

  app.get("/api/surveys/:id/responses", hasRole(["client", "admin"]), async (req, res) => {
    try {
      const surveyId = parseInt(req.params.id);
      const survey = await storage.getSurvey(surveyId);
      if (!survey) {
        return res.status(404).json({ message: "Survey not found" });
      }
      
      // Check permissions
      if (req.user.role === "client") {
        const client = await storage.getClientByUserId(req.user.id);
        if (!client || client.id !== survey.clientId) {
          return res.status(403).json({ message: "Forbidden: Not your survey" });
        }
      }
      
      // Get all responses for this survey
      const responses = await storage.getDoctorSurveyResponsesBySurveyId(surveyId);
      
      // Enrich with doctor info
      const enrichedResponses = await Promise.all(
        responses.map(async (response) => {
          const doctor = await storage.getDoctor(response.doctorId);
          const user = doctor ? await storage.getUser(doctor.userId) : null;
          
          // Get question responses
          const questionResponses = await storage.getQuestionResponsesByDoctorSurveyResponseId(response.id);
          
          return {
            ...response,
            doctor: doctor ? {
              ...doctor,
              user: user ? { 
                id: user.id,
                name: user.name,
                email: user.email,
                username: user.username,
                specialty: doctor.specialty
              } : null
            } : null,
            questionResponses
          };
        })
      );
      
      res.json(enrichedResponses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch survey responses" });
    }
  });

  // Doctor Points Routes
  app.get("/api/doctors/:id/points", isAuthenticated, async (req, res) => {
    try {
      const doctorId = parseInt(req.params.id);
      const doctor = await storage.getDoctor(doctorId);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }
      
      // Check permissions
      if (req.user.role === "doctor" && doctor.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden: Not your profile" });
      }
      
      // Get redemption history
      const redemptions = await storage.getRedemptionsByDoctorId(doctorId);
      
      // Calculate available points
      const availablePoints = doctor.totalPoints - doctor.redeemedPoints;
      
      res.json({
        totalPoints: doctor.totalPoints,
        redeemedPoints: doctor.redeemedPoints,
        availablePoints,
        redemptions
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch points information" });
    }
  });

  app.post("/api/doctors/:id/redeem", hasRole(["doctor"]), async (req, res) => {
    try {
      const doctorId = parseInt(req.params.id);
      const doctor = await storage.getDoctor(doctorId);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }
      
      // Check permissions
      if (doctor.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden: Not your profile" });
      }
      
      // Validate redemption data
      let redemptionData;
      try {
        redemptionData = insertRedemptionSchema.parse({
          ...req.body,
          doctorId
        });
      } catch (error) {
        if (error instanceof ZodError) {
          const validationError = fromZodError(error);
          return res.status(400).json({ message: validationError.message });
        }
        throw error;
      }
      
      // Check if doctor has enough points
      const availablePoints = doctor.totalPoints - doctor.redeemedPoints;
      if (availablePoints < redemptionData.points) {
        return res.status(400).json({ message: "Insufficient points" });
      }
      
      // Create redemption record
      const redemption = await storage.createRedemption(redemptionData);
      
      // Update doctor's redeemed points
      await storage.updateDoctor(doctor.id, {
        redeemedPoints: doctor.redeemedPoints + redemptionData.points
      });
      
      res.status(201).json(redemption);
    } catch (error) {
      res.status(500).json({ message: "Failed to process redemption" });
    }
  });

  // Doctor Assignment Routes
  app.post("/api/representatives/:id/doctors", hasRole(["client", "admin"]), async (req, res) => {
    try {
      const repId = parseInt(req.params.id);
      const rep = await storage.getRepresentative(repId);
      if (!rep) {
        return res.status(404).json({ message: "Representative not found" });
      }
      
      // Check permissions
      if (req.user.role === "client") {
        const client = await storage.getClientByUserId(req.user.id);
        if (!client || client.id !== rep.clientId) {
          return res.status(403).json({ message: "Forbidden: Not your representative" });
        }
      }
      
      // Validate request body
      if (!req.body.doctorId) {
        return res.status(400).json({ message: "Doctor ID is required" });
      }
      
      const doctorId = parseInt(req.body.doctorId);
      const doctor = await storage.getDoctor(doctorId);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }
      
      // Add mapping
      const success = await storage.addDoctorToRepresentative(doctorId, repId);
      if (!success) {
        return res.status(500).json({ message: "Failed to assign doctor to representative" });
      }
      
      // Also ensure doctor is assigned to the client
      await storage.addDoctorToClient(doctorId, rep.clientId);
      
      res.status(200).json({ message: "Doctor assigned successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to assign doctor" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
