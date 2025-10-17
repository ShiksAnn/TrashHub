const app = document.getElementById("app");
const year = document.getElementById("year");
year.textContent = new Date().getFullYear();

let view = "home";
let requests = [
  { id: 1, name: "House 12", type: "Regular", time: "2025-09-23 08:00", status: "Scheduled" },
  { id: 2, name: "Shop A", type: "E-waste", time: "2025-09-23 11:00", status: "Scheduled" },
];

function setView(v) {
  view = v;
  render();
}

function render() {
  app.innerHTML = "";
  if (view === "home") renderHome();
  else if (view === "resident") renderResident();
  else if (view === "collector") renderCollector();
  else if (view === "admin") renderAdmin();
}

function renderHome() {
  app.innerHTML = `
    <section class="grid-2">
      <div>
        <h2>TrashHub — Clean cities, smart pickups</h2>
        <p>Schedule pickups, track collection trucks, and turn waste into value. Pilot-ready for Nairobi & Mombasa estates.</p>
        <button class="primary" onclick="setView('resident')">Request Pickup</button>
        <button class="secondary" onclick="setView('admin')">Admin Dashboard</button>
        <div style="margin-top:20px;">
          <ul>
            <li>Real-time tracking (Google Maps API placeholder)</li>
            <li>Recycling marketplace connections</li>
            <li>Subscription plans for estates</li>
            <li>IntaSend payments supported</li>
          </ul>
        </div>
      </div>
      <div>
        <h3>Quick Demo: Request a pickup</h3>
        ${pickupFormHTML()}
      </div>
    </section>
  `;
  attachPickupForm();
}

function pickupFormHTML() {
  return `
    <form id="pickupForm">
      <input id="name" placeholder="House / Business name" />
      <select id="type">
        <option>Regular</option>
        <option>Recyclables</option>
        <option>Bulk</option>
        <option>E-waste</option>
      </select>
      <input type="datetime-local" id="date" />
      <button class="primary" type="submit">Request</button>
      <button class="secondary" type="button" id="clearBtn">Clear</button>
    </form>
  `;
}

function attachPickupForm() {
  const form = document.getElementById("pickupForm");
  const clearBtn = document.getElementById("clearBtn");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value || "Demo Household";
    const type = document.getElementById("type").value;
    const date = document.getElementById("date").value || new Date().toISOString();

    const id = Math.max(0, ...requests.map(r => r.id)) + 1;
    requests.unshift({ id, name, type, time: date, status: "Scheduled" });
    alert("Pickup requested!");
    setView("resident");
  });

  clearBtn.addEventListener("click", () => {
    form.reset();
  });
}

function renderResident() {
  app.innerHTML = `
    <section class="grid-2">
      <div>
        <h3>Resident Portal</h3>
        <p>Schedule pickups, view status, and manage payments (MPesa / IntaSend placeholder).</p>
        ${pickupFormHTML()}
      </div>
      <div>
        <h4>Tips to recycle</h4>
        <ul>
          <li>Rinse and sort plastics by type.</li>
          <li>Keep e-waste separate in labeled boxes.</li>
          <li>Compost food waste where possible.</li>
        </ul>
      </div>
    </section>
  `;
  attachPickupForm();
}

function renderCollector() {
  app.innerHTML = `
    <section>
      <h3>Collector App (Demo)</h3>
      <p>View today's pickups and mark as collected.</p>
      <div id="collectorList"></div>
    </section>
  `;
  const list = document.getElementById("collectorList");
  list.innerHTML = requests.map(r => `
    <div class="request-item">
      <div>
        <div><strong>${r.name}</strong></div>
        <div style="font-size:12px;color:gray;">${r.type} • ${r.time}</div>
      </div>
      <div>
        <span class="status ${r.status.toLowerCase()}">${r.status}</span>
        ${r.status !== "Collected" ? `<button class="primary" onclick="markCollected(${r.id})">Mark Collected</button>` : ""}
      </div>
    </div>
  `).join("");
}

function markCollected(id) {
  requests = requests.map(r => r.id === id ? { ...r, status: "Collected" } : r);
  renderCollector();
}

function renderAdmin() {
  const total = requests.length;
  const collected = requests.filter(r => r.status === "Collected").length;
  app.innerHTML = `
    <section>
      <h3>Admin Dashboard</h3>
      <div class="grid-2">
        <div><strong>Total Requests:</strong> ${total}</div>
        <div><strong>Collected:</strong> ${collected}</div>
        <div><strong>Pending:</strong> ${total - collected}</div>
      </div>
      <h4 style="margin-top:20px;">Recent Requests</h4>
      <div id="adminList"></div>
    </section>
  `;
  const list = document.getElementById("adminList");
  list.innerHTML = requests.map(r => `
    <div class="request-item">
      <div>
        <div><strong>${r.name}</strong></div>
        <div style="font-size:12px;color:gray;">${r.type} • ${r.time}</div>
      </div>
      <div>
        <span class="status ${r.status.toLowerCase()}">${r.status}</span>
        <button class="secondary" onclick="deleteRequest(${r.id})">Delete</button>
      </div>
    </div>
  `).join("");
}

function deleteRequest(id) {
  requests = requests.filter(r => r.id !== id);
  renderAdmin();
}

render();
