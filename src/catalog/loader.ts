import { ConsultantProfileSchema, type ConsultantProfile } from "../shared/contracts";
import { syntheticConsultants } from "./data";

const consultantCatalog = ConsultantProfileSchema.array().parse(syntheticConsultants);

export function listConsultants(): readonly ConsultantProfile[] {
  return consultantCatalog;
}

export function getConsultantById(id: string): ConsultantProfile | undefined {
  return consultantCatalog.find((consultant) => consultant.id === id);
}
