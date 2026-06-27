# Headroom Agents Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cài Headroom ở user scope và cung cấp workflow token-efficient, an toàn cho cả Codex và Claude Code trong repo.

**Architecture:** Claude dùng transparent proxy wrapper; Codex giữ provider trực tiếp và dùng Headroom MCP. Một PowerShell launcher làm lớp ổn định để config repo không phụ thuộc vị trí executable.

**Tech Stack:** PowerShell 5.1+, uv tool, Headroom Python CLI, MCP stdio, Node/Vitest-style contract test.

---

### Task 1: Khóa contract launcher bằng test đỏ

**Files:**
- Create: `scripts/headroom-agent.test.mjs`

- [ ] **Step 1: Viết test đọc source**

Test phải yêu cầu các action `mcp`, `claude`, `stats`, `smoke`; telemetry off;
không có `OPENAI_API_KEY` hoặc `ANTHROPIC_API_KEY`; và không gọi
`headroom wrap codex`.

- [ ] **Step 2: Chạy test đỏ**

Run: `node --test scripts/headroom-agent.test.mjs`

Expected: FAIL vì launcher và docs chưa tồn tại.

### Task 2: Cài Headroom và xác định CLI thật

**Files:**
- User tool environment managed by `uv`; no repo dependency.

- [ ] **Step 1: Cài package tối thiểu**

Run: `uv tool install --force "headroom-ai[mcp,proxy]"`

- [ ] **Step 2: Kiểm tra command surface**

Run: `headroom --version`

Run: `headroom mcp --help`

Expected: CLI và MCP subcommand trả exit 0.

### Task 3: Tạo launcher và project config

**Files:**
- Create: `scripts/headroom-agent.ps1`
- Create: `.mcp.json`
- Modify: `package.json`

- [ ] **Step 1: Viết launcher**

Launcher tìm `headroom` từ PATH hoặc `~/.local/bin`, đặt
`HEADROOM_TELEMETRY=off`, dispatch action và giữ nguyên exit code.

- [ ] **Step 2: Thêm project MCP và npm aliases**

`.mcp.json` gọi action `mcp`; package scripts gọi `status`, `smoke`, `claude`.

- [ ] **Step 3: Chạy contract test**

Run: `node --test scripts/headroom-agent.test.mjs`

Expected: PASS.

### Task 4: Cấu hình Codex và tài liệu

**Files:**
- Create: `docs/agent/headroom.md`
- Modify: `AGENTS.md`
- Modify: `docs/agent/quickstart.md`
- User config: `~/.codex/config.toml` through `codex mcp add`.

- [ ] **Step 1: Viết hướng dẫn ngắn và rollback**

Tài liệu phải nêu rõ hybrid architecture, lệnh dùng, cách đo savings, giới hạn
Codex WebSocket và `codex mcp remove headroom`.

- [ ] **Step 2: Đăng ký Codex MCP**

Run Codex CLI bằng `CODEX_CLI_PATH` và thêm server `headroom` trỏ tới launcher
absolute path với action `mcp`.

- [ ] **Step 3: Xác minh cấu hình**

Run: `codex mcp get headroom`

Expected: server enabled, transport stdio.

### Task 5: Smoke và kiểm tra cuối

**Files:**
- No additional production files.

- [ ] **Step 1: Smoke compression**

Run: `npm run agent:headroom:smoke`

Expected: output báo token/character savings lớn hơn 0.

- [ ] **Step 2: Kiểm tra Claude fallback**

Run: `npm run agent:headroom:claude -- --version`

Expected on this machine: fail clearly because Claude CLI is not installed,
without modifying auth or Codex provider.

- [ ] **Step 3: Repo verification**

Run: `node --test scripts/headroom-agent.test.mjs`

Run: `git diff --check`

Expected: exit 0; existing SEO draft/state/report remain untouched.
