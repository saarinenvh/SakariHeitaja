import { Course } from "../../../db/entities/Course";
import * as courseRepo from "../../../db/repositories/CourseRepository";

export async function getOrCreate(name: string): Promise<Course | null> {
  await courseRepo.upsert(name);
  return courseRepo.findByName(name);
}

export async function findByName(name: string): Promise<Course | null> {
  return courseRepo.findByName(name);
}
