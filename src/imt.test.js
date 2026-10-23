import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calcIMT } from './calc.js'

// Tabela IMT 2026 (OC AT 40129/2026). Valores esperados calculados à mão.
function imt(overrides) {
  return calcIMT({
    propertyValue: 0,
    purpose: 'hpp',
    region: 'continente',
    rural: false,
    youngFirstHome: false,
    buyerAge: 40,
    ...overrides
  })
}

test('HPP 150.000 € paga 1.008,98 € (5% − 6.491,02)', () => {
  assert.equal(imt({ propertyValue: 150000 }).tax, 1008.98)
})

test('HPP 106.346 € (limite do 1.º escalão) não paga IMT', () => {
  assert.equal(imt({ propertyValue: 106346 }).tax, 0)
})

test('HPP 250.000 € paga 7.042,04 € (7% − 10.457,96)', () => {
  assert.equal(imt({ propertyValue: 250000 }).tax, 7042.04)
})

test('HPP 400.000 € paga 18.236,65 € (8% − 13.763,35)', () => {
  assert.equal(imt({ propertyValue: 400000 }).tax, 18236.65)
})

test('HPP 700.000 € paga 42.000 € (taxa única de 6%)', () => {
  assert.equal(imt({ propertyValue: 700000 }).tax, 42000)
})

test('HPP 1.200.000 € paga 90.000 € (taxa única de 7,5%)', () => {
  assert.equal(imt({ propertyValue: 1200000 }).tax, 90000)
})

test('Secundária 106.346 € paga 1.063,46 € (1%)', () => {
  assert.equal(imt({ propertyValue: 106346, purpose: 'second' }).tax, 1063.46)
})

test('Secundária 150.000 € paga 2.072,44 € (5% − 5.427,56)', () => {
  assert.equal(imt({ propertyValue: 150000, purpose: 'second' }).tax, 2072.44)
})

test('Secundária 250.000 € paga 8.105,50 € (7% − 9.394,50)', () => {
  assert.equal(imt({ propertyValue: 250000, purpose: 'second' }).tax, 8105.5)
})

test('Secundária 500.000 € paga 27.300,11 € (8% − 12.699,89)', () => {
  assert.equal(imt({ propertyValue: 500000, purpose: 'second' }).tax, 27300.11)
})

test('Secundária 700.000 € paga 42.000 € (taxa única de 6%)', () => {
  assert.equal(imt({ propertyValue: 700000, purpose: 'second' }).tax, 42000)
})

test('Secundária 1.200.000 € paga 90.000 € (taxa única de 7,5%)', () => {
  assert.equal(imt({ propertyValue: 1200000, purpose: 'second' }).tax, 90000)
})

test('Jovem 30 anos, 1.ª HPP, 330.000 € fica isento (até 330.539 €)', () => {
  const result = imt({ propertyValue: 330000, youngFirstHome: true, buyerAge: 30 })
  assert.equal(result.tax, 0)
  assert.equal(result.exempt, true)
})

test('Jovem 30 anos, 1.ª HPP, 400.000 € paga 5.556,88 € sobre o excedente', () => {
  const result = imt({ propertyValue: 400000, youngFirstHome: true, buyerAge: 30 })
  assert.equal(result.tax, 5556.88)
  assert.equal(result.exempt, false)
})

test('Jovem 30 anos, 1.ª HPP, 700.000 € não tem isenção (acima de 660.982 €)', () => {
  const result = imt({ propertyValue: 700000, youngFirstHome: true, buyerAge: 30 })
  assert.equal(result.tax, 42000)
  assert.equal(result.exempt, false)
})

test('HPP 145.471 € (1 € acima de 145.470) paga 782,53 €', () => {
  assert.equal(imt({ propertyValue: 145471 }).tax, 782.53)
})

test('HPP 198.348 € (1 € acima de 198.347) paga 3.426,40 €', () => {
  assert.equal(imt({ propertyValue: 198348 }).tax, 3426.4)
})

test('HPP 330.540 € (1 € acima de 330.539) paga 12.679,85 €', () => {
  assert.equal(imt({ propertyValue: 330540 }).tax, 12679.85)
})

test('HPP 660.982 € (último valor do escalão de 8%) paga 39.115,21 €', () => {
  assert.equal(imt({ propertyValue: 660982 }).tax, 39115.21)
})

test('HPP 660.983 € (taxa única de 6%) paga 39.658,98 €', () => {
  assert.equal(imt({ propertyValue: 660983 }).tax, 39658.98)
})

