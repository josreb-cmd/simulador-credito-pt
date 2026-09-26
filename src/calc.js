import {
  IMT_HPP_CONTINENTE,
  IMT_OTHER_URBAN_CONTINENTE,
  IMT_RURAL_RATE,
  IMT_OTHER_RATE,
  YOUNG_IMT_EXEMPTION_LIMIT,
  YOUNG_MAX_AGE,
  STAMP_DUTY,
  BDP,
  TAEG_MAX_INDICATIVE
} from './rules.js'

export function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

function applyTable(value, table) {
  if (value <= 0) return 0
  for (const row of table) {
    if (value <= row.upTo) {
      if (row.flat) return round2(value * row.rate)
      return round2(value * row.rate - row.abatement)
    }
  }
  return 0
}

export function calcIMT({
  propertyValue,
  purpose,
  region,
  rural,
  youngFirstHome,
  buyerAge
}) {
  const value = Math.max(0, Number(propertyValue) || 0)
  if (value <= 0) return { tax: 0, exempt: false, note: '' }

  if (rural) {
    return {
      tax: round2(value * IMT_RURAL_RATE),
      exempt: false,
      note: 'Prédios rústicos: taxa de 5% (CIMT).'
    }
  }

  const isHpp = purpose === 'hpp'
  const table = isHpp ? IMT_HPP_CONTINENTE : IMT_OTHER_URBAN_CONTINENTE
  let tax = applyTable(value, table)
  let note = isHpp
    ? 'Tabela IMT habitação própria e permanente (Continente, OE 2025).'
    : 'Tabela IMT outros prédios urbanos (Continente, OE 2025).'

  const youngOk =
    isHpp &&
    youngFirstHome &&
    Number(buyerAge) > 0 &&
    Number(buyerAge) <= YOUNG_MAX_AGE

  let exempt = false
  if (youngOk) {
    if (value <= YOUNG_IMT_EXEMPTION_LIMIT) {
      tax = 0
      exempt = true
      note =
        'Isenção IMT para jovens até 35 anos na 1.ª habitação própria e permanente, até ao 4.º escalão.'
    } else {
      tax = round2(applyTable(value, table) - applyTable(YOUNG_IMT_EXEMPTION_LIMIT, table))
      note =
        'Jovem até 35 anos: isenção até ao 4.º escalão; IMT incide sobre o excedente.'
    }
  }

  if (region === 'madeira') {
    tax = round2(tax * 0.8)
    note += ' Madeira: redução indicativa de 20% sobre a tabela do Continente (confirmar diploma regional).'
  } else if (region === 'acores') {
    tax = round2(tax * 0.5)
    note += ' Açores: redução indicativa de 50% sobre a tabela do Continente (confirmar diploma regional).'
  }

  return { tax: Math.max(0, tax), exempt, note }
}

export function stampDutyProperty(propertyValue, youngExempt) {
  if (youngExempt) return 0
  return round2(Math.max(0, propertyValue) * STAMP_DUTY.propertyAcquisition)
}

export function stampDutyHousingCredit(loan) {
  return round2(Math.max(0, loan) * STAMP_DUTY.mortgageCredit)
}

export function stampDutyConsumerCredit(loan, years) {
  const capital = Math.max(0, loan)
  if (years < 1) {
    const months = Math.max(1, Math.ceil(years * 12))
    return round2(capital * STAMP_DUTY.consumerLt1yMonthly * months)
  }
  if (years < 5) return round2(capital * STAMP_DUTY.consumer1to5y)
  return round2(capital * STAMP_DUTY.consumerGte5y)
}

export function monthlyRate(tanAnnual) {
  return tanAnnual / 12
}

export function pmt(principal, tanAnnual, months) {
  if (months <= 0) return 0
  if (principal <= 0) return 0
  const r = monthlyRate(tanAnnual)
  if (Math.abs(r) < 1e-12) return principal / months
  const pow = Math.pow(1 + r, months)
  return (principal * r * pow) / (pow - 1)
}

export function pv(payment, tanAnnual, months) {
  if (months <= 0 || payment <= 0) return 0
  const r = monthlyRate(tanAnnual)
  if (Math.abs(r) < 1e-12) return payment * months
  const pow = Math.pow(1 + r, months)
  return payment * (pow - 1) / (r * pow)
}

