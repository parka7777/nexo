const state = {
  user: null,
  requests: [],
  loans: [],
  payments: [],
  activities: []
};

const $ = (id) => document.getElementById(id);

function money(value) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function initials(name) {
  return name.split(" ").slice(0, 2).map(x => x[0]).join("").toUpperCase();
}

function setSection(id) {
  document.querySelectorAll(".page-section").forEach(s => s.classList.remove("active"));
  const target = $(id);
  if (target) target.classList.add("active");

  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.section === id);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
  if (id === "estado") renderRequests();
  if (id === "pagos") renderPayments();
  if (id === "empleado") renderEmployee();
}

function enterDashboard() {
  $("authView").classList.add("hidden");
  $("dashboardView").classList.remove("hidden");

  $("welcomeName").textContent = state.user.name.split(" ")[0];
  $("sideName").textContent = state.user.name;
  $("avatar").textContent = initials(state.user.name);

  renderAll();
  setSection("inicio");
}

function resetDemoData() {
  state.requests = [];
  state.loans = [];
  state.payments = [];
  state.activities = [{
    title: "Cuenta preparada",
    text: "El cliente está listo para iniciar una solicitud.",
    icon: "✓"
  }];
}

$("registerForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const password = $("regPassword").value;
  const password2 = $("regPassword2").value;

  if (password !== password2) {
    showToast("Las contraseñas no coinciden.");
    return;
  }

  state.user = {
    name: $("regName").value.trim(),
    dni: $("regDni").value.trim(),
    email: $("regEmail").value.trim(),
    income: Number($("regIncome").value)
  };

  resetDemoData();
  showToast("Cliente registrado correctamente.");
  setTimeout(enterDashboard, 350);
});

$("demoLogin").addEventListener("click", () => {
  state.user = {
    name: "Milton Pérez",
    dni: "45123456",
    email: "cliente@demo.com",
    income: 750000
  };
  resetDemoData();
  showToast("Ingresaste al modo demostración.");
  setTimeout(enterDashboard, 350);
});

$("logoutBtn").addEventListener("click", () => {
  $("dashboardView").classList.add("hidden");
  $("authView").classList.remove("hidden");
  $("registerForm").reset();
});

document.addEventListener("click", (event) => {
  const nav = event.target.closest("[data-section]");
  if (nav) setSection(nav.dataset.section);

  const go = event.target.closest("[data-go]");
  if (go) setSection(go.dataset.go);

  const approve = event.target.closest("[data-approve]");
  if (approve) decideRequest(approve.dataset.approve, "Aprobada");

  const reject = event.target.closest("[data-reject]");
  if (reject) decideRequest(reject.dataset.reject, "Rechazada");

  const pay = event.target.closest("[data-pay]");
  if (pay) registerPayment(pay.dataset.pay);
});

$("loanForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const amount = Number($("loanAmount").value);
  const term = Number($("loanTerm").value);
  const type = $("loanType").value;
  const docs = $("loanDocs").value.trim();

  if (!type || !amount || !term || !docs) {
    showToast("Completá todos los datos de la solicitud.");
    return;
  }

  const request = {
    id: `SOL-${String(state.requests.length + 1).padStart(4, "0")}`,
    type,
    amount,
    term,
    docs,
    date: new Date().toLocaleDateString("es-AR"),
    status: "Pendiente",
    evaluation: null
  };

  // Proceso 3.0: evaluación crediticia simulada.
  const income = state.user.income;
  const ratio = amount / Math.max(income, 1);
  let score = ratio <= 2 ? 780 : ratio <= 4 ? 690 : 590;
  let risk = score >= 750 ? "Bajo" : score >= 650 ? "Medio" : "Alto";
  let recommendation = score >= 650 ? "Recomendada" : "No recomendada";

  request.evaluation = {
    score,
    risk,
    recommendation,
    history: "Sin antecedentes registrados en esta demostración."
  };

  state.requests.unshift(request);
  state.activities.unshift({
    title: `Solicitud ${request.id} registrada`,
    text: `Evaluación: ${recommendation.toLowerCase()} · Riesgo ${risk}.`,
    icon: "↗"
  });

  $("loanForm").reset();
  renderAll();
  showToast(`Solicitud ${request.id} enviada a evaluación crediticia.`);
  setSection("estado");
});

function decideRequest(id, decision) {
  const request = state.requests.find(r => r.id === id);
  if (!request || request.status !== "Pendiente") return;

  request.status = decision;

  if (decision === "Aprobada") {
    const interest = 0.55;
    const monthlyRate = interest / 12;
    const n = request.term;
    const amount = request.amount;
    const installment = monthlyRate === 0
      ? amount / n
      : amount * (monthlyRate * Math.pow(1 + monthlyRate, n)) /
        (Math.pow(1 + monthlyRate, n) - 1);

    const loan = {
      id: `PRE-${String(state.loans.length + 1).padStart(4, "0")}`,
      requestId: request.id,
      type: request.type,
      amount,
      term: n,
      installment: Math.round(installment),
      paid: 0,
      status: "Activa",
      centralConfirmed: true
    };

    state.loans.unshift(loan);
    state.activities.unshift({
      title: `Préstamo ${loan.id} otorgado`,
      text: `${money(amount)} · ${n} cuotas.`,
      icon: "$"
    });
    showToast(`${id} aprobada y préstamo generado.`);
  } else {
    state.activities.unshift({
      title: `Solicitud ${id} rechazada`,
      text: "La decisión fue registrada por el empleado bancario.",
      icon: "!"
    });
    showToast(`${id} marcada como rechazada.`);
  }

  renderAll();
  setSection("empleado");
}

