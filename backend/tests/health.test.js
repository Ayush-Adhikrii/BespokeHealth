const request = require("supertest");
const app = require("../app");

describe("GET /api/health", () => {
  it("responds with 200 and status ok", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});
