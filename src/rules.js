/**
 * Regras fiscais portuguesas e recomendação macroprudencial do Banco de Portugal.
 * Referências: CIMT, CIS/TGIS, DL 74-A/2017, DL 133/2009,
 * Rec. Macroprudencial n.º 1/2026 (avaliações de solvabilidade a partir de 1 ago 2026).
 * Teste de esforço de taxa: em vigor desde outubro de 2023 (inalterado na Rec. 1/2026).
 */

export const YEAR_REF = 2026

export const IMT_HPP_CONTINENTE = [
  { upTo: 104261, rate: 0.0, abatement: 0 },
  { upTo: 142682, rate: 0.02, abatement: 2085.22 },
  { upTo: 194583, rate: 0.05, abatement: 6365.68 },
  { upTo: 324258, rate: 0.07, abatement: 10257.34 },
  { upTo: 648514, rate: 0.08, abatement: 13499.92 },
  { upTo: 1128287, rate: 0.06, abatement: 0, flat: true },
  { upTo: Infinity, rate: 0.075, abatement: 0, flat: true }
]

export const IMT_OTHER_URBAN_CONTINENTE = [
  { upTo: 104261, rate: 0.01, abatement: 0 },
  { upTo: 142682, rate: 0.02, abatement: 1042.61 },
  { upTo: 194583, rate: 0.05, abatement: 5323.07 },
  { upTo: 324258, rate: 0.07, abatement: 9214.73 },
  { upTo: 621501, rate: 0.08, abatement: 12457.31 },
  { upTo: Infinity, rate: 0.06, abatement: 0, flat: true }
]

export const IMT_RURAL_RATE = 0.05
export const IMT_OTHER_RATE = 0.065

export const YOUNG_IMT_EXEMPTION_LIMIT = 324258
export const YOUNG_MAX_AGE = 35

export const STAMP_DUTY = {
  propertyAcquisition: 0.008,
  mortgageCredit: 0.006,
  consumerLt1yMonthly: 0.0004,
  consumer1to5y: 0.005,
  consumerGte5y: 0.006
}

export const BDP = {
  ltvHpp: 0.9,
  ltvOther: 0.8,
  dstiMax: 0.45,
  exceptionShare: 0.1,
  housingMaxYearsYoung: 40,
  housingMaxYearsOlder: 35,
  youngAgeLimit: 35,
  consumerMaxYears: 10,
  shockLe5: 0.005,
  shockGt5Le10: 0.01,
  shockGt10: 0.015,
  shockFixed: 0,
  publicGuaranteeYoungLtv: 1.0
}

export const TAEG_MAX_INDICATIVE = {
  quarterLabel: 'limites indicativos — confirmar o trimestre em vigor no Banco de Portugal',
  personal: 0.157,
  autoCollateral: 0.121,
  autoLeasing: 0.105,
  revolving: 0.189,
  other: 0.154
}

export const DEFAULTS = {
  euribor12m: 0.021,
  spreadHousing: 0.009,
  spreadPersonal: 0.069,
  dossierFeeHousing: 650,
  dossierFeePersonal: 250,
  appraisalFee: 280,
  lifeInsuranceAnnualRate: 0.0045,
  homeInsuranceAnnualRate: 0.0018
}

export const PURPOSE_LABELS = {
  hpp: 'Habitação própria e permanente',
  second: 'Habitação secundária / investimento',
  works: 'Obras em imóvel próprio',
  other: 'Outras finalidades'
}

export const REGION_LABELS = {
  continente: 'Continente',
  madeira: 'Região Autónoma da Madeira',
  acores: 'Região Autónoma dos Açores'
}
