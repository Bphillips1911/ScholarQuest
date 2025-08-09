import { type House, type Scholar, type PointEntry, type PbisEntry, type InsertHouse, type InsertScholar, type InsertPointEntry, type InsertPbisEntry } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Houses
  getHouses(): Promise<House[]>;
  getHouse(id: string): Promise<House | undefined>;
  createHouse(house: InsertHouse): Promise<House>;
  updateHousePoints(houseId: string, category: string, points: number): Promise<void>;
  
  // Scholars
  getScholarsByHouse(houseId: string): Promise<Scholar[]>;
  getScholar(id: string): Promise<Scholar | undefined>;
  createScholar(scholar: InsertScholar): Promise<Scholar>;
  updateScholarPoints(scholarId: string, category: string, points: number): Promise<void>;
  
  // Point Entries
  getPointEntries(): Promise<PointEntry[]>;
  getPointEntriesByHouse(houseId: string): Promise<PointEntry[]>;
  createPointEntry(entry: InsertPointEntry): Promise<PointEntry>;
  
  // PBIS Entries
  getPbisEntries(): Promise<PbisEntry[]>;
  getPbisEntriesByScholar(scholarId: string): Promise<PbisEntry[]>;
  createPbisEntry(entry: InsertPbisEntry): Promise<PbisEntry>;
  getAllScholars(): Promise<Scholar[]>;
  
  // Utility
  getHouseStandings(): Promise<House[]>;
}

export class MemStorage implements IStorage {
  private houses: Map<string, House>;
  private scholars: Map<string, Scholar>;
  private pointEntries: Map<string, PointEntry>;
  private pbisEntries: Map<string, PbisEntry>;

  constructor() {
    this.houses = new Map();
    this.scholars = new Map();
    this.pointEntries = new Map();
    this.pbisEntries = new Map();
    
    // Initialize with the five houses and sample scholars
    this.initializeHouses();
    this.initializeScholars();
  }

  private initializeHouses() {
    const initialHouses: House[] = [
      {
        id: "franklin",
        name: "House of Franklin",
        color: "#DC2626",
        icon: "shield-alt",
        motto: "Leadership • Innovation • Integrity",
        academicPoints: 845,
        attendancePoints: 672,
        behaviorPoints: 968,
        memberCount: 124,
      },
      {
        id: "courie",
        name: "House of Courie",
        color: "#7C3AED",
        icon: "star",
        motto: "Courage • Determination • Excellence",
        academicPoints: 798,
        attendancePoints: 621,
        behaviorPoints: 922,
        memberCount: 118,
      },
      {
        id: "west",
        name: "House of West",
        color: "#059669",
        icon: "leaf",
        motto: "Growth • Wisdom • Collaboration",
        academicPoints: 776,
        attendancePoints: 654,
        behaviorPoints: 868,
        memberCount: 122,
      },
      {
        id: "blackwell",
        name: "House of Blackwell",
        color: "#1F2937",
        icon: "mountain",
        motto: "Strength • Perseverance • Honor",
        academicPoints: 734,
        attendancePoints: 598,
        behaviorPoints: 824,
        memberCount: 119,
      },
      {
        id: "berruguete",
        name: "House of Berruguete",
        color: "#EA580C",
        icon: "fire",
        motto: "Creativity • Passion • Innovation",
        academicPoints: 694,
        attendancePoints: 589,
        behaviorPoints: 806,
        memberCount: 117,
      },
    ];

    initialHouses.forEach(house => this.houses.set(house.id, house));
  }

  private async initializeScholars() {
    const sampleScholars = [
      { name: "Emma Johnson", studentId: "BH6001", houseId: "franklin" },
      { name: "Liam Williams", studentId: "BH6002", houseId: "courie" },
      { name: "Sophia Brown", studentId: "BH6003", houseId: "west" },
      { name: "Noah Davis", studentId: "BH6004", houseId: "blackwell" },
      { name: "Isabella Miller", studentId: "BH6005", houseId: "berruguete" },
      { name: "James Wilson", studentId: "BH7001", houseId: "franklin" },
      { name: "Olivia Moore", studentId: "BH7002", houseId: "courie" },
      { name: "Benjamin Taylor", studentId: "BH7003", houseId: "west" },
      { name: "Charlotte Anderson", studentId: "BH7004", houseId: "blackwell" },
      { name: "Alexander Thomas", studentId: "BH7005", houseId: "berruguete" },
      { name: "Mia Jackson", studentId: "BH8001", houseId: "franklin" },
      { name: "Ethan White", studentId: "BH8002", houseId: "courie" },
      { name: "Amelia Harris", studentId: "BH8003", houseId: "west" },
      { name: "Mason Martin", studentId: "BH8004", houseId: "blackwell" },
      { name: "Harper Thompson", studentId: "BH8005", houseId: "berruguete" },
    ];

    for (const scholar of sampleScholars) {
      const id = randomUUID();
      const newScholar: Scholar = {
        id,
        name: scholar.name,
        studentId: scholar.studentId,
        houseId: scholar.houseId,
        academicPoints: 0,
        attendancePoints: 0,
        behaviorPoints: 0,
        createdAt: new Date(),
      };
      this.scholars.set(id, newScholar);
    }
  }

