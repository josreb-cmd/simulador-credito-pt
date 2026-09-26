import { simulateHousing, simulatePersonal } from './calc.js'
import { DEFAULTS } from './rules.js'

const euro = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' })
const pct = new Intl.NumberFormat('pt-PT', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 2 })
const num = new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 1 })

function formData(form) {
  const fd = new FormData(form)
  const o = Object.fromEntries(fd.entries())
  form.querySelectorAll('input[type=checkbox]').forEach((el) => {
    o[el.name] = el.checked
  })
  ;[
    'propertyValue', 'appraisalValue', 'loanAmount', 'years', 'euribor', 'spread', 'tan',
    'age1', 'age2', 'netMonthlyIncome', 'otherMonthlyDebts', 'dossierFee', 'appraisalFee',
    'lifeInsuranceAnnual', 'homeInsuranceAnnual', 'mixedFixedYears'
  ].forEach((k) => {
    if (o[k] === '' || o[k] == null) return
    o[k] = Number(String(o[k]).replace(',', '.'))
  })
  return o
}

function fmt(check) {
  if (!Number.isFinite(check.value)) return '—'
  if (check.format === 'pct') return pct.format(check.value)
  if (check.format === 'years') return `${num.format(check.value)} anos`
  if (check.format === 'age') return `${num.format(check.value)} anos`
  return String(check.value)
}

function fmtLimit(check) {
  if (check.format === 'pct') return pct.format(check.limit)
  if (check.format === 'years') return `${check.limit} anos`
  if (check.format === 'age') return `${check.limit} anos`
  return String(check.limit)
}

function banner(ok, text) {
  return `<div class="banner ${ok ? 'ok' : 'bad'}">${text}</div>`
}

function kpis(items) {
  return `<div class="kpis">${items.map((i) => `
    <div class="kpi ${i.tone || ''}">
      <span>${i.label}</span>
      <b>${i.value}</b>
    </div>`).join('')}</div>`
}

function checksHtml(checks) {
  return `<div class="checks-list">${checks.map((c) => `
    <div class="check-row">
      <span class="dot ${c.ok ? 'ok' : 'bad'}"></span>
      <div>
        <strong>${c.label}</strong>
        <small>${c.detail}</small>
      </div>
      <div>${fmt(c)} <small>/ ${fmtLimit(c)}</small></div>
    </div>`).join('')}</div>`
}

function scheduleTable(rows) {
  const sample = rows.filter((_, i) => i < 12 || i === rows.length - 1 || (i + 1) % 12 === 0)
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Mês</th><th>Prestação</th><th>Juro</th><th>Capital</th><th>Saldo</th></tr></thead>
        <tbody>
          ${sample.map((r) => `<tr>
            <td>${r.month}</td>
            <td>${euro.format(r.installment)}</td>
            <td>${euro.format(r.interest)}</td>
            <td>${euro.format(r.amort)}</td>
            <td>${euro.format(r.balance)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <p class="note">Primeiros 12 meses, depois anualmente, e a última prestação. Amortização constante (francês).</p>`
}

function renderHousing(el, r) {
  el.innerHTML = `
    <div class="card">
      ${banner(
        r.compliant,
        r.compliant
          ? 'Operação dentro dos limites da recomendação do Banco de Portugal (simulação).'
          : 'Fora de pelo menos um limite da recomendação do BdP. A instituição pode recusar ou exigir fiadores / maior entrada.'
      )}
      ${kpis([
        { label: 'Prestação (c/ seguros)', value: euro.format(r.installmentAllIn) },
        { label: 'TAEG estimada', value: pct.format(r.taeg) },
        { label: 'MTIC', value: euro.format(r.mtic) },
        { label: 'Idade no termo', value: `${num.format(r.ageAtEnd)} anos` },
        { label: 'Crédito máximo (DSTI+LTV)', value: euro.format(r.maxLoan) },
        { label: 'Entrada + impostos + custos', value: euro.format(r.cashNeeded), tone: r.compliant ? 'ok' : 'bad' }
      ])}
      ${!r.youngEligible ? `<p class="note">Crédito jovem não aplicável: mutuário com ${num.format(r.oldest)} anos (> 35). IMT e Imposto do Selo da aquisição são devidos; LTV máximo 90%.</p>` : ''}
      ${checksHtml(r.checks.filter((c) => c.id !== 'young'))}
      <h3>Custos na escritura</h3>
      <table>
        <tr><td>Entrada (não financiada)</td><td>${euro.format(r.downPayment)}</td></tr>
        <tr><td>IMT</td><td>${euro.format(r.imt.tax)}</td></tr>
        <tr><td>Imposto do Selo (aquisição 0,8%)</td><td>${euro.format(r.isProperty)}</td></tr>
        <tr><td>Imposto do Selo (crédito 0,6%)</td><td>${euro.format(r.isCredit)}</td></tr>
        <tr><td>Dossier + avaliação</td><td>${euro.format(r.initialCosts - r.isCredit)}</td></tr>
        <tr><th>Liquidez necessária (estimativa)</th><th>${euro.format(r.cashNeeded)}</th></tr>
      </table>
      <p class="note">${r.imt.note} Não inclui notário, registo predial, comissão de intermediação nem IMI futuro.</p>
      <h3>Plano de amortização</h3>
      ${scheduleTable(r.schedule.rows)}
    </div>`
}

function renderPersonal(el, r) {
  el.innerHTML = `
    <div class="card">
      ${banner(
        r.compliant,
        r.compliant
          ? 'Simulação dentro dos limites BdP (DSTI/prazo) e do teto indicativo de TAEG.'
          : 'Simulação incumpre DSTI, prazo ou TAEG máxima. Risco de recusa ou de contrato nulo por usura.'
      )}
      ${kpis([
        { label: 'Prestação mensal', value: euro.format(r.installmentAllIn) },
        { label: 'TAEG estimada', value: pct.format(r.taeg), tone: r.taeg > r.taegCap ? 'bad' : 'ok' },
        { label: 'MTIC', value: euro.format(r.mtic) },
        { label: 'Valor líquido recebido', value: euro.format(r.cashReceived) }
      ])}
      ${checksHtml(r.checks)}
      <table>
        <tr><td>Imposto do Selo (crédito consumo)</td><td>${euro.format(r.isCredit)}</td></tr>
        <tr><td>Juros totais</td><td>${euro.format(r.schedule.totalInterest)}</td></tr>
        <tr><td>Teto TAEG indicativo</td><td>${pct.format(r.taegCap)}</td></tr>
      </table>
      <p class="note">Confirme o limite de usura do trimestre em vigor no Banco de Portugal. Não inclui eventuais seguros facultativos nem penalizações por incumprimento.</p>
      <h3>Plano de amortização</h3>
      ${scheduleTable(r.schedule.rows)}
    </div>`
}

document.querySelectorAll('.tab').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('is-active', b === btn))
    document.querySelectorAll('.panel').forEach((p) => {
      p.classList.toggle('is-active', p.id === `panel-${btn.dataset.tab}`)
    })
  })
})