function registerPayment(loanId) {
  const loan = state.loans.find(l => l.id === loanId);
  if (!loan || loan.paid >= loan.term) return;

  loan.paid += 1;
  const payment = {
    id: `PAG-${String(state.payments.length + 1).padStart(4, "0")}`,
    loanId,
    installment: loan.paid,
    amount: loan.installment,
    date: new Date().toLocaleDateString("es-AR"),
    centralConfirmed: true
  };

  state.payments.unshift(payment);

  if (loan.paid >= loan.term) loan.status = "Cancelado";

  state.activities.unshift({
    title: `Pago ${payment.id} confirmado`,
    text: `Cuota ${payment.installment} de ${loan.term} · ${money(payment.amount)}.`,
    icon: "✓"
  });

  showToast("Pago confirmado por el sistema bancario central.");
  renderAll();
  setSection("pagos");
}

function renderStats() {
  $("statRequests").textContent = state.requests.length;
  $("statLoans").textContent = state.loans.filter(l => l.status === "Activa").length;
  $("statPayments").textContent = state.payments.length;
}

function renderActivity() {
  const list = $("activityList");
  if (!state.activities.length) {
    list.innerHTML = `<div class="empty"><strong>Sin actividad</strong>Comenzá registrando una solicitud.</div>`;
    return;
  }

  list.innerHTML = state.activities.slice(0, 5).map(a => `
    <div class="activity">
      <div class="activity-icon">${a.icon}</div>
      <div>
        <strong>${a.title}</strong>
        <span>${a.text}</span>
      </div>
    </div>
  `).join("");
}

function renderRequests() {
  const list = $("requestsList");

  if (!state.requests.length) {
    list.innerHTML = `
      <div class="empty">
        <strong>No hay solicitudes todavía</strong>
        Registrá una solicitud para comenzar el proceso.
      </div>`;
    return;
  }

  list.innerHTML = state.requests.map(r => `
    <article class="request-card">
      <div class="card-top">
        <div>
          <h3>${r.id} · ${r.type}</h3>
          <span class="muted">Registrada el ${r.date}</span>
        </div>
        <span class="status ${r.status.toLowerCase()}">${r.status}</span>
      </div>
      <div class="detail-grid">
        <div class="detail"><span>Monto solicitado</span><strong>${money(r.amount)}</strong></div>
        <div class="detail"><span>Plazo</span><strong>${r.term} cuotas</strong></div>
        <div class="detail"><span>Score crediticio</span><strong>${r.evaluation.score}</strong></div>
        <div class="detail"><span>Nivel de riesgo</span><strong>${r.evaluation.risk}</strong></div>
        <div class="detail"><span>Recomendación</span><strong>${r.evaluation.recommendation}</strong></div>
        <div class="detail"><span>Documentación</span><strong>Presentada</strong></div>
      </div>
    </article>
  `).join("");
}

function renderEmployee() {
  const list = $("employeeList");
  const pending = state.requests.filter(r => r.status === "Pendiente");

  if (!pending.length) {
    list.innerHTML = `
      <div class="empty">
        <strong>No hay solicitudes pendientes</strong>
        Las nuevas solicitudes aparecerán aquí para su revisión.
      </div>`;
    return;
  }

  list.innerHTML = pending.map(r => `
    <article class="request-card">
      <div class="card-top">
        <div>
          <h3>${r.id} · ${r.type}</h3>
          <span class="muted">Cliente: ${state.user.name} · DNI ${state.user.dni}</span>
        </div>
        <span class="status pendiente">Pendiente</span>
      </div>
      <div class="detail-grid">
        <div class="detail"><span>Monto</span><strong>${money(r.amount)}</strong></div>
        <div class="detail"><span>Plazo</span><strong>${r.term} cuotas</strong></div>
        <div class="detail"><span>Score</span><strong>${r.evaluation.score}</strong></div>
        <div class="detail"><span>Riesgo</span><strong>${r.evaluation.risk}</strong></div>
        <div class="detail"><span>Recomendación</span><strong>${r.evaluation.recommendation}</strong></div>
        <div class="detail"><span>Documentación</span><strong>Presentada</strong></div>
      </div>
      <div class="employee-actions">
        <button class="action-btn approve" data-approve="${r.id}">APROBAR</button>
        <button class="action-btn reject" data-reject="${r.id}">RECHAZAR</button>
      </div>
    </article>
  `).join("");
}

function renderPayments() {
  const container = $("paymentsContent");

  if (!state.loans.length) {
    container.innerHTML = `
      <div class="empty">
        <strong>No hay préstamos activos</strong>
        Cuando una solicitud sea aprobada, sus cuotas aparecerán aquí.
      </div>`;
    return;
  }

  container.innerHTML = `<div class="cards-list">${state.loans.map(loan => `
    <article class="payment-card">
      <div class="payment-row">
        <div>
          <h3>${loan.id} · ${loan.type}</h3>
          <span class="muted">${money(loan.installment)} por cuota · ${loan.paid}/${loan.term} cuotas pagadas</span>
        </div>
        <button class="primary-btn pay-btn" data-pay="${loan.id}" ${loan.paid >= loan.term ? "disabled" : ""}>
          ${loan.paid >= loan.term ? "CANCELADO" : "REGISTRAR PAGO"}
        </button>
      </div>
      <div class="detail-grid">
        <div class="detail"><span>Monto original</span><strong>${money(loan.amount)}</strong></div>
        <div class="detail"><span>Estado</span><strong>${loan.status}</strong></div>
        <div class="detail"><span>Sistema bancario</span><strong>${loan.centralConfirmed ? "Confirmado" : "Pendiente"}</strong></div>
      </div>
    </article>
  `).join("")}</div>`;
}

function renderAll() {
  renderStats();
  renderActivity();
  renderRequests();
  renderPayments();
  renderEmployee();
}
