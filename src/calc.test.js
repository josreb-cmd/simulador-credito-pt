import {
  calcIMT,
  interestShock,
  maxHousingTermYears,
  pmt,
  simulateHousing,
  simulatePersonal,
  stampDutyHousingCredit
} from './calc.js'
import { BDP } from './rules.js'

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

assert(BDP.dstiMax === 0.45, 'DSTI Rec. 1/2026 deve ser 45%')
assert(interestShock(5, 'variable') === 0.005, 'choque ≤ 5 anos')
assert(interestShock(8, 'variable') === 0.01, 'choque 5–10 anos')
assert(interestShock(30, 'variable') === 0.015, 'choque > 10 anos')
assert(interestShock(30, 'fixed') === 0, 'taxa fixa sem choque')
assert(interestShock(30, 'mixed', 5) === 0.015, 'mista 30 anos: choque pelo prazo do contrato')
assert(interestShock(30, 'mixed', 30) === 0, 'mista com período fixo = prazo: sem choque')

assert(maxHousingTermYears([35]) === 40, '≤ 35 anos: prazo 40')
assert(maxHousingTermYears([36]) === 35, '> 35 anos: prazo 35')
assert(maxHousingTermYears([30, 40]) === 35, 'casal: usa o mutuário mais velho')

const imt250 = calcIMT({
  propertyValue: 250000,
  purpose: 'hpp',
  region: 'continente',
  rural: false,
  youngFirstHome: false,
  buyerAge: 40
})
assert(imt250.tax > 7000 && imt250.tax < 8000, `IMT 250k HPP inesperado: ${imt250.tax}`)

const young = calcIMT({
  propertyValue: 250000,
  purpose: 'hpp',
  region: 'continente',
  youngFirstHome: true,
  buyerAge: 30
})
assert(young.tax === 0, 'Jovem 1.ª HPP até 4.º escalão deve ter IMT 0')

const pay = pmt(200000, 0.03, 360)
assert(pay > 840 && pay < 850, `PMT inesperado: ${pay}`)

assert(stampDutyHousingCredit(200000) === 1200, 'IS crédito 0,6%')

const h = simulateHousing({
  propertyValue: 250000,
  appraisalValue: 250000,
  loanAmount: 200000,
  years: 30,
  tan: 0.03,
  purpose: 'hpp',
  rateType: 'variable',
  age1: 35,
  netMonthlyIncome: 3200,
  otherMonthlyDebts: 150,
  dossierFee: 650,
  appraisalFee: 280,
  lifeInsuranceAnnual: 900,
  homeInsuranceAnnual: 220
})
assert(h.checks.find((c) => c.id === 'ltv').ok, 'LTV 80% HPP deve passar')
assert(Math.abs(h.shock - 0.015) < 1e-12, `choque CH 30 anos deve ser 1,5 p.p.: ${h.shock}`)
assert(h.dstiStressed <= 0.45 + 1e-9, `DSTI stress deve caber em 45%: ${h.dstiStressed}`)
assert(h.compliant === true, 'caso base Rec. 1/2026 deve ser conforme')
assert(!h.checks.find((c) => c.id === 'age'), 'já não existe teto de 75 anos no termo')

const tooLong = simulateHousing({
  ...{
    propertyValue: 250000,
    appraisalValue: 250000,
    loanAmount: 200000,
    years: 40,
    tan: 0.03,
    purpose: 'hpp',
    rateType: 'variable',
    age1: 36,
    netMonthlyIncome: 5000,
    otherMonthlyDebts: 0,
    dossierFee: 0,
    appraisalFee: 0,
    lifeInsuranceAnnual: 0,
    homeInsuranceAnnual: 0
  }
})
assert(tooLong.maxTerm === 35, 'idade 36: prazo máx. 35')
assert(!tooLong.checks.find((c) => c.id === 'term').ok, '40 anos com idade 36 deve falhar')

const overAge = simulateHousing({
  propertyValue: 250000,
  appraisalValue: 250000,
  loanAmount: 250000,
  years: 30,
  tan: 0.03,
  purpose: 'hpp',
  rateType: 'variable',
  age1: 36,
  netMonthlyIncome: 5000,
  otherMonthlyDebts: 0,
  dossierFee: 0,
  appraisalFee: 0,
  lifeInsuranceAnnual: 0,
  homeInsuranceAnnual: 0,
  youngFirstHome: true,
  youngPublicGuarantee: true
})
assert(!overAge.youngEligible, '36 anos não é crédito jovem')
assert(overAge.imt.tax > 0, '36 anos não isenta IMT')
assert(overAge.isProperty > 0, '36 anos não isenta IS da aquisição')
assert(Math.abs(overAge.ltvMax - 0.9) < 1e-12, '36 anos: LTV 90%, não 100%')
assert(overAge.compliant === false || overAge.ltv > overAge.ltvMax, 'LTV 100% aos 36 deve falhar o LTV')
assert(overAge.youngEligible === false, '36 anos: crédito jovem indisponível')
assert(overAge.maxLoan > 0, 'capacidade máxima deve ser calculada')

const p = simulatePersonal({
  loanAmount: 15000,
  years: 5,
  tan: 0.089,
  netMonthlyIncome: 1600,
  otherMonthlyDebts: 80,
  dossierFee: 250,
  product: 'personal',
  age1: 32
})
assert(p.schedule.payment > 300, 'prestação pessoal')
assert(p.isCredit === 90, `IS consumo 0,6% 5 anos: ${p.isCredit}`)
assert(p.shock === 0, 'crédito pessoal TAN fixa: sem choque')

console.log('ok', {
  imt: imt250.tax,
  pmt: pay.toFixed(2),
  housingOk: h.compliant,
  dstiStress: h.dstiStressed,
  personalTaeg: p.taeg
})
