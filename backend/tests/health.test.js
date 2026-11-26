
import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";

describe("Endpoint de verificação da API", () => {

  it("deve responder com o estado 200", async () => {

    // Efetuar um pedido GET à API
    const response = await request(app).get("/api/health");

    // Verificar o código de resposta HTTP
    expect(response.status).toBe(200);

    // Verificar o estado devolvido pela API
    expect(response.body.status).toBe("ok");

  });

});
