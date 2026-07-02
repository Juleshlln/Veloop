/**
 * Pre-trip vehicle inspection — shared definitions.
 * The photo record + timestamped dual sign-off form the evidence trail
 * an insurer would expect for a "someone else drives your car" service.
 */

export interface InspectionAngle {
  type: string;
  label: string;
  hint: string;
  required: boolean;
}

export const INSPECTION_ANGLES: InspectionAngle[] = [
  { type: "avant", label: "Face avant", hint: "Pare-chocs, capot, phares", required: true },
  { type: "arriere", label: "Face arrière", hint: "Pare-chocs, coffre, feux", required: true },
  { type: "lateral_gauche", label: "Côté gauche", hint: "Portières et aile côté conducteur", required: true },
  { type: "lateral_droit", label: "Côté droit", hint: "Portières et aile côté passager", required: true },
  { type: "compteur", label: "Compteur", hint: "Kilométrage lisible au tableau de bord", required: false },
];

export const REQUIRED_ANGLE_TYPES = INSPECTION_ANGLES.filter((a) => a.required).map((a) => a.type);

export function angleLabel(type: string): string {
  return INSPECTION_ANGLES.find((a) => a.type === type)?.label ?? type;
}

/** Checklist confirmed by the driver with the customer before departure. */
export const DRIVER_CHECKLIST = [
  "Identité du client confirmée",
  "Véhicule correspondant à la réservation",
  "État extérieur vérifié avec le client",
  "Documents du véhicule confirmés (carte grise, assurance)",
  "Vélo correctement rangé dans le coffre",
  "Clés remises au chauffeur",
  "Destination confirmée",
];
