import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";

let server;
let userService;
let api;
let usePaginatedUsers;

before(async () => {
  server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
  ({ userService } = await server.ssrLoadModule("/src/features/users/services/userService.js"));
  ({ default: api } = await server.ssrLoadModule("/src/services/api.js"));
  ({ usePaginatedUsers } = await server.ssrLoadModule(
    "/src/features/users/composables/usePaginatedUsers.js",
  ));
});

after(async () => {
  await server?.close();
});

test("getAll envía la página y el límite al endpoint", async () => {
  const originalAdapter = api.defaults.adapter;
  try {
    api.defaults.adapter = async (config) => {
      assert.equal(config.url, "/users");
      assert.deepEqual(config.params, { page: 2, limit: 10 });
      return { data: { data: [] }, status: 200, statusText: "OK", headers: {}, config };
    };
    assert.deepEqual(await userService.getAll(2, 10), { data: [] });
  } finally {
    api.defaults.adapter = originalAdapter;
  }
});

test("acumula páginas, reintenta errores y reinicia tras recargar", async () => {
  const originalGetAll = userService.getAll;
  const calls = [];
  const firstPage = Array.from({ length: 10 }, (_, index) => ({ id: index + 1 }));
  let fail = true;
  try {
    userService.getAll = async (page, limit) => {
      calls.push([page, limit]);
      if (page === 1) return { data: firstPage };
      if (fail) throw new Error("network error");
      return { data: [{ id: 11 }] };
    };

    const state = usePaginatedUsers();
    await state.loadUsers();
    assert.equal(state.users.value.length, 10);
    assert.equal(state.hasMore.value, true);

    await state.loadUsers();
    assert.equal(state.users.value.length, 10);
    assert.ok(state.errorMessage.value);

    fail = false;
    await state.loadUsers();
    assert.deepEqual(state.users.value.map((user) => user.id), [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    ]);
    assert.equal(state.errorMessage.value, "");
    assert.equal(state.hasMore.value, false);
    await state.loadUsers();
    assert.deepEqual(calls, [[1, 10], [2, 10], [2, 10]]);

    await state.reloadUsers();
    assert.equal(state.users.value.length, 10);
    assert.equal(state.hasMore.value, true);
    assert.deepEqual(calls.at(-1), [1, 10]);
  } finally {
    userService.getAll = originalGetAll;
  }
});

test("rechaza respuestas inválidas y evita solicitudes simultáneas", async () => {
  const originalGetAll = userService.getAll;
  let resolveRequest;
  let calls = 0;
  try {
    userService.getAll = () => {
      calls++;
      return new Promise((resolve) => { resolveRequest = resolve; });
    };
    const state = usePaginatedUsers();
    const request = state.loadUsers();
    await state.loadUsers();
    assert.equal(calls, 1);
    resolveRequest({ data: {} });
    await request;
    assert.match(state.errorMessage.value, /no válida/);
    assert.equal(state.hasMore.value, true);
    assert.equal(state.loading.value, false);
  } finally {
    userService.getAll = originalGetAll;
  }
});

test("una página completa puede requerir una última consulta vacía", async () => {
  const originalGetAll = userService.getAll;
  const calls = [];
  try {
    userService.getAll = async (page) => {
      calls.push(page);
      return page === 1
        ? Array.from({ length: 10 }, (_, index) => ({ id: index + 1 }))
        : [];
    };
    const state = usePaginatedUsers();
    await state.loadUsers();
    assert.equal(state.hasMore.value, true);
    await state.loadUsers();
    assert.equal(state.hasMore.value, false);
    assert.equal(state.users.value.length, 10);
    assert.deepEqual(calls, [1, 2]);
  } finally {
    userService.getAll = originalGetAll;
  }
});