export function buildSchedule(principal, tanAnnual, months) {
  const payment = pmt(principal, tanAnnual, months)
  const r = monthlyRate(tanAnnual)
  const rows = []
  let balance = principal
  let totalInterest = 0

  for (let m = 1; m <= months; m++) {
    const interest = balance * r
    let amort = payment - interest
    if (m === months) {
      amort = balance
    }
    const installment = m === months ? balance + interest : payment
    balance = Math.max(0, balance - amort)
    totalInterest += interest
    rows.push({
      month: m,
      installment: round2(installment),
      interest: round2(interest),
      amort: round2(amort),
      balance: round2(balance)
    })
  }

  return {
    payment: round2(payment),
    totalInterest: round2(totalInterest),
    totalPaid: round2(principal + totalInterest),
    rows
  }
}

function npv(rateMonthly, cashflows) {
  let v = 0
  for (let t = 0; t < cashflows.length; t++) {
    v += cashflows[t] / Math.pow(1 + rateMonthly, t)
  }
  return v
}

export function irrMonthly(cashflows) {
  let lo = -0.5
  let hi = 2
  let mid = 0.01
  const n0 = npv(0, cashflows)
  if (Math.abs(n0) < 1e-8) return 0

  let nLo = npv(lo, cashflows)
  let nHi = npv(hi, cashflows)
  if (nLo * nHi > 0) {
    hi = 5
    nHi = npv(hi, cashflows)
  }

  for (let i = 0; i < 80; i++) {
    mid = (lo + hi) / 2
    const n = npv(mid, cashflows)
    if (Math.abs(n) < 1e-10) return mid
    if (nLo * n < 0) {
      hi = mid
      nHi = n
    } else {
      lo = mid
      nLo = n
    }
  }
  return mid
}

export function taegFromCashflows(cashflows) {
  const rm = irrMonthly(cashflows)
  return Math.pow(1 + rm, 12) - 1
}

export function interestShock(years, rateType, mixedFixedYears) {
  const term = Math.max(0, Number(years) || 0)
  if (rateType === 'fixed') return BDP.shockFixed
  if (rateType === 'mixed') {
    const fixed = Math.max(0, Number(mixedFixedYears) || 0)
    if (fixed >= term) return BDP.shockFixed
  }
  if (term <= 5) return BDP.shockLe5
  if (term <= 10) return BDP.shockGt5Le10
  return BDP.shockGt10
}

export function stressedRate(tan, years, rateType, mixedFixedYears) {
  return tan + interestShock(years, rateType, mixedFixedYears)
}

export function shockDetail(years, rateType, mixedFixedYears) {
  const shock = interestShock(years, rateType, mixedFixedYears)
  if (rateType === 'fixed' || shock === 0) {
    return 'Taxa fixa pura: sem agravamento no teste de esforço (out. 2023 / Rec. 1/2026).'
  }
  const pp = (shock * 100).toFixed(1).replace('.', ',')
  if (rateType === 'mixed') {
    return `Taxa mista: +${pp} p.p. na fase variável (prazo do contrato ${years} anos; limiares 5 / 10 anos).`
  }
  return `Taxa variável: choque de +${pp} p.p. (prazo ${years} anos; limiares 5 / 10 anos).`
}

export function maxHousingTermYears(ages) {
  const valid = ages.filter((a) => a > 0)
  if (!valid.length) return BDP.housingMaxYearsYoung
  const oldest = Math.max(...valid)
  return oldest <= BDP.youngAgeLimit ? BDP.housingMaxYearsYoung : BDP.housingMaxYearsOlder
}

export function isYoungBuyerEligible(ages) {
  const valid = (ages || []).filter((a) => a > 0)
  if (!valid.length) return false
  return valid.every((a) => a <= YOUNG_MAX_AGE)
}

export function ltvLimit(purpose, youngPublicGuarantee) {
  const hppLike = purpose === 'hpp' || purpose === 'works'
  if (hppLike && youngPublicGuarantee) return BDP.publicGuaranteeYoungLtv
  if (hppLike) return BDP.ltvHpp
  return BDP.ltvOther
}