test('HPP 1.150.853 € (último valor dos 6%) paga 69.051,18 €', () => {
  assert.equal(imt({ propertyValue: 1150853 }).tax, 69051.18)
})

test('HPP 1.150.854 € (taxa única de 7,5%) paga 86.314,05 €', () => {
  assert.equal(imt({ propertyValue: 1150854 }).tax, 86314.05)
})

test('Secundária 145.471 € (1 € acima de 145.470) paga 1.845,99 €', () => {
  assert.equal(imt({ propertyValue: 145471, purpose: 'second' }).tax, 1845.99)
})

test('Secundária 198.348 € (1 € acima de 198.347) paga 4.489,86 €', () => {
  assert.equal(imt({ propertyValue: 198348, purpose: 'second' }).tax, 4489.86)
})

test('Secundária 330.540 € (1 € acima de 330.539) paga 13.743,31 €', () => {
  assert.equal(imt({ propertyValue: 330540, purpose: 'second' }).tax, 13743.31)
})

test('Secundária 633.931 € (último valor do escalão de 8%) paga 38.014,59 €', () => {
  assert.equal(imt({ propertyValue: 633931, purpose: 'second' }).tax, 38014.59)
})

test('Secundária 633.932 € (taxa única de 6%) paga 38.035,92 €', () => {
  assert.equal(imt({ propertyValue: 633932, purpose: 'second' }).tax, 38035.92)
})

test('Secundária 1.150.853 € (último valor dos 6%) paga 69.051,18 €', () => {
  assert.equal(imt({ propertyValue: 1150853, purpose: 'second' }).tax, 69051.18)
})

test('Secundária 1.150.854 € (taxa única de 7,5%) paga 86.314,05 €', () => {
  assert.equal(imt({ propertyValue: 1150854, purpose: 'second' }).tax, 86314.05)
})

test('Jovem 30 anos, 1.ª HPP, 330.539 € (limite da isenção) fica isento', () => {
  const result = imt({ propertyValue: 330539, youngFirstHome: true, buyerAge: 30 })
  assert.equal(result.tax, 0)
  assert.equal(result.exempt, true)
})

test('Jovem 30 anos, 1.ª HPP, 330.540 € (1 € acima da isenção) paga 0,08 €', () => {
  const result = imt({ propertyValue: 330540, youngFirstHome: true, buyerAge: 30 })
  assert.equal(result.tax, 0.08)
  assert.equal(result.exempt, false)
})

test('Jovem 30 anos, 1.ª HPP, 660.982 € (último valor com isenção parcial) paga 26.435,44 €', () => {
  const result = imt({ propertyValue: 660982, youngFirstHome: true, buyerAge: 30 })
  assert.equal(result.tax, 26435.44)
  assert.equal(result.exempt, false)
})

test('Jovem 30 anos, 1.ª HPP, 660.983 € (1 € acima) não tem isenção e paga 39.658,98 €', () => {
  const result = imt({ propertyValue: 660983, youngFirstHome: true, buyerAge: 30 })
  assert.equal(result.tax, 39658.98)
  assert.equal(result.exempt, false)
})

test('HPP 145.000 € (entre os limites de 2025 e 2026) paga 773,08 € (2% − 2.126,92)', () => {
  assert.equal(imt({ propertyValue: 145000 }).tax, 773.08)
})

test('HPP 198.000 € (entre os limites de 2025 e 2026) paga 3.408,98 € (5% − 6.491,02)', () => {
  assert.equal(imt({ propertyValue: 198000 }).tax, 3408.98)
})

test('HPP 330.000 € (entre os limites de 2025 e 2026) paga 12.642,04 € (7% − 10.457,96)', () => {
  assert.equal(imt({ propertyValue: 330000 }).tax, 12642.04)
})

test('Secundária 145.000 € (entre os limites de 2025 e 2026) paga 1.836,54 € (2% − 1.063,46)', () => {
  assert.equal(imt({ propertyValue: 145000, purpose: 'second' }).tax, 1836.54)
})

test('Secundária 198.000 € (entre os limites de 2025 e 2026) paga 4.472,44 € (5% − 5.427,56)', () => {
  assert.equal(imt({ propertyValue: 198000, purpose: 'second' }).tax, 4472.44)
})

test('Secundária 330.000 € (entre os limites de 2025 e 2026) paga 13.705,50 € (7% − 9.394,50)', () => {
  assert.equal(imt({ propertyValue: 330000, purpose: 'second' }).tax, 13705.5)
})
