import type { ConsultantProfile } from "../shared/contracts";

export const syntheticConsultants = [
  {
    id: "cedar-finch",
    displayName: "Cedar Finch",
    track: "professional-agents",
    role: "independent-consultant",
    specialties: ["service design", "workflow strategy", "client operations"],
    services: ["discovery facilitation", "scope definition", "proposal design"],
    proofPoints: [
      "Synthetic demonstration profile for repeatable client discovery.",
      "Synthetic demonstration profile for turning ambiguous needs into bounded work.",
    ],
  },
] satisfies readonly ConsultantProfile[];
