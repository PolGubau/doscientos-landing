export const resourceTypeLabels = {
  articulo: "Articulo",
  guia: "Guia",
  checklist: "Checklist",
  plantilla: "Plantilla",
  calculadora: "Calculadora",
  caso: "Caso",
  newsletter: "Newsletter",
} as const;

export const buyerStageLabels = {
  awareness: "Explorar",
  consideration: "Evaluar",
  decision: "Decidir",
} as const;

export function getResourceLabel(
  type: keyof typeof resourceTypeLabels | undefined,
): string {
  return resourceTypeLabels[type ?? "articulo"];
}

export function getBuyerStageLabel(
  stage: keyof typeof buyerStageLabels | undefined,
): string {
  return buyerStageLabels[stage ?? "consideration"];
}
