import { test } from 'node:test'
import assert from 'node:assert/strict'
import { stampDutyConsumerCredit } from './calc.js'

// Imposto do Selo no crédito ao consumo (verba 17.2 TGIS). Valores esperados calculados à mão.
test('consumo 15.000 €, 5 anos paga 264,00 € (1,76%)', () => {
  assert.equal(stampDutyConsumerCredit(15000, 5), 264)
})

test('consumo 10.000 €, 4 anos paga 176,00 € (1,76%)', () => {
  assert.equal(stampDutyConsumerCredit(10000, 4), 176)
})

test('consumo 10.000 €, 6 meses paga 84,60 € (0,141% × 6 meses)', () => {
  assert.equal(stampDutyConsumerCredit(10000, 0.5), 84.6)
})

test('consumo 10.000 €, 1 ano exacto paga 176,00 € (1,76%, não a taxa mensal)', () => {
  assert.equal(stampDutyConsumerCredit(10000, 1), 176)
})
