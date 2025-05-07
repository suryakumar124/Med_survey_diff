import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { db } from "./db";
import { 
  users, doctors, clients, representatives, 
  User, Doctor, Client, Representative
} from "@shared/schema";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seedUsers() {
  console.log("Seeding database with initial users...");
  
  // Check if users exist already
  const existingUsers = await db.select().from(users);
  if (existingUsers.length > 0) {
    console.log(`Database already has ${existingUsers.length} users. Skipping seed.`);
    return;
  }

  const password = await hashPassword("password123");
  
  // Create Admin User
  const [adminUser] = await db.insert(users).values({
    email: "admin@example.com",
    username: "admin1",
    password,
    name: "Admin User",
    phone: "+1234567890",
    role: "admin",
    status: "active",
    profilePicture: null
  }).returning();
  
  console.log(`Created admin user: ${adminUser.username}`);
  
  // Create Doctor User
  const [doctorUser] = await db.insert(users).values({
    email: "doctor@example.com",
    username: "doctor1",
    password,
    name: "Dr. Jane Smith",
    phone: "+1234567891",
    role: "doctor",
    status: "active",
    profilePicture: null
  }).returning();
  
  // Create Doctor profile
  const [doctorProfile] = await db.insert(doctors).values({
    userId: doctorUser.id,
    specialty: "Cardiology",
    totalPoints: 0,
    redeemedPoints: 0
  }).returning();
  
  console.log(`Created doctor user: ${doctorUser.username}`);
  
  // Create Client User
  const [clientUser] = await db.insert(users).values({
    email: "client@example.com",
    username: "client1",
    password,
    name: "John Client",
    phone: "+1234567892",
    role: "client",
    status: "active",
    profilePicture: null
  }).returning();
  
  // Create Client profile
  const [clientProfile] = await db.insert(clients).values({
    userId: clientUser.id,
    companyName: "MediPharm Inc."
  }).returning();
  
  console.log(`Created client user: ${clientUser.username}`);
  
  // Create Rep User
  const [repUser] = await db.insert(users).values({
    email: "rep@example.com",
    username: "rep1",
    password,
    name: "Sam Representative",
    phone: "+1234567893",
    role: "rep",
    status: "active",
    profilePicture: null
  }).returning();
  
  // Create Rep profile
  const [repProfile] = await db.insert(representatives).values({
    userId: repUser.id,
    clientId: clientProfile.id
  }).returning();
  
  console.log(`Created rep user: ${repUser.username}`);
  
  console.log("Database seeding completed successfully.");
}

// This will be called from index.ts
export { seedUsers };