  async getHouses(): Promise<House[]> {
    return Array.from(this.houses.values());
  }

  async getHouse(id: string): Promise<House | undefined> {
    return this.houses.get(id);
  }

  async createHouse(house: InsertHouse): Promise<House> {
    const id = randomUUID();
    const newHouse: House = {
      ...house,
      id,
      academicPoints: 0,
      attendancePoints: 0,
      behaviorPoints: 0,
      memberCount: 0,
    };
    this.houses.set(id, newHouse);
    return newHouse;
  }

  async updateHousePoints(houseId: string, category: string, points: number): Promise<void> {
    const house = this.houses.get(houseId);
    if (!house) return;

    const updatedHouse = { ...house };
    if (category === "academic") updatedHouse.academicPoints += points;
    else if (category === "attendance") updatedHouse.attendancePoints += points;
    else if (category === "behavior") updatedHouse.behaviorPoints += points;

    this.houses.set(houseId, updatedHouse);
  }

  async getScholarsByHouse(houseId: string): Promise<Scholar[]> {
    return Array.from(this.scholars.values()).filter(scholar => scholar.houseId === houseId);
  }

  async getScholar(id: string): Promise<Scholar | undefined> {
    return this.scholars.get(id);
  }

  async createScholar(scholar: InsertScholar): Promise<Scholar> {
    const id = randomUUID();
    const newScholar: Scholar = {
      ...scholar,
      id,
      academicPoints: 0,
      attendancePoints: 0,
      behaviorPoints: 0,
      createdAt: new Date(),
    };
    this.scholars.set(id, newScholar);

    // Update house member count
    const house = this.houses.get(scholar.houseId);
    if (house) {
      this.houses.set(scholar.houseId, { ...house, memberCount: house.memberCount + 1 });
    }

    return newScholar;
  }

  async updateScholarPoints(scholarId: string, category: string, points: number): Promise<void> {
    const scholar = this.scholars.get(scholarId);
    if (!scholar) return;

    const updatedScholar = { ...scholar };
    if (category === "academic") updatedScholar.academicPoints += points;
    else if (category === "attendance") updatedScholar.attendancePoints += points;
    else if (category === "behavior") updatedScholar.behaviorPoints += points;

    this.scholars.set(scholarId, updatedScholar);
  }

  async getPointEntries(): Promise<PointEntry[]> {
    return Array.from(this.pointEntries.values());
  }

  async getPointEntriesByHouse(houseId: string): Promise<PointEntry[]> {
    return Array.from(this.pointEntries.values()).filter(entry => entry.houseId === houseId);
  }

  async createPointEntry(entry: InsertPointEntry): Promise<PointEntry> {
    const id = randomUUID();
    const newEntry: PointEntry = {
      ...entry,
      id,
      scholarId: entry.scholarId || null,
      reason: entry.reason || null,
      addedBy: entry.addedBy || "admin",
      createdAt: new Date(),
    };
    this.pointEntries.set(id, newEntry);

    // Update house points
    await this.updateHousePoints(entry.houseId, entry.category, entry.points);

    // Update scholar points if scholarId provided
    if (entry.scholarId) {
      await this.updateScholarPoints(entry.scholarId, entry.category, entry.points);
    }

    return newEntry;
  }

  async getPbisEntries(): Promise<PbisEntry[]> {
    return Array.from(this.pbisEntries.values());
  }

  async getPbisEntriesByScholar(scholarId: string): Promise<PbisEntry[]> {
    return Array.from(this.pbisEntries.values()).filter(entry => entry.scholarId === scholarId);
  }

  async createPbisEntry(entry: InsertPbisEntry): Promise<PbisEntry> {
    const id = randomUUID();
    const newEntry: PbisEntry = {
      ...entry,
      id,
      reason: entry.reason || null,
      createdAt: new Date(),
    };
    this.pbisEntries.set(id, newEntry);
    return newEntry;
  }

  async getAllScholars(): Promise<Scholar[]> {
    return Array.from(this.scholars.values());
  }

  async getHouseStandings(): Promise<House[]> {
    const houses = Array.from(this.houses.values());
    return houses.sort((a, b) => {
      const totalA = a.academicPoints + a.attendancePoints + a.behaviorPoints;
      const totalB = b.academicPoints + b.attendancePoints + b.behaviorPoints;
      return totalB - totalA;
    });
  }
}

export const storage = new MemStorage();