const housingForm = document.getElementById('form-housing')
const mixedWrap = document.getElementById('mixed-years-wrap')
const tanInput = housingForm.elements.tan
const euriborInput = housingForm.elements.euribor
const spreadInput = housingForm.elements.spread

function syncTan() {
  const e = Number(euriborInput.value) || 0
  const s = Number(spreadInput.value) || 0
  tanInput.value = (e + s).toFixed(2)
}
euriborInput.addEventListener('input', syncTan)
spreadInput.addEventListener('input', syncTan)
housingForm.elements.rateType.addEventListener('change', (ev) => {
  mixedWrap.classList.toggle('is-hidden', ev.target.value !== 'mixed')
})

const youngFirst = housingForm.elements.youngFirstHome
const youngGuarantee = housingForm.elements.youngPublicGuarantee
const youngHint = document.getElementById('young-age-hint')
const youngOptions = document.getElementById('young-options')
const yearsInput = housingForm.elements.years

function runHousing() {
  const data = formData(housingForm)
  if (!data.tan) data.tan = (Number(data.euribor) + Number(data.spread)) / 100
  else data.tan = data.tan / 100
  data.youngFirstHome = Boolean(youngFirst.checked) && !youngFirst.disabled
  data.youngPublicGuarantee = Boolean(youngGuarantee.checked) && !youngGuarantee.disabled
  renderHousing(document.getElementById('results-housing'), simulateHousing(data))
}

function syncYoungEligibility() {
  const ages = [Number(housingForm.elements.age1.value) || 0, Number(housingForm.elements.age2.value) || 0]
    .filter((a) => a > 0)
  const eligible = ages.length > 0 && ages.every((a) => a <= 35)
  const maxYears = ages.length && ages.some((a) => a > 35) ? 35 : 40
  yearsInput.max = String(maxYears)
  if (Number(yearsInput.value) > maxYears) yearsInput.value = String(maxYears)
  youngOptions.hidden = !eligible
  youngOptions.classList.toggle('is-hidden', !eligible)
  youngOptions.setAttribute('aria-hidden', eligible ? 'false' : 'true')
  ;[youngFirst, youngGuarantee].forEach((el) => {
    el.disabled = !eligible
    if (!eligible) el.checked = false
  })
  youngHint.hidden = eligible
}

;['age1', 'age2'].forEach((name) => {
  housingForm.elements[name].addEventListener('input', () => {
    syncYoungEligibility()
    runHousing()
  })
  housingForm.elements[name].addEventListener('change', () => {
    syncYoungEligibility()
    runHousing()
  })
})
syncYoungEligibility()

housingForm.addEventListener('submit', (ev) => {
  ev.preventDefault()
  syncYoungEligibility()
  runHousing()
})

document.getElementById('form-personal').addEventListener('submit', (ev) => {
  ev.preventDefault()
  const data = formData(ev.currentTarget)
  data.tan = data.tan / 100
  const r = simulatePersonal(data)
  renderPersonal(document.getElementById('results-personal'), r)
})

tanInput.value = ((DEFAULTS.euribor12m + DEFAULTS.spreadHousing) * 100).toFixed(2)
housingForm.requestSubmit()
document.getElementById('form-personal').requestSubmit()