export function simulateHousing(input) {
  const propertyValue = Math.max(0, Number(input.propertyValue) || 0)
  const appraisal = Math.max(0, Number(input.appraisalValue) || propertyValue)
  const baseValue = Math.min(propertyValue, appraisal || propertyValue)
  const loanRequested = Math.max(0, Number(input.loanAmount) || 0)
  const years = Math.max(1, Number(input.years) || 1)
  const months = Math.round(years * 12)
  const ages = [Number(input.age1) || 0, Number(input.age2) || 0].filter((a) => a > 0)
  const youngest = ages.length ? Math.min(...ages) : Number(input.age1) || 0
  const netIncome = Math.max(0, Number(input.netMonthlyIncome) || 0)
  const otherDebts = Math.max(0, Number(input.otherMonthlyDebts) || 0)
  const tan = Math.max(0, Number(input.tan) || 0)
  const purpose = input.purpose || 'hpp'
  const rateType = input.rateType || 'variable'

  const dossier = Math.max(0, Number(input.dossierFee) || 0)
  const appraisalFee = Math.max(0, Number(input.appraisalFee) || 0)
  const lifeAnnual = Math.max(0, Number(input.lifeInsuranceAnnual) || 0)
  const homeAnnual = Math.max(0, Number(input.homeInsuranceAnnual) || 0)

  const requestedYoungFirstHome = Boolean(input.youngFirstHome)
  const requestedYoungGuarantee = Boolean(input.youngPublicGuarantee)
  const youngEligible = isYoungBuyerEligible(ages.length ? ages : [Number(input.age1) || 0])
  const youngFirstHome = requestedYoungFirstHome && youngEligible
  const youngGuarantee = requestedYoungGuarantee && youngEligible
  const imt = calcIMT({
    propertyValue,
    purpose,
    region: input.region || 'continente',
    rural: Boolean(input.rural),
    youngFirstHome,
    buyerAge: youngEligible ? youngest : 99
  })

  const youngPropertyExempt = youngFirstHome && purpose === 'hpp'

  const isProperty = stampDutyProperty(propertyValue, youngPropertyExempt)
  const isCredit = stampDutyHousingCredit(loanRequested)

  const schedule = buildSchedule(loanRequested, tan, months)
  const lifeMonthly = lifeAnnual / 12
  const homeMonthly = homeAnnual / 12
  const installmentAllIn = round2(schedule.payment + lifeMonthly + homeMonthly)

  const shock = interestShock(years, rateType, input.mixedFixedYears)
  const shockTan = stressedRate(tan, years, rateType, input.mixedFixedYears)
  const stressedPmt = pmt(loanRequested, shockTan, months) + lifeMonthly + homeMonthly
  const dsti = netIncome > 0 ? (installmentAllIn + otherDebts) / netIncome : Infinity
  const dstiStressed = netIncome > 0 ? (stressedPmt + otherDebts) / netIncome : Infinity

  const ltv = baseValue > 0 ? loanRequested / baseValue : Infinity
  const ltvMax = ltvLimit(purpose, youngGuarantee)
  const agesForTerm = ages.length ? ages : [Number(input.age1) || 0]
  const maxTerm = maxHousingTermYears(agesForTerm)
  const oldest = agesForTerm.filter((a) => a > 0).length
    ? Math.max(...agesForTerm.filter((a) => a > 0))
    : 0
  const ageAtEnd = oldest + years
  const numAgeAtEnd = Math.round(ageAtEnd * 10) / 10
  const hppLike = purpose === 'hpp' || purpose === 'works'

  const initialCosts = dossier + appraisalFee + isCredit
  const cashflows = new Array(months + 1).fill(0)
  cashflows[0] = loanRequested - initialCosts
  for (let m = 1; m <= months; m++) {
    cashflows[m] = -(schedule.rows[m - 1].installment + lifeMonthly + homeMonthly)
  }
  const taeg = cashflows[0] > 0 ? taegFromCashflows(cashflows) : 0

  const taxesAtDeed = round2(imt.tax + isProperty)
  const cashNeeded = round2(
    Math.max(0, propertyValue - loanRequested) + taxesAtDeed + dossier + appraisalFee + isCredit
  )

  const checks = [
    {
      id: 'ltv',
      label: 'LTV (rácio financiamento / valor)',
      value: ltv,
      limit: ltvMax,
      ok: ltv <= ltvMax + 1e-9,
      format: 'pct',
      detail: hppLike
        ? youngGuarantee
          ? 'HPP/obras: LTV 90% (Rec. 1/2026). Garantia pública jovem: até 100% (todos os mutuários ≤ 35 anos).'
          : 'Aquisição, construção ou obras em HPP: máximo 90% (Rec. 1/2026). Imóveis da banca já não beneficiam, em regra, de LTV 100%.'
        : 'Outras finalidades (secundária, investimento): máximo 80% (Rec. 1/2026).'
    },
    {
      id: 'dsti',
      label: 'DSTI em condições contratadas',
      value: dsti,
      limit: BDP.dstiMax,
      ok: dsti <= BDP.dstiMax + 1e-9,
      format: 'pct',
      detail: 'Prestação (com seguros) + outros créditos, sobre o rendimento líquido. Limite 45% (Rec. 1/2026). Exceções: até 10% da produção semestral do banco.'
    },
    {
      id: 'dstiShock',
      label: 'DSTI após teste de esforço',
      value: dstiStressed,
      limit: BDP.dstiMax,
      ok: dstiStressed <= BDP.dstiMax + 1e-9,
      format: 'pct',
      detail: shockDetail(years, rateType, input.mixedFixedYears)
    },
    {
      id: 'term',
      label: 'Prazo do contrato',
      value: years,
      limit: maxTerm,
      ok: years <= maxTerm + 1e-9,
      format: 'years',
      detail: oldest <= BDP.youngAgeLimit
        ? `Mutuário mais velho com ${oldest || '—'} anos (≤ 35): prazo máximo 40 anos. Idade no termo: ${numAgeAtEnd} anos.`
        : `Mutuário mais velho com ${oldest} anos (> 35): prazo máximo 35 anos. Idade no termo: ${numAgeAtEnd} anos.`
    }
  ]

  const bdpChecks = checks.filter((c) => c.id !== 'young')
  const compliant = bdpChecks.every((c) => c.ok)
  const mtic = round2(
    schedule.totalPaid + lifeAnnual * years + homeAnnual * years + dossier + appraisalFee + isCredit
  )

  const maxInstallment = netIncome * BDP.dstiMax - otherDebts - lifeMonthly - homeMonthly
  const maxLoanDsti = round2(Math.max(0, pv(maxInstallment, shockTan, months)))
  const maxLoanLtv = round2(Math.max(0, baseValue * ltvMax))
  const maxLoan = round2(Math.min(maxLoanDsti, maxLoanLtv))

  return {
    type: 'housing',
    imt,
    isProperty,
    isCredit,
    taxesAtDeed,
    cashNeeded,
    downPayment: round2(Math.max(0, propertyValue - loanRequested)),
    schedule,
    installmentAllIn,
    lifeMonthly: round2(lifeMonthly),
    homeMonthly: round2(homeMonthly),
    taeg,
    mtic,
    ltv,
    ltvMax,
    dsti,
    dstiStressed,
    shock,
    shockTan,
    maxTerm,
    ageAtEnd,
    oldest,
    youngEligible,
    youngFirstHome,
    youngGuarantee,
    requestedYoungFirstHome,
    requestedYoungGuarantee,
    maxLoan,
    maxLoanDsti,
    maxLoanLtv,
    checks,
    compliant,
    initialCosts: round2(initialCosts)
  }
}

