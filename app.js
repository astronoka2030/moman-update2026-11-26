"use strict";

const $ = id => document.getElementById(id);

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[c]);
}

function format(value) {
  return escapeHTML(value).replace(
    /\*\*(.+?)\*\*/g,
    "<strong>$1</strong>"
  );
}

async function loadJSON(file) {
  const response = await fetch(file);

  if (!response.ok) {
    throw new Error(`${file}の読み込みに失敗しました`);
  }

  return response.json();
}

function renderBlock(block) {
  switch (block.type) {

    case "heading":
      return `<h3>${format(block.text)}</h3>`;

    case "text":
      return `<p>${format(block.text)}</p>`;

    case "list":
      return `
        <ol class="numbered">
          ${block.items.map(item =>
            `<li>${format(item)}</li>`
          ).join("")}
        </ol>
      `;

    case "bullets":
      return `
        <ul class="bullets">
          ${block.items.map(item =>
            `<li>${format(item)}</li>`
          ).join("")}
        </ul>
      `;

    case "table":
      return `
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                ${block.headers.map(header =>
                  `<th>${format(header)}</th>`
                ).join("")}
              </tr>
            </thead>
            <tbody>
              ${block.rows.map(row => `
                <tr>
                  ${row.map(cell =>
                    `<td>${format(cell)}</td>`
                  ).join("")}
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;

    case "quality": {
      const colors = [
        ["白", "white"],
        ["緑", "green"],
        ["青", "blue"],
        ["紫", "purple"],
        ["橙", "orange"],
        ["赤", "red"]
      ];

      return `
        <div class="diagram">
          <div class="diagram-title">
            陣形の品質順
          </div>
          <div class="quality-flow">
            ${colors.map(([label, color]) => `
              <span class="quality quality-${color}">
                ${label}
              </span>
            `).join('<span class="arrow">›</span>')}
          </div>
          <div class="diagram-note">
            白〜橙：星固定 ／ 赤：星昇級可能
          </div>
        </div>
      `;
    }

    case "flow": {
      const allowedColors = [
        "gold", "silver", "bronze"
      ];

      const arrow = block.direction === "up"
        ? "↑" : "↓";

      return `
        <div class="diagram">
          ${block.title ? `
            <div class="diagram-title">
              ${format(block.title)}
            </div>
          ` : ""}
          <div class="vertical-flow">
            ${block.steps.map(step => {
              const color = allowedColors.includes(step.color)
                ? `flow-${step.color}` : "";

              return `
                <div class="flow-step ${color}">
                  ${format(step.label)}
                  ${step.note ? `
                    <small>${format(step.note)}</small>
                  ` : ""}
                </div>
              `;
            }).join(`<span class="arrow">${arrow}</span>`)}
          </div>
          ${block.note ? `
            <div class="diagram-note">
              ${format(block.note)}
            </div>
          ` : ""}
        </div>
      `;
    }

    case "notice":
      return `
        <div class="notice">
          ${format(block.text)}
        </div>
      `;

    default:
      return "";
  }
}

function renderCards(target, data) {
  $(target).innerHTML = data.map(item => `
    <details>
      <summary>${format(item.title)}</summary>
      <div class="detail-body">
        ${item.blocks.map(renderBlock).join("")}
      </div>
    </details>
  `).join("");
}

/* メンテナンスカード */

function renderMaintenance(maintenance) {
  $("maintenance").innerHTML = `
    <div class="maintenance">

      <div class="maintenance-header">

        <div class="maintenance-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true">
            <rect x="3" y="5" width="18" height="16" rx="2"/>
            <path d="M16 3v4M8 3v4M3 10h18"/>
            <path d="M12 13v3l2 1"/>
          </svg>
        </div>

        <div>
          <div class="maintenance-label">
            SCHEDULED MAINTENANCE
          </div>
          <h2>定例メンテナンス</h2>
        </div>

      </div>

      <div class="maintenance-body">

        <div class="maintenance-date">
          ${format(maintenance.date)}
        </div>

        <div class="maintenance-schedule">

          <div class="maintenance-time">
            <span>${format(maintenance.start)}</span>
            <span class="maintenance-separator">—</span>
            <span>${format(maintenance.end)}</span>
          </div>

          <span class="maintenance-duration">
            ${format(maintenance.duration)}
          </span>

        </div>

        <div class="maintenance-note">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true">
            <circle cx="12" cy="12" r="9"/>
            <path d="M12 11v5"/>
            <path d="M12 8h.01"/>
          </svg>

          <span>${format(maintenance.note)}</span>
        </div>

        <p class="maintenance-disclaimer">
          ${format(maintenance.disclaimer)}
        </p>

      </div>

    </div>
  `;
}

/* AI要点まとめ */

function renderSummary(data) {
  renderMaintenance(data.maintenance);

  $("summary-content").innerHTML = `
    <details>
      <summary>重要な変更点を確認する</summary>
      <div class="detail-body">
        ${data.highlights.map(item => `
          <div class="highlight">
            <h3>${format(item.title)}</h3>
            <p>${format(item.text)}</p>
          </div>
        `).join("")}
      </div>
    </details>
  `;
}

/* ナビゲーション */

function setupNavigation() {
  const links = [
    ...document.querySelectorAll(".navigation a")
  ];

  const sections = links.map(link =>
    document.querySelector(link.getAttribute("href"))
  );

  function update() {
    let active = 0;

    sections.forEach((section, index) => {
      if (section.getBoundingClientRect().top <= 110) {
        active = index;
      }
    });

    links.forEach((link, index) => {
      link.classList.toggle("active", index === active);
    });

    $("back-top").classList.toggle(
      "visible", window.scrollY > 500
    );
  }

  window.addEventListener("scroll", update, {
    passive: true
  });

  document.addEventListener("toggle", update, true);

  $("back-top").addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });

  update();
}

/* JSON読み込み */

async function init() {
  const jobs = [
    {
      file: "summary.json",
      target: "summary-content",
      render: renderSummary
    },
    {
      file: "additions.json",
      target: "additions-content",
      render: data => renderCards(
        "additions-content", data
      )
    },
    {
      file: "adjustments.json",
      target: "adjustments-content",
      render: data => renderCards(
        "adjustments-content", data
      )
    },
    {
      file: "fixes.json",
      target: "fixes-content",
      render: data => renderCards(
        "fixes-content", data
      )
    }
  ];

  await Promise.all(jobs.map(async job => {
    try {
      const data = await loadJSON(job.file);
      job.render(data);
    } catch (error) {
      $(job.target).innerHTML = `
        <div class="error">
          ${escapeHTML(error.message)}
        </div>
      `;
    }
  }));

  setupNavigation();
}

document.addEventListener("DOMContentLoaded", init);