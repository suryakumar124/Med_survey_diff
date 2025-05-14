import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User, InsertUser, LoginData, insertUserSchema, loginSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      username: string;
      password: string;
      name: string;
      phone: string | null;
      role: string;
      status: string;
      profilePicture: string | null;
      createdAt: Date | null;
      updatedAt: Date | null;
    }
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "medical-survey-platform-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate input
      let userData: InsertUser;
      try {
        userData = insertUserSchema.parse(req.body);
      } catch (error) {
        if (error instanceof ZodError) {
          const validationError = fromZodError(error);
          return res.status(400).json({ message: validationError.message });
        }
        throw error;
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);

      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Create role-specific record
      if (userData.role === "doctor") {
        // Create doctor record
        const doctor = await storage.createDoctor({
          userId: user.id,
          specialty: req.body.specialty || null,
        });

        // Associate doctor with client if clientId is provided
        if (req.body.clientId) {
          const clientId = parseInt(req.body.clientId);
          if (!isNaN(clientId)) {
            try {
              await storage.addDoctorToClient(doctor.id, clientId);
              console.log(`Doctor ${doctor.id} associated with client ${clientId}`);
            } catch (error) {
              console.error(`Error associating doctor with client: ${error}`);
            }
          }
        }

        // Associate doctor with representative if repId is provided
        if (req.body.repId) {
          const repId = parseInt(req.body.repId);
          if (!isNaN(repId)) {
            try {
              await storage.addDoctorToRepresentative(doctor.id, repId);
              console.log(`Doctor ${doctor.id} associated with representative ${repId}`);
            } catch (error) {
              console.error(`Error associating doctor with representative: ${error}`);
            }
          }
        }
      } else if (userData.role === "client") {
        await storage.createClient({
          userId: user.id,
          companyName: req.body.companyName || userData.name,
        });
      } else if (userData.role === "rep") {
        if (!req.body.clientId) {
          return res.status(400).json({ message: "Client ID is required for representatives" });
        }
        await storage.createRepresentative({
          userId: user.id,
          clientId: req.body.clientId,
        });
      }

      // Log in user
      req.login(user, (err) => {
        if (err) return next(err);
        // Return user without password

        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
  try {
    // Validate login data
    loginSchema.parse(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ message: validationError.message });
    }
    return next(error);
  }

  passport.authenticate("local", async (err: Error, user: User, info: any) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ message: info?.message || "Invalid credentials" });
    }
    
    // Need to wrap req.login in a promise since it's callback-based
    const loginPromise = new Promise<void>((resolve, reject) => {
      req.login(user, (loginErr) => {
        if (loginErr) reject(loginErr);
        else resolve();
      });
    });

    try {
      await loginPromise;
      
      // Update user status to active if doctor role and not already active
      if (user.role === 'doctor' && user.status !== 'active') {
        try {
          await storage.updateUser(user.id, { status: 'active' });
          user.status = 'active';
        } catch (updateError) {
          console.error('Error updating doctor status:', updateError);
          // Continue with login even if status update fails
        }
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    } catch (loginError) {
      return next(loginError);
    }
  })(req, res, next);
});
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const userWithRole = await storage.getUserWithRole(req.user.id);
      if (!userWithRole) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't send the password to the client
      const { password, ...userWithoutPassword } = userWithRole;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Server error fetching user details" });
    }
  });
}