export function simulatePersonal(input) {
  const loan = Math.max(0, Number(input.loanAmount) || 0)
  const years = Math.max(0.25, Number(input.years) || 1)
  const months = Math.max(1, Math.round(years * 12))
  const tan = Math.max(0, Number(input.tan) || 0)
  const netIncome = Math.max(0, Number(input.netMonthlyIncome) || 0)
  const otherDebts = Math.max(0, Number(input.otherMonthlyDebts) || 0)
  const dossier = Math.max(0, Number(input.dossierFee) || 0)
  const insuranceAnnual = Math.max(0, Number(input.lifeInsuranceAnnual) || 0)
  const age = Number(input.age1) || 0
  const product = input.product || 'personal'

  const isCredit = stampDutyConsumerCredit(loan, years)
  const schedule = buildSchedule(loan, tan, months)
  const insMonthly = insuranceAnnual / 12
  const installmentAllIn = round2(schedule.payment + insMonthly)

  const shock = interestShock(years, 'fixed')
  const shockTan = tan + shock
  const stressedPmt = pmt(loan, shockTan, months) + insMonthly
  const dsti = netIncome > 0 ? (installmentAllIn + otherDebts) / netIncome : Infinity
  const dstiStressed = netIncome > 0 ? (stressedPmt + otherDebts) / netIncome : Infinity

  const cashflows = new Array(months + 1).fill(0)
  cashflows[0] = loan - dossier - isCredit
  for (let m = 1; m <= months; m++) {
    cashflows[m] = -(schedule.rows[m - 1].installment + insMonthly)
  }
  const taeg = cashflows[0] > 0 ? taegFromCashflows(cashflows) : 0

  const taegCap = {
    personal: TAEG_MAX_INDICATIVE.personal,
    autoCollateral: TAEG_MAX_INDICATIVE.autoCollateral,
    autoLeasing: TAEG_MAX_INDICATIVE.autoLeasing,
    revolving: TAEG_MAX_INDICATIVE.revolving,
    other: TAEG_MAX_INDICATIVE.other
  }[product] || TAEG_MAX_INDICATIVE.personal

  const maxYears = product === 'revolving' ? 99 : BDP.consumerMaxYears
  const ageAtEnd = age + years

  const checks = [
    {
      id: 'dsti',
      label: 'DSTI em condições contratadas',
      value: dsti,
      limit: BDP.dstiMax,
      ok: dsti <= BDP.dstiMax + 1e-9,
      format: 'pct',
      detail: 'Inclui este crédito e outros encargos mensais. Limite 45% (Rec. 1/2026). Exceções: até 10% da produção semestral do banco.'
    },
    {
      id: 'dstiShock',
      label: 'DSTI após teste de esforço',
      value: dstiStressed,
      limit: BDP.dstiMax,
      ok: dstiStressed <= BDP.dstiMax + 1e-9,
      format: 'pct',
      detail: 'Crédito pessoal é em regra TAN fixa: sem agravamento. Se a TAN for variável, aplica-se +0,5 / +1,0 / +1,5 p.p. conforme o prazo.'
    },
    {
      id: 'term',
      label: 'Prazo do contrato',
      value: years,
      limit: maxYears,
      ok: years <= maxYears + 1e-9,
      format: 'years',
      detail: product === 'revolving'
        ? 'Cartões e linhas de crédito: prazo aberto, sujeitos a TAEG máxima trimestral.'
        : 'Crédito aos consumidores: prazo máximo de 10 anos (recomendação BdP), salvo finalidades específicas.'
    },
    {
      id: 'taeg',
      label: 'TAEG vs. taxa máxima (usura)',
      value: taeg,
      limit: taegCap,
      ok: taeg <= taegCap + 1e-9,
      format: 'pct',
      detail: 'DL 133/2009: TAEG não pode exceder a média do mercado acrescida de 1/3 (BdP, trimestral).'
    }
  ]

  if (age > 0) {
    checks.push({
      id: 'age',
      label: 'Idade no termo (prática bancária)',
      value: ageAtEnd,
      limit: 75,
      ok: ageAtEnd <= 75,
      format: 'age',
      detail: 'A maior parte das instituições limita a idade no termo a 70–75 anos.'
    })
  }

  const mtic = round2(schedule.totalPaid + insuranceAnnual * years + dossier + isCredit)

  return {
    type: 'personal',
    isCredit,
    schedule,
    installmentAllIn,
    insMonthly: round2(insMonthly),
    taeg,
    taegCap,
    mtic,
    dsti,
    dstiStressed,
    shock,
    shockTan,
    checks,
    compliant: checks.every((c) => c.ok),
    cashReceived: round2(Math.max(0, loan - dossier - isCredit))
  }
}